// =====================================================
// import-player-catalog.mjs — nhập gói export cầu thủ vào Supabase đích
// Blueprint PLAYER-DATABASE-BLUEPRINT.md §6.3:
//   manifest → chunks (checksum + retry) → validate records
//   → top 100 POT + tính giá trên TOÀN TẬP → staging → kích hoạt nguyên tử
//
// Usage:
//   node scripts/import-player-catalog.mjs --from <dir|https-url> [options]
//
//   --from         thư mục chứa manifest.json + chunk files,
//                  HOẶC base URL https (gửi header
//                  Authorization: Bearer $PLAYER_CATALOG_SYNC_TOKEN)
//   --dry-run      validate + tính giá, in báo cáo JSON — KHÔNG ghi DB
//   --no-activate  insert staging nhưng bỏ qua bước kích hoạt
//   --force        cho phép import khi record_count < 70% bản active
//   --help         in usage
//
// Env (.env.local):
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — ghi DB
//   PLAYER_CATALOG_SYNC_TOKEN — chỉ cần khi --from là URL (không in ra)
// =====================================================

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

import {
  validateManifest,
  validateExportRecord,
  parseNdjsonChunk,
  normalizeExportRecord,
  sha256Hex,
} from "../lib/players/normalize.ts";
import {
  selectTopPotentialIds,
  computeEntryFinancials,
} from "../lib/players/pricing.ts";

dotenv.config({ path: ".env.local", quiet: true });

const FETCH_TIMEOUT_MS = 30_000;
const RETRY_DELAYS_MS = [1_000, 3_000, 9_000]; // retry tối đa 3 lần (URL)
const ENTRY_BATCH_SIZE = 500;
const DROP_GUARD_RATIO = 0.7; // record mới < 70% bản active cùng game → cảnh báo
const MAX_ERRORS_LOGGED = 20;

