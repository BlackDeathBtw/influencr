CREATE TABLE IF NOT EXISTS ugc_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  influencer_id uuid REFERENCES influencers(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  title text NOT NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('image', 'video', 'link', 'document')),
  storage_path text,
  external_url text,
  thumbnail_url text,
  platform text,
  tags text[] DEFAULT '{}',
  notes text,
  rights_status text DEFAULT 'pending' CHECK (rights_status IN ('pending', 'approved', 'rejected', 'licensed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ugc_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ugc_assets_owner" ON ugc_assets
  FOR ALL USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_ugc_assets_user ON ugc_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_ugc_assets_campaign ON ugc_assets(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ugc_assets_influencer ON ugc_assets(influencer_id) WHERE influencer_id IS NOT NULL;
