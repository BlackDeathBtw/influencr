-- Add metrics columns to campaign_influencers if they don't exist
ALTER TABLE campaign_influencers
  ADD COLUMN IF NOT EXISTS impressions integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicks integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversions integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spend numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes text;

-- analytics_snapshots for historical trend data
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  total_impressions integer DEFAULT 0,
  total_clicks integer DEFAULT 0,
  total_conversions integer DEFAULT 0,
  total_spend numeric(10,2) DEFAULT 0,
  creator_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_snapshots_owner" ON analytics_snapshots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_id AND campaigns.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_campaign ON analytics_snapshots(campaign_id, snapshot_date DESC);
