-- Optional per-post image for Open Graph and image sitemap (absolute URL or site path).

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS cover_image_url text;

COMMENT ON COLUMN public.blog_posts.cover_image_url IS
  'Optional image: https://... or /path under the site. Used in sitemap image hints and future OG tags.';
