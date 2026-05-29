CREATE TABLE IF NOT EXISTS alert_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  influencer_id uuid NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  dismissed_at timestamptz DEFAULT now()
);

ALTER TABLE alert_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alert_dismissals_owner" ON alert_dismissals
  FOR ALL USING (user_id = auth.uid());

-- Auto-expire dismissals after 7 days (checked in query)
CREATE INDEX IF NOT EXISTS idx_alert_dismissals_user ON alert_dismissals(user_id, dismissed_at);
