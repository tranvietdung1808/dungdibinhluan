-- ══════════════════════════════════════════════════════════════════
-- player_catalog_filter_options(p_release_id) — distinct 5 cột lọc
-- (position/team/league/nationality/gender) của bản catalog.
--
-- Trước đây getCachedFilterOptions kéo ~24k rows × 5 cột về JS để dedupe
-- (~1.5–3MB egress mỗi lần refresh cache). RPC dedupe ngay trong DB,
-- trả vài trăm giá trị (~10KB) — cùng convention với
-- activate_player_catalog_release: SECURITY INVOKER, chỉ service_role.
-- ══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.player_catalog_filter_options(p_release_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT jsonb_build_object(
    'positions', COALESCE((
      SELECT jsonb_agg(DISTINCT position_short)
      FROM public.player_catalog_entries
      WHERE release_id = p_release_id AND position_short IS NOT NULL
    ), '[]'::jsonb),
    'teams', COALESCE((
      SELECT jsonb_agg(DISTINCT team_name)
      FROM public.player_catalog_entries
      WHERE release_id = p_release_id AND team_name IS NOT NULL
    ), '[]'::jsonb),
    'leagues', COALESCE((
      SELECT jsonb_agg(DISTINCT league_name)
      FROM public.player_catalog_entries
      WHERE release_id = p_release_id AND league_name IS NOT NULL
    ), '[]'::jsonb),
    'nationalities', COALESCE((
      SELECT jsonb_agg(DISTINCT nationality_name)
      FROM public.player_catalog_entries
      WHERE release_id = p_release_id AND nationality_name IS NOT NULL
    ), '[]'::jsonb),
    'genders', COALESCE((
      SELECT jsonb_agg(DISTINCT gender)
      FROM public.player_catalog_entries
      WHERE release_id = p_release_id AND gender IS NOT NULL
    ), '[]'::jsonb)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.player_catalog_filter_options(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.player_catalog_filter_options(uuid) TO service_role;
