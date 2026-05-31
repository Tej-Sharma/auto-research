-- Auto Research schema
-- App tables live in public. The orchestrator + start-run edge function write
-- using the admin/service key (bypasses RLS). The browser uses the anon key and
-- may only SELECT rows belonging to the authenticated user. Runs are created via
-- the start-run edge function, so no client INSERT policies are needed.

-- research_runs
CREATE TABLE public.research_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query         text NOT NULL,
  mode          text NOT NULL DEFAULT 'market',
  status        text NOT NULL DEFAULT 'queued',
  params        jsonb NOT NULL DEFAULT '{}'::jsonb,
  stats         jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_detail  text,
  sandbox_id    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX research_runs_user_idx ON public.research_runs (user_id, created_at DESC);

-- searches
CREATE TABLE public.searches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id        uuid NOT NULL REFERENCES public.research_runs(id) ON DELETE CASCADE,
  parent_kind   text NOT NULL DEFAULT 'seed',
  parent_id     text,
  tool          text NOT NULL,
  query         text NOT NULL,
  rationale     text,
  status        text NOT NULL DEFAULT 'pending',
  apify_run_id  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX searches_run_idx ON public.searches (run_id);

-- sources
CREATE TABLE public.sources (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id        uuid NOT NULL REFERENCES public.research_runs(id) ON DELETE CASCADE,
  search_id     uuid REFERENCES public.searches(id) ON DELETE SET NULL,
  platform      text NOT NULL,
  url           text,
  title         text,
  author        text,
  metrics       jsonb NOT NULL DEFAULT '{}'::jsonb,
  excerpt       text,
  raw           jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sources_run_idx ON public.sources (run_id);

-- findings
CREATE TABLE public.findings (
  id            text PRIMARY KEY,
  run_id        uuid NOT NULL REFERENCES public.research_runs(id) ON DELETE CASCADE,
  title         text NOT NULL,
  evidence      text,
  source_ids    jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX findings_run_idx ON public.findings (run_id);

-- analyses
CREATE TABLE public.analyses (
  id            text PRIMARY KEY,
  run_id        uuid NOT NULL REFERENCES public.research_runs(id) ON DELETE CASCADE,
  target_kind   text NOT NULL,
  target_id     text NOT NULL,
  tone          text NOT NULL,
  verdict       text,
  body          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX analyses_run_idx ON public.analyses (run_id);

-- gaps
CREATE TABLE public.gaps (
  id            text PRIMARY KEY,
  run_id        uuid NOT NULL REFERENCES public.research_runs(id) ON DELETE CASCADE,
  parent_gap_id text REFERENCES public.gaps(id) ON DELETE CASCADE,
  finding_id    text,
  title         text NOT NULL,
  why           text,
  status        text NOT NULL DEFAULT 'detected',
  depth         int  NOT NULL DEFAULT 0,
  saturation    numeric,
  plan          jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX gaps_run_idx ON public.gaps (run_id);

-- market_gaps (cross-run tracking)
CREATE TABLE public.market_gaps (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gap_id             text REFERENCES public.gaps(id) ON DELETE SET NULL,
  run_id             uuid REFERENCES public.research_runs(id) ON DELETE CASCADE,
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label              text NOT NULL,
  fingerprint        text NOT NULL,
  status             text NOT NULL,
  saturation_score   numeric,
  opportunity_score  numeric,
  evidence_refs      jsonb NOT NULL DEFAULT '[]'::jsonb,
  mode               text,
  tracked_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX market_gaps_user_idx ON public.market_gaps (user_id, tracked_at DESC);
CREATE INDEX market_gaps_fingerprint_idx ON public.market_gaps (fingerprint);

-- reports
CREATE TABLE public.reports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id        uuid NOT NULL UNIQUE REFERENCES public.research_runs(id) ON DELETE CASCADE,
  summary       jsonb NOT NULL DEFAULT '[]'::jsonb,
  novel         jsonb NOT NULL DEFAULT '[]'::jsonb,
  addressed     jsonb NOT NULL DEFAULT '[]'::jsonb,
  stats         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- canvas_events (drives live + replay canvas)
CREATE TABLE public.canvas_events (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  run_id        uuid NOT NULL REFERENCES public.research_runs(id) ON DELETE CASCADE,
  seq           int  NOT NULL,
  type          text NOT NULL,
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX canvas_events_run_seq_idx ON public.canvas_events (run_id, seq);

-- RLS (read-only, owner-scoped)
ALTER TABLE public.research_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.searches      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gaps          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_gaps   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY runs_owner_read ON public.research_runs
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY market_gaps_owner_read ON public.market_gaps
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY searches_owner_read ON public.searches
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.research_runs r WHERE r.id = run_id AND r.user_id = (SELECT auth.uid())));
CREATE POLICY sources_owner_read ON public.sources
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.research_runs r WHERE r.id = run_id AND r.user_id = (SELECT auth.uid())));
CREATE POLICY findings_owner_read ON public.findings
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.research_runs r WHERE r.id = run_id AND r.user_id = (SELECT auth.uid())));
CREATE POLICY analyses_owner_read ON public.analyses
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.research_runs r WHERE r.id = run_id AND r.user_id = (SELECT auth.uid())));
CREATE POLICY gaps_owner_read ON public.gaps
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.research_runs r WHERE r.id = run_id AND r.user_id = (SELECT auth.uid())));
CREATE POLICY reports_owner_read ON public.reports
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.research_runs r WHERE r.id = run_id AND r.user_id = (SELECT auth.uid())));
CREATE POLICY canvas_events_owner_read ON public.canvas_events
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.research_runs r WHERE r.id = run_id AND r.user_id = (SELECT auth.uid())));

-- Realtime: per-run channel, published from a trigger on canvas_events
INSERT INTO realtime.channels (pattern, description, enabled)
VALUES ('run:%', 'Per-run Auto Research canvas events', true)
ON CONFLICT (pattern) DO UPDATE
  SET description = EXCLUDED.description, enabled = EXCLUDED.enabled;

CREATE OR REPLACE FUNCTION public.notify_canvas_event()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.publish(
    'run:' || NEW.run_id::text,
    NEW.type,
    jsonb_build_object('seq', NEW.seq, 'type', NEW.type, 'payload', NEW.payload)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER canvas_event_publish
AFTER INSERT ON public.canvas_events
FOR EACH ROW EXECUTE FUNCTION public.notify_canvas_event();

ALTER TABLE realtime.channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscribe_own_run ON realtime.channels
  FOR SELECT TO authenticated USING (
    pattern = 'run:%'
    AND EXISTS (
      SELECT 1 FROM public.research_runs r
      WHERE r.id = NULLIF(split_part(realtime.channel_name(), ':', 2), '')::uuid
        AND r.user_id = (SELECT auth.uid())));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER research_runs_touch BEFORE UPDATE ON public.research_runs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER gaps_touch BEFORE UPDATE ON public.gaps
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
