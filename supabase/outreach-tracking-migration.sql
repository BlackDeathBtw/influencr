-- Add open/click tracking columns to outreach_logs
-- Run this in the Supabase SQL editor

ALTER TABLE outreach_logs
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ;

-- Index for webhook lookups by resend_id
CREATE INDEX IF NOT EXISTS outreach_logs_resend_id_idx ON outreach_logs (resend_id);
