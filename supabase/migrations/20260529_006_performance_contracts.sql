-- Add performance columns to contracts if they don't exist
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS payment_model text DEFAULT 'flat' CHECK (payment_model IN ('flat', 'milestone', 'hybrid')),
  ADD COLUMN IF NOT EXISTS base_fee numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';

CREATE TABLE IF NOT EXISTS contract_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  title text NOT NULL,
  metric text NOT NULL CHECK (metric IN ('impressions', 'clicks', 'posts', 'conversions', 'views', 'custom')),
  target_value integer NOT NULL,
  bonus_amount numeric(10,2) NOT NULL DEFAULT 0,
  achieved_value integer DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'achieved', 'failed', 'disputed')),
  due_date date,
  achieved_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contract_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contract_milestones_owner" ON contract_milestones
  FOR ALL USING (
    EXISTS (SELECT 1 FROM contracts WHERE contracts.id = contract_id AND contracts.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_contract_milestones_contract ON contract_milestones(contract_id);
