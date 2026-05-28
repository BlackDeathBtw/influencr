-- Run this in the Supabase SQL editor

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'trialing',
  price_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Influencers
CREATE TABLE IF NOT EXISTS influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  handle TEXT,
  platform TEXT,
  niche TEXT,
  followers INTEGER,
  engagement_rate NUMERIC(5,2),
  contact_email TEXT,
  contact_name TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'prospect',
  tags TEXT[],
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  budget NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'planning',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaign <-> Influencer join table with deal info
CREATE TABLE IF NOT EXISTS campaign_influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  fee NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'outreach',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, influencer_id)
);

-- Content pieces
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'post',
  due_date DATE,
  posted_at DATE,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'briefed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE,
  paid_at DATE,
  invoice_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users manage own subscriptions" ON subscriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own influencers" ON influencers
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own campaigns" ON campaigns
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own campaign_influencers" ON campaign_influencers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND user_id = auth.uid())
  );

CREATE POLICY "Users manage own content" ON content
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own payments" ON payments
  FOR ALL USING (auth.uid() = user_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_influencers_updated_at BEFORE UPDATE ON influencers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- TWO-SIDED PLATFORM ADDITIONS
-- Run this block in Supabase SQL editor after the base schema
-- =============================================================

-- Account type per user (brand vs creator)
CREATE TABLE IF NOT EXISTS user_account_types (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL DEFAULT 'brand',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Creator public profiles
CREATE TABLE IF NOT EXISTS creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  bio TEXT,
  location TEXT,
  niches TEXT[] NOT NULL DEFAULT '{}',
  rate_min INTEGER,
  rate_max INTEGER,
  avatar_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Per-platform follower stats for creators
CREATE TABLE IF NOT EXISTS creator_platform_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  handle TEXT,
  followers INTEGER,
  engagement_rate NUMERIC(5,2),
  UNIQUE(profile_id, platform)
);

-- Creator invoices (creator → brand)
CREATE TABLE IF NOT EXISTS creator_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  brand_email TEXT NOT NULL,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  due_date DATE,
  pay_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Outreach email templates (brand)
CREATE TABLE IF NOT EXISTS outreach_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL DEFAULT '',
  platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Outreach sent-email log
CREATE TABLE IF NOT EXISTS outreach_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES outreach_templates(id) ON DELETE SET NULL,
  influencer_id UUID REFERENCES influencers(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  resend_id TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contracts (brand-generated, creator signs via token link)
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  influencer_id UUID REFERENCES influencers(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  sign_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  signer_name TEXT,
  signer_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE user_account_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_platform_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- user_account_types
CREATE POLICY "Users manage own account type" ON user_account_types FOR ALL USING (auth.uid() = user_id);

-- creator_profiles: owners write, public read published
CREATE POLICY "Creator owns profile" ON creator_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public read published profiles" ON creator_profiles FOR SELECT USING (is_public = true);

-- creator_platform_stats: follow creator_profiles ownership
CREATE POLICY "Creator owns platform stats" ON creator_platform_stats FOR ALL
  USING (EXISTS (SELECT 1 FROM creator_profiles WHERE id = profile_id AND user_id = auth.uid()));
CREATE POLICY "Public read published stats" ON creator_platform_stats FOR SELECT
  USING (EXISTS (SELECT 1 FROM creator_profiles WHERE id = profile_id AND is_public = true));

-- creator_invoices
CREATE POLICY "Creator owns invoices" ON creator_invoices FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Public invoice read by token" ON creator_invoices FOR SELECT USING (true);

-- outreach_templates
CREATE POLICY "Users manage own templates" ON outreach_templates FOR ALL USING (auth.uid() = user_id);

-- outreach_logs
CREATE POLICY "Users manage own outreach logs" ON outreach_logs FOR ALL USING (auth.uid() = user_id);

-- contracts
CREATE POLICY "Users manage own contracts" ON contracts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public contract read by token" ON contracts FOR SELECT USING (true);

-- updated_at triggers for new tables
CREATE TRIGGER update_creator_profiles_updated_at BEFORE UPDATE ON creator_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_outreach_templates_updated_at BEFORE UPDATE ON outreach_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================================
-- BRAND DEALS (scraped from affiliate networks)
-- ================================================================
CREATE TABLE IF NOT EXISTS brand_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  logo_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'affiliate',
  niches TEXT[] NOT NULL DEFAULT '{}',
  platforms TEXT[] NOT NULL DEFAULT '{}',
  commission_rate NUMERIC(6,2),
  budget_min INTEGER,
  budget_max INTEGER,
  min_followers INTEGER,
  apply_url TEXT NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(brand_name, apply_url)
);

ALTER TABLE brand_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read brand deals" ON brand_deals FOR SELECT USING (true);

-- ================================================================
-- EMAIL SEQUENCES & ENROLLMENTS
-- ================================================================
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
CREATE POLICY "Users manage own email_sequences" ON email_sequences FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_email_sequences_updated_at BEFORE UPDATE ON email_sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

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
CREATE POLICY "Users manage own sequence_enrollments" ON sequence_enrollments FOR ALL USING (auth.uid() = user_id);

-- ================================================================
-- CAMPAIGN RESULTS
-- ================================================================
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
CREATE POLICY "Users manage own campaign_results" ON campaign_results FOR ALL USING (auth.uid() = user_id);

-- ================================================================
-- CREATOR PIPELINE
-- ================================================================
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
CREATE POLICY "Creators manage own pipeline" ON creator_pipeline FOR ALL USING (auth.uid() = creator_id);
CREATE TRIGGER update_creator_pipeline_updated_at BEFORE UPDATE ON creator_pipeline
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================================
-- CREATOR GOALS
-- ================================================================
CREATE TABLE IF NOT EXISTS creator_goals (
  creator_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_revenue_goal NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE creator_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage own goals" ON creator_goals FOR ALL USING (auth.uid() = creator_id);
CREATE TRIGGER update_creator_goals_updated_at BEFORE UPDATE ON creator_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================================
-- CRM NOTES & ACTIVITIES
-- ================================================================
CREATE TABLE IF NOT EXISTS crm_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE crm_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own crm_notes" ON crm_notes FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own crm_activities" ON crm_activities FOR ALL USING (auth.uid() = user_id);

-- ================================================================
-- OUTREACH LOGS — tracking columns
-- ================================================================
ALTER TABLE outreach_logs
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS outreach_logs_resend_id_idx ON outreach_logs (resend_id);
