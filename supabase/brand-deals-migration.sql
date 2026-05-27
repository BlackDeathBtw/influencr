-- Brand deals: scraped from real affiliate/brand deal sources
-- Run this in the Supabase SQL editor

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

CREATE POLICY "Public read brand deals"
  ON brand_deals FOR SELECT USING (true);
