-- Public site feedback: star rating + optional comment (inserted via /api/feedback with service role).

CREATE TABLE IF NOT EXISTS public.site_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  page_path text NOT NULL DEFAULT '/',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_feedback_created_at ON public.site_feedback (created_at DESC);

COMMENT ON TABLE public.site_feedback IS
  'Voluntary ratings and comments from the site footer; written only through the server API.';

ALTER TABLE public.site_feedback ENABLE ROW LEVEL SECURITY;
-- No policies: authenticated/anon cannot read or write. Service role (API) bypasses RLS.
