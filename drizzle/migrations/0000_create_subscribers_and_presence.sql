CREATE TABLE public.subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text NOT NULL DEFAULT 'coming_soon',
  shopify_customer_id text,
  shopify_error text,
  launch_notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.subscribers TO service_role;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.site_presence (
  visitor_id uuid PRIMARY KEY,
  last_seen timestamptz NOT NULL DEFAULT now(),
  first_seen timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.site_presence TO service_role;
ALTER TABLE public.site_presence ENABLE ROW LEVEL SECURITY;

CREATE INDEX site_presence_last_seen_idx ON public.site_presence (last_seen);