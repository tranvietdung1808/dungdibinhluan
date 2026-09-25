-- =====================================================
-- Player catalog — database cầu thủ riêng của DungDiBinhLuan
-- Blueprint: PLAYER-DATABASE-BLUEPRINT.md §7
--
-- Hai bảng module, KHÔNG đụng bảng tài khoản/mod/thanh toán:
--   player_catalog_releases — bản dữ liệu đã nhập (staging/active/archived/failed)
--   player_catalog_entries  — cầu thủ thuộc một bản, khoá (release_id, ea_player_id)
--
-- Mô hình quyền giống lockdown catalog nguồn: web đọc/ghi qua
-- service_role ở server (lib/server/players.ts, importer). anon /
-- authenticated KHÔNG đọc trực tiếp → manifest/provenance/token không
-- lộ qua Data API.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.player_catalog_releases (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  export_id     text NOT NULL,                  -- mã bản xuất từ manifest
  game_version  text NOT NULL,                  -- bản game đúng dữ liệu (fc26…)
  data_date     date,                           -- ngày tham chiếu bộ dữ liệu (tính tuổi)
  manifest      jsonb NOT NULL DEFAULT '{}'::jsonb,  -- nội bộ: chunks/checksum/meta
  record_count  integer NOT NULL CHECK (record_count >= 0),
  status        text NOT NULL DEFAULT 'staging'
    CHECK (status IN ('staging', 'active', 'archived', 'failed')),
  imported_at   timestamptz NOT NULL DEFAULT now(),
  activated_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Mỗi phiên bản game chỉ có MỘT bản active (§6.3.7 — kích hoạt nguyên tử).
CREATE UNIQUE INDEX IF NOT EXISTS player_catalog_releases_one_active_per_version
  ON public.player_catalog_releases (game_version)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS player_catalog_releases_status_idx
  ON public.player_catalog_releases (status, imported_at DESC);

CREATE TABLE IF NOT EXISTS public.player_catalog_entries (
  release_id    uuid NOT NULL
    REFERENCES public.player_catalog_releases (id) ON DELETE CASCADE,
  ea_player_id  bigint NOT NULL,                -- ID cầu thủ EA (định danh dữ liệu)
  slug          text NOT NULL,                  -- slug đích: tên-không-dấu + ea id
  display_name  text NOT NULL,
  search_name   text NOT NULL,                  -- tên ASCII thường, tìm không dấu
  common_name   text,
  overall_rating integer NOT NULL,
  potential     integer,
  birthdate     date,
  height_cm     integer,
  weight_kg     integer,
  preferred_foot integer,                       -- 1 = phải, 2 = trái
  skill_moves   integer,
  weak_foot     integer,
  league_name   text,
  team_id       bigint,
  team_name     text,
  nationality_id integer,
  nationality_name text,
  gender        integer,                        -- 0 = nam, 1 = nữ (mã EA)
  position_short text,
  alt_positions text[] NOT NULL DEFAULT '{}',
  stats         jsonb NOT NULL DEFAULT '{}'::jsonb,  -- key -> int (đã lấy .value)
  avatar_url    text,

  -- Tài chính đã tính tại import (§7): provenance nội bộ + giá hiển thị
  base_value_eur          bigint,               -- giá cơ sở (không trả public)
  base_value_kind         text NOT NULL DEFAULT 'unknown'
    CHECK (base_value_kind IN ('market', 'career', 'unknown')),
  valuation_date          date,                 -- ngày định giá gốc, không phải ngày sync
  valuation_source_name   text,                 -- vd. Transfermarkt (ghi công)
  valuation_source_url    text,
  adjustment_bps          integer NOT NULL DEFAULT 0
    CHECK (adjustment_bps IN (0, 1000)),        -- 1000 = top 100 POT (+10%)
  is_top_potential        boolean NOT NULL DEFAULT false,
  reference_value_eur     bigint,               -- giá tham khảo SAU điều chỉnh
  weekly_wage_eur         bigint,               -- lương trong game EUR/tuần
  wage_basis              text NOT NULL DEFAULT 'unknown'
    CHECK (wage_basis IN ('game_weekly_eur', 'unknown')),

  PRIMARY KEY (release_id, ea_player_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS player_catalog_entries_slug_key
  ON public.player_catalog_entries (release_id, slug);

-- Query luôn ghim release_id (bản active) — composite theo access path.
CREATE INDEX IF NOT EXISTS player_catalog_entries_ovr_idx
  ON public.player_catalog_entries (release_id, overall_rating DESC, ea_player_id);
CREATE INDEX IF NOT EXISTS player_catalog_entries_pot_idx
  ON public.player_catalog_entries (release_id, potential DESC, ea_player_id);
CREATE INDEX IF NOT EXISTS player_catalog_entries_search_idx
  ON public.player_catalog_entries (release_id, search_name);
CREATE INDEX IF NOT EXISTS player_catalog_entries_position_idx
  ON public.player_catalog_entries (release_id, position_short);
CREATE INDEX IF NOT EXISTS player_catalog_entries_team_idx
  ON public.player_catalog_entries (release_id, team_name);
CREATE INDEX IF NOT EXISTS player_catalog_entries_league_idx
  ON public.player_catalog_entries (release_id, league_name);
CREATE INDEX IF NOT EXISTS player_catalog_entries_nationality_idx
  ON public.player_catalog_entries (release_id, nationality_name);
CREATE INDEX IF NOT EXISTS player_catalog_entries_value_idx
  ON public.player_catalog_entries (release_id, reference_value_eur DESC, ea_player_id);
CREATE INDEX IF NOT EXISTS player_catalog_entries_wage_idx
  ON public.player_catalog_entries (release_id, weekly_wage_eur DESC, ea_player_id);

-- ---------- Quyền: runtime/import qua service_role, anon không đọc ----------

ALTER TABLE public.player_catalog_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_catalog_entries ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.player_catalog_releases FROM anon, authenticated;
REVOKE ALL ON TABLE public.player_catalog_entries FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.player_catalog_releases TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.player_catalog_entries TO service_role;

-- ---------- Kích hoạt nguyên tử + advisory lock chống đồng bộ song song ----------

CREATE OR REPLACE FUNCTION public.activate_player_catalog_release(p_release_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_release public.player_catalog_releases%ROWTYPE;
BEGIN
  -- Lock toàn cụm theo tên cố định: hai importer chạy song song sẽ xếp
  -- hàng tại đây thay vì đua nhau kích hoạt/ghi đè.
  PERFORM pg_advisory_xact_lock(hashtext('player_catalog_activate'));

  SELECT * INTO v_release
    FROM public.player_catalog_releases
    WHERE id = p_release_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'release % không tồn tại', p_release_id;
  END IF;
  IF v_release.status <> 'staging' THEN
    RAISE EXCEPTION 'release % không ở trạng thái staging (hiện: %)',
      p_release_id, v_release.status;
  END IF;

  -- Archive bản active cùng game_version rồi kích hoạt bản mới —
  -- cùng một transaction nên không có khoảng trống active.
  UPDATE public.player_catalog_releases
    SET status = 'archived'
    WHERE game_version = v_release.game_version
      AND status = 'active'
      AND id <> p_release_id;

  UPDATE public.player_catalog_releases
    SET status = 'active', activated_at = now()
    WHERE id = p_release_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.activate_player_catalog_release(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_player_catalog_release(uuid) TO service_role;
