-- Creator Business Suite — run in Supabase SQL Editor

-- Clients / Brand contacts
CREATE TABLE IF NOT EXISTS creator_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  website TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  country TEXT,
  vat_id TEXT,
  payment_terms_days INTEGER DEFAULT 30,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Brand deals / campaigns
CREATE TABLE IF NOT EXISTS creator_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES creator_clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  contact_person TEXT,
  value NUMERIC(12,2),
  currency TEXT DEFAULT 'USD',
  platforms TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'lead',
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deliverables per deal
CREATE TABLE IF NOT EXISTS creator_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES creator_deals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'post',
  platform TEXT,
  deadline DATE,
  posting_date DATE,
  status TEXT NOT NULL DEFAULT 'not_started',
  price NUMERIC(12,2),
  file_url TEXT,
  post_url TEXT,
  caption TEXT,
  brand_feedback TEXT,
  revision_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Expenses
CREATE TABLE IF NOT EXISTS creator_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES creator_deals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL DEFAULT 'other',
  merchant TEXT,
  payment_method TEXT DEFAULT 'other',
  tax_amount NUMERIC(12,2),
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Receipts / Belege
CREATE TABLE IF NOT EXISTS creator_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_id UUID REFERENCES creator_expenses(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  date DATE,
  amount NUMERIC(12,2),
  category TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Creator-side contract tracker
CREATE TABLE IF NOT EXISTS creator_deal_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES creator_deals(id) ON DELETE SET NULL,
  client_id UUID REFERENCES creator_clients(id) ON DELETE SET NULL,
  brand_name TEXT NOT NULL,
  value NUMERIC(12,2),
  start_date DATE,
  end_date DATE,
  payment_terms_days INTEGER DEFAULT 30,
  deliverables_summary TEXT,
  usage_rights TEXT,
  exclusivity BOOLEAN DEFAULT false,
  revisions INTEGER,
  cancellation_notice TEXT,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  signed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usage rights tracker
CREATE TABLE IF NOT EXISTS creator_usage_rights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES creator_deals(id) ON DELETE SET NULL,
  deliverable_id UUID REFERENCES creator_deliverables(id) ON DELETE SET NULL,
  brand TEXT NOT NULL,
  usage_type TEXT NOT NULL DEFAULT 'organic',
  start_date DATE,
  end_date DATE,
  platforms TEXT[] DEFAULT '{}',
  region TEXT,
  fee NUMERIC(12,2),
  renewal_option BOOLEAN DEFAULT false,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Incoming payment log
CREATE TABLE IF NOT EXISTS creator_payments_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES creator_invoices(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES creator_deals(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  date DATE,
  payment_method TEXT DEFAULT 'bank_transfer',
  status TEXT NOT NULL DEFAULT 'expected',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE creator_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_deal_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_usage_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_payments_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creator owns clients" ON creator_clients FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Creator owns deals" ON creator_deals FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Creator owns deliverables" ON creator_deliverables FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Creator owns expenses" ON creator_expenses FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Creator owns receipts" ON creator_receipts FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Creator owns deal contracts" ON creator_deal_contracts FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Creator owns usage rights" ON creator_usage_rights FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Creator owns payments log" ON creator_payments_log FOR ALL USING (auth.uid() = creator_id);

-- updated_at triggers
CREATE TRIGGER update_creator_clients_updated_at BEFORE UPDATE ON creator_clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_creator_deals_updated_at BEFORE UPDATE ON creator_deals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_creator_deliverables_updated_at BEFORE UPDATE ON creator_deliverables FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_creator_deal_contracts_updated_at BEFORE UPDATE ON creator_deal_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
