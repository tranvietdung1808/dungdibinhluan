// =====================================================
// Auth API Load Test Script
// =====================================================
// Usage:
//   node scripts/load-test-auth.mjs [baseUrl]
//   node scripts/load-test-auth.mjs http://localhost:3000
//
// Tests the following endpoints:
//   - POST /api/auth/admin-session
//   - POST /api/auth/profile-sync
//   - POST /api/community (comment submission)
//   - GET  /api/admin/community (admin moderation list)
//   - GET  /api/admin/pending-comments (pending count)
//
// Measures: latency (p50/p95/p99), throughput, error rate
// =====================================================

const BASE_URL = process.argv[2] || "http://localhost:3000";

// Number of concurrent requests to simulate
const CONCURRENCY = 10;
const ROUNDS = 3; // Number of rounds per endpoint

const ENDPOINTS = [
  {
    name: "POST /api/auth/admin-session (no token)",
    method: "POST",
    path: "/api/auth/admin-session",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
    expectedStatus: 401,
  },
  {
    name: "DELETE /api/auth/admin-session",
    method: "DELETE",
    path: "/api/auth/admin-session",
    expectedStatus: 200,
  },
  {
    name: "POST /api/admin/verify (invalid key)",
    method: "POST",
    path: "/api/admin/verify",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminKey: "wrong" }),
    expectedStatus: 401,
  },
  {
    name: "GET /api/community (public - no params)",
    method: "GET",
    path: "/api/community?scopeType=mods&scopeId=test",
    expectedStatus: 200,
  },
];

function percentile(sorted, p) {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[idx] || 0;
}

async function runRequest(endpoint) {
  const start = performance.now();
  try {
    const res = await fetch(`${BASE_URL}${endpoint.path}`, {
      method: endpoint.method,
      headers: endpoint.headers || {},
      body: endpoint.body || undefined,
    });
    const elapsed = performance.now() - start;

    return {
      status: res.status,
      ok: res.ok,
      elapsedMs: Math.round(elapsed),
      expectedOk: res.status === endpoint.expectedStatus,
    };
  } catch (err) {
    const elapsed = performance.now() - start;
    return {
      status: 0,
      ok: false,
      elapsedMs: Math.round(elapsed),
      error: err.message,
      expectedOk: false,
    };
  }
}

async function runConcurrent(endpoint, count) {
  const promises = Array.from({ length: count }, () => runRequest(endpoint));
  return Promise.all(promises);
}

async function testEndpoint(endpoint, concurrency, rounds) {
  console.log(`\n━━━ ${endpoint.name} ━━━`);
  const allResults = [];

  for (let r = 1; r <= rounds; r++) {
    const results = await runConcurrent(endpoint, concurrency);
    allResults.push(...results);

    const roundOk = results.filter((r) => r.expectedOk).length;
    const roundTimes = results.map((r) => r.elapsedMs).sort((a, b) => a - b);
    const roundTotal = results.reduce((sum, r) => sum + r.elapsedMs, 0);

    console.log(
      `  Round ${r}: ${roundOk}/${concurrency} ok, ` +
        `avg=${Math.round(roundTotal / results.length)}ms, ` +
        `p50=${percentile(roundTimes, 50)}ms, ` +
        `p95=${percentile(roundTimes, 95)}ms, ` +
        `p99=${percentile(roundTimes, 99)}ms`
    );
  }

  const allTimes = allResults.map((r) => r.elapsedMs).sort((a, b) => a - b);
  const okCount = allResults.filter((r) => r.expectedOk).length;
  const errorCount = allResults.length - okCount;
  const avgTime = Math.round(
    allResults.reduce((sum, r) => sum + r.elapsedMs, 0) / allResults.length
  );

  return {
    name: endpoint.name,
    total: allResults.length,
    ok: okCount,
    errors: errorCount,
    avgMs: avgTime,
    p50Ms: percentile(allTimes, 50),
    p95Ms: percentile(allTimes, 95),
    p99Ms: percentile(allTimes, 99),
    minMs: allTimes[0],
    maxMs: allTimes[allTimes.length - 1],
  };
}

async function main() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║   Auth API Load Test                ║");
  console.log("╚══════════════════════════════════════╝");
  console.log(`\nBase URL: ${BASE_URL}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Rounds: ${ROUNDS}`);
  console.log(`Total requests per endpoint: ${CONCURRENCY * ROUNDS}`);

  // Quick health check
  try {
    const check = await fetch(`${BASE_URL}/api/status`);
    if (check.ok) {
      console.log("\nHealth check: OK");
    } else {
      console.log(`\nHealth check: FAILED (${check.status})`);
    }
  } catch {
    console.log(
      `\nHealth check: FAILED (cannot connect to ${BASE_URL})`
    );
  }

  const results = [];
  for (const endpoint of ENDPOINTS) {
    const result = await testEndpoint(endpoint, CONCURRENCY, ROUNDS);
    results.push(result);
  }

  // Summary table
  console.log("\n\n═══════════════════════════════════════════════════════");
  console.log("                    SUMMARY REPORT");
  console.log("═══════════════════════════════════════════════════════");
  console.log(
    "Endpoint".padEnd(42) +
      "Avg".padStart(7) +
      "p50".padStart(7) +
      "p95".padStart(7) +
      "p99".padStart(7) +
      "OK".padStart(7)
  );
  console.log("─".repeat(75));

  for (const r of results) {
    const shortName = r.name.length > 40 ? r.name.slice(0, 37) + "..." : r.name;
    console.log(
      shortName.padEnd(42) +
        `${r.avgMs}ms`.padStart(7) +
        `${r.p50Ms}ms`.padStart(7) +
        `${r.p95Ms}ms`.padStart(7) +
        `${r.p99Ms}ms`.padStart(7) +
        `${r.ok}/${r.total}`.padStart(7)
    );
  }

  const overallAvg = Math.round(
    results.reduce((sum, r) => sum + r.avgMs, 0) / results.length
  );
  const overallOk = results.reduce((sum, r) => sum + r.ok, 0);
  const overallTotal = results.reduce((sum, r) => sum + r.total, 0);
  const slowest = results.reduce((max, r) => (r.p99Ms > max.p99Ms ? r : max), results[0]);

  console.log("─".repeat(75));
  console.log(
    `${"OVERALL".padEnd(42)}${`${overallAvg}ms`.padStart(7)}${`-`.padStart(7)}${`-`.padStart(7)}${`-`.padStart(7)}${`${overallOk}/${overallTotal}`.padStart(7)}`
  );
  console.log(
    `\nSlowest endpoint (p99): ${slowest.name} → ${slowest.p99Ms}ms`
  );

  // Performance grade
  const grade =
    overallAvg < 100 ? "A (Excellent)" :
    overallAvg < 200 ? "B (Good)" :
    overallAvg < 400 ? "C (Acceptable)" :
    overallAvg < 800 ? "D (Needs improvement)" :
    "F (Critical)";

  console.log(`Overall average: ${overallAvg}ms — Grade: ${grade}`);
  console.log("\n═══════════════════════════════════════════════════════\n");
}

main().catch(console.error);