const USAGE = `Usage:
  node scripts/import-player-catalog.mjs --from <dir|https-url> [options]

Options:
  --from         thư mục chứa manifest.json + chunks, HOẶC base URL https
                 (URL mode gửi Authorization: Bearer $PLAYER_CATALOG_SYNC_TOKEN)
  --dry-run      validate + tính giá, in báo cáo JSON — KHÔNG ghi DB
  --no-activate  insert staging nhưng bỏ qua bước kích hoạt
  --force        cho phép import khi record_count < 70% bản active
  --help         in usage
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (msg) => console.log(msg);

/**
 * Lỗi abort pipeline — throw lên main().catch thay vì process.exit(1)
 * trực tiếp: process.exit() giữa lúc socket fetch (supabase/undici) đang
 * đóng gây crash libuv trên Windows (assert UV_HANDLE_CLOSING, exit 127).
 * Dùng process.exitCode để process tự thoát sạch với code khác 0.
 */
class AbortImport extends Error {}

function die(msg) {
  console.error(`✗ ${msg}`);
  process.exitCode = 1;
  throw new AbortImport();
}

function parseArgs(argv) {
  const args = {
    from: null,
    dryRun: false,
    noActivate: false,
    force: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--no-activate") args.noActivate = true;
    else if (a === "--force") args.force = true;
    else if (a === "--from") {
      const v = argv[++i];
      if (!v || v.startsWith("--")) die("--from cần giá trị <dir|url>");
      args.from = v;
    } else if (a.startsWith("--from=")) {
      args.from = a.slice("--from=".length);
    } else {
      die(`tham số không biết: ${a} (chạy --help để xem usage)`);
    }
  }
  return args;
}

/**
 * Fetch text có timeout 30s + retry tối đa 3 lần (backoff 1s/3s/9s).
 * 4xx là lỗi quyền/tài nguyên — retry vô ích nên abort ngay.
 */
async function fetchText(url, headers) {
  let lastErr = null;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (res.ok) return await res.text();
      const err = new Error(`HTTP ${res.status}`);
      err.noRetry = res.status >= 400 && res.status < 500;
      throw err;
    } catch (err) {
      lastErr = err;
      if (err.noRetry || attempt === RETRY_DELAYS_MS.length) break;
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }
  throw lastErr;
}

/**
 * Mở nguồn gói export: trả manifest text + hàm đọc chunk.
 * URL mode: https + Bearer token từ env (không nhận token qua argv, không in).
 */
function openSource(from) {
  if (/^http:\/\//i.test(from)) die("--from URL phải là https");
  if (/^https:\/\//i.test(from)) {
    const token = process.env.PLAYER_CATALOG_SYNC_TOKEN;
    if (!token) die("chế độ URL cần env PLAYER_CATALOG_SYNC_TOKEN");
    const base = from.endsWith("/") ? from : `${from}/`;
    const headers = { Authorization: `Bearer ${token}` };
    return {
      kind: "url",
      manifestText: fetchText(`${base}manifest.json`, headers),
      readChunk: (file) => fetchText(base + file, headers),
    };
  }
  const dir = path.resolve(from);
  const manifestPath = path.join(dir, "manifest.json");
  if (!fs.existsSync(manifestPath)) die(`không tìm thấy ${manifestPath}`);
  return {
    kind: "dir",
    manifestText: Promise.resolve(fs.readFileSync(manifestPath, "utf8")),
    readChunk: (file) => {
      // Chặn path traversal ở cả tầng resolve — manifest là dữ liệu ngoài,
      // không tin tên file kể cả khi đã qua assertSafeChunkName.
      const resolved = path.resolve(dir, file);
      if (resolved !== dir && !resolved.startsWith(dir + path.sep)) {
        die(`chunk path ngoài thư mục export: ${file}`);
      }
      return Promise.resolve(fs.readFileSync(resolved, "utf8"));
    },
  };
}

/**
 * Tên chunk trong manifest: chỉ segment an toàn (cho phép "chunks/…" như
 * exporter emit), cấm "..", backslash, path tuyệt đối — chặn traversal.
 */
const SAFE_CHUNK_RE = /^[\w.-]+(?:\/[\w.-]+)*$/;
function assertSafeChunkName(file) {
  if (!SAFE_CHUNK_RE.test(file) || file.includes("..")) {
    die(`tên chunk không an toàn trong manifest: ${file}`);
  }
}

/**
 * Chuẩn hoá + tính giá 1 record → row player_catalog_entries (chưa gắn
 * release_id). droppedStatKeys KHÔNG ghi DB — chỉ gom để báo cáo.
 */
function buildEntryRow(rec, topIds, manifest) {
  const { droppedStatKeys, ...cols } = normalizeExportRecord(rec);
  const fin = computeEntryFinancials(
    rec,
    topIds.has(rec.id),
    manifest.career_source != null
  );
  return {
    droppedStatKeys,
    row: {
      ...cols,
      base_value_eur: fin.base_value_eur,
      base_value_kind: fin.base_value_kind,
      valuation_date: fin.valuation_date,
      valuation_source_name:
        fin.base_value_kind === "market" ? manifest.market_source_name : null,
      valuation_source_url: fin.valuation_source_url,
      adjustment_bps: fin.adjustment_bps,
      is_top_potential: fin.is_top_potential,
      reference_value_eur: fin.reference_value_eur,
      weekly_wage_eur: fin.weekly_wage_eur,
      wage_basis: fin.wage_basis,
    },
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    log(USAGE);
    return;
  }
  if (!args.from) die("thiếu --from <dir|url>. Chạy --help để xem usage.");

  log("━━━ Player catalog importer — blueprint §6.3 ━━━");

  // ── Bước 1: manifest ───────────────────────────────────────────────
  const src = openSource(args.from);
  let manifest;
  try {
    manifest = JSON.parse(await src.manifestText);
  } catch {
    die("manifest.json không parse được (JSON hỏng)");
  }
  const mErrs = validateManifest(manifest);
  if (mErrs.length) {
    console.error("✗ manifest không hợp lệ:");
    for (const e of mErrs) console.error(`  - ${e}`);
    process.exitCode = 1;
    return;
  }
  log(
    `✓ manifest (${src.kind}): export ${manifest.export_id} · ` +
      `game ${manifest.game_version} · data_date ${manifest.data_date} · ` +
      `${manifest.record_count} records / ${manifest.chunks.length} chunk(s)`
  );

  // ── Bước 2-3: chunk → checksum → NDJSON → validate records ────────
  const records = [];
  const seenIds = new Set();
  const recordErrors = [];
  for (const chunk of manifest.chunks) {
    assertSafeChunkName(chunk.file);
    let content;
    try {
      content = await src.readChunk(chunk.file);
    } catch (err) {
      die(`tải chunk ${chunk.file} lỗi: ${err.message}`);
    }
    const sum = sha256Hex(content);
    if (sum !== chunk.sha256.toLowerCase()) {
      die(`checksum sai ở ${chunk.file}: ${sum.slice(0, 12)}… ≠ manifest`);
    }
    let parsed;
    try {
      parsed = parseNdjsonChunk(content);
    } catch (err) {
      die(`${chunk.file}: ${err.message}`);
    }
    if (parsed.length !== chunk.records) {
      die(
        `${chunk.file}: đếm được ${parsed.length} records ` +
          `nhưng manifest ghi ${chunk.records}`
      );
    }
    for (let i = 0; i < parsed.length; i++) {
      const rec = parsed[i];
      const errs = validateExportRecord(rec);
      if (errs.length) {
        recordErrors.push({ file: chunk.file, index: i, id: rec?.id, errs });
        continue;
      }
      if (seenIds.has(rec.id)) {
        die(`id trùng giữa các record: ${rec.id} (file ${chunk.file})`);
      }
      seenIds.add(rec.id);
      records.push(rec);
    }
    log(`  chunk ${chunk.file}: ${parsed.length} records · checksum ok`);
  }

  // Record lỗi → từ chối toàn bộ gói, KHÔNG âm thầm bỏ dòng (§6.3.6)
  if (recordErrors.length) {
    console.error(
      `✗ ${recordErrors.length} record lỗi — từ chối toàn bộ gói export:`
    );
    for (const e of recordErrors.slice(0, MAX_ERRORS_LOGGED)) {
      console.error(
        `  - ${e.file}#${e.index} (id=${e.id ?? "?"}): ${e.errs.join("; ")}`
      );
    }
    if (recordErrors.length > MAX_ERRORS_LOGGED) {
      console.error(`  … và ${recordErrors.length - MAX_ERRORS_LOGGED} lỗi nữa`);
    }
    process.exitCode = 1;
    return;
  }
  if (records.length !== manifest.record_count) {
    die(
      `tổng records đọc được ${records.length} ≠ ` +
        `record_count ${manifest.record_count} trong manifest`
    );
  }
  log(`✓ ${records.length} records hợp lệ — checksum khớp, không trùng id`);

  // ── Bước 4-5: normalize + top 100 POT + giá trên TOÀN TẬP ─────────
  const topIds = selectTopPotentialIds(records);
  const built = records.map((r) => buildEntryRow(r, topIds, manifest));
  const droppedKeyNames = new Set();
  let droppedStatKeys = 0;
  for (const b of built) {
    droppedStatKeys += b.droppedStatKeys.length;
    for (const k of b.droppedStatKeys) droppedKeyNames.add(k);
  }
  const report = {
    records: records.length,
    top100: topIds.size,
    marketCount: built.filter((b) => b.row.base_value_kind === "market").length,
    careerCount: built.filter((b) => b.row.base_value_kind === "career").length,
    unknownPrice: built.filter((b) => b.row.base_value_kind === "unknown")
      .length,
    missingWage: built.filter((b) => b.row.weekly_wage_eur == null).length,
    droppedStatKeys,
    droppedStatKeyNames: [...droppedKeyNames].sort(),
  };
  log(
    `✓ pricing: top POT ${report.top100} · market ${report.marketCount} · ` +
      `career ${report.careerCount} · unknown ${report.unknownPrice} · ` +
      `thiếu lương ${report.missingWage}`
  );

  if (args.dryRun) {
    log("\n--- dry-run report (không ghi DB) ---");
    log(JSON.stringify(report, null, 2));
    return;
  }

  // ── Bước 6: ghi DB qua service key ─────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    die("thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (.env.local)");
  }
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Sanity baseline: record mới sụt < 70% so với bản active cùng game →
  // giữ bản cũ, báo người vận hành (§6.3), trừ khi --force đã xác minh.
  const { data: active, error: baseErr } = await supabase
    .from("player_catalog_releases")
    .select("id, record_count")
    .eq("game_version", manifest.game_version)
    .eq("status", "active")
    .maybeSingle();
  if (baseErr) die(`đọc baseline active lỗi: ${baseErr.message}`);
  if (active && records.length < active.record_count * DROP_GUARD_RATIO) {
    console.error(
      `⚠ record mới ${records.length} < ${DROP_GUARD_RATIO * 100}% bản ` +
        `active hiện tại (${active.record_count}) — §6.3 giữ bản cũ.`
    );
    if (!args.force) {
      die("dừng import. Chạy lại với --force nếu đã xác minh dữ liệu nguồn.");
    }
    console.error("  --force được truyền: tiếp tục sau cảnh báo.");
  }

  // Insert release staging → id
  const { data: release, error: relErr } = await supabase
    .from("player_catalog_releases")
    .insert({
      export_id: manifest.export_id,
      game_version: manifest.game_version,
      data_date: manifest.data_date,
      manifest,
      record_count: records.length,
      status: "staging",
    })
    .select("id")
    .single();
  if (relErr) die(`insert release lỗi: ${relErr.message}`);
  const releaseId = release.id;
  log(`✓ release staging: ${releaseId}`);

  // Insert entries theo batch — lỗi giữa chừng → đánh dấu failed
  const rows = built.map((b) => ({ release_id: releaseId, ...b.row }));
  for (let i = 0; i < rows.length; i += ENTRY_BATCH_SIZE) {
    const batch = rows.slice(i, i + ENTRY_BATCH_SIZE);
    const { error } = await supabase
      .from("player_catalog_entries")
      .insert(batch);
    if (error) {
      await supabase
        .from("player_catalog_releases")
        .update({ status: "failed" })
        .eq("id", releaseId);
      die(
        `insert entries batch ${Math.floor(i / ENTRY_BATCH_SIZE) + 1} lỗi: ` +
          `${error.message} — release đã đánh dấu 'failed'`
      );
    }
    log(
      `  entries ${Math.min(i + ENTRY_BATCH_SIZE, rows.length)}/${rows.length}`
    );
  }

  // ── Bước 7: kích hoạt nguyên tử (archive bản cũ trong cùng txn) ────
  if (args.noActivate) {
    log(`✓ xong — release ${releaseId} đang 'staging' (--no-activate).`);
    log(JSON.stringify(report, null, 2));
    return;
  }
  const { error: actErr } = await supabase.rpc(
    "activate_player_catalog_release",
    { p_release_id: releaseId }
  );
  if (actErr) {
    // Giữ staging để vận hành tự gọi lại RPC sau khi sửa lỗi
    die(
      `kích hoạt lỗi: ${actErr.message} — release ${releaseId} vẫn ở 'staging'`
    );
  }
  log(`✓ release ${releaseId} đã active (bản cũ archived trong cùng txn).`);
  log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  // AbortImport đã in lỗi + set exitCode trong die() — không in lại
  if (!(err instanceof AbortImport)) {
    console.error(`✗ ${err?.message ?? err}`);
    process.exitCode = 1;
  }
});
