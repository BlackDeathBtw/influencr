-- ================================================================
-- FULL MIGRATION — run in Supabase SQL editor
-- Covers all tables added after schema.sql was last applied
-- ================================================================

-- ----------------------------------------------------------------
-- 1. email_sequences
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own email_sequences"
  ON email_sequences FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER update_email_sequences_updated_at
  BEFORE UPDATE ON email_sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------
-- 2. sequence_enrollments
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  next_send_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(sequence_id, influencer_id)
);

ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sequence_enrollments"
  ON sequence_enrollments FOR ALL USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- 3. campaign_results
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaign_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  influencer_id UUID REFERENCES influencers(id) ON DELETE SET NULL,
  views INTEGER,
  reach INTEGER,
  clicks INTEGER,
  conversions INTEGER,
  revenue_generated NUMERIC(12,2),
  notes TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE campaign_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own campaign_results"
  ON campaign_results FOR ALL USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- 4. creator_pipeline
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS creator_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  amount_estimate INTEGER,
  notes TEXT,
  stage TEXT NOT NULL DEFAULT 'prospecting',
  due_date DATE,
  deliverable_type TEXT,
  actual_views INTEGER,
  actual_reach INTEGER,
  collab_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE creator_pipeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage own pipeline"
  ON creator_pipeline FOR ALL USING (auth.uid() = creator_id);

CREATE TRIGGER update_creator_pipeline_updated_at
  BEFORE UPDATE ON creator_pipeline
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------
-- 5. creator_goals
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS creator_goals (
  creator_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_revenue_goal NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE creator_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage own goals"
  ON creator_goals FOR ALL USING (auth.uid() = creator_id);

CREATE TRIGGER update_creator_goals_updated_at
  BEFORE UPDATE ON creator_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------
-- 6. crm_notes
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE crm_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own crm_notes"
  ON crm_notes FOR ALL USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- 7. crm_activities
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own crm_activities"
  ON crm_activities FOR ALL USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- 8. outreach_logs — add tracking columns + index
-- ----------------------------------------------------------------
ALTER TABLE outreach_logs
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS outreach_logs_resend_id_idx
  ON outreach_logs (resend_id);
