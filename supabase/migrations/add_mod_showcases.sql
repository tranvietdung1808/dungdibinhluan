-- =====================================================
-- Mod Showcase — ảnh showcase cho mod flagship
-- (móc theo slug để áp dụng được cho cả mod static lẫn DB)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.mod_showcases (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text NOT NULL,
  image_url  text NOT NULL,
  caption    text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mod_showcases_slug_sort_idx
  ON public.mod_showcases(slug, sort_order, created_at);

ALTER TABLE public.mod_showcases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public xem ảnh showcase"
  ON public.mod_showcases FOR SELECT
  USING (true);

CREATE POLICY "Service role quản lý showcase"
  ON public.mod_showcases FOR ALL
  USING (auth.role() = 'service_role');
