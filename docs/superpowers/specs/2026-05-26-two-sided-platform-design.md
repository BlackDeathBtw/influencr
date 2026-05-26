# Two-Sided Platform Design: Brand CRM + Creator Marketplace

## Overview

Transform influencr from a one-sided brand CRM into a two-sided platform where brands manage influencer campaigns (paid tier) and influencers manage their deals and get discovered (free tier). The growth flywheel: brands invite influencers → influencers build public profiles → profiles rank on Google → new brands find the platform → repeat.

## Goals

- Eliminate the need for brands to pay $200–400/mo across 5 separate tools
- Give influencers a free home for media kits, deal tracking, and invoicing
- Create SEO-driven organic acquisition via public creator profile pages
- Add two revenue streams: brand subscriptions + (future) creator pro tier

---

## Section 1: Account Types

Two account types share one Supabase backend. Account type is stored on the user profile.

| | Brand | Creator |
|---|---|---|
| Cost | $19/mo (Stripe) | Free |
| Entry points | Direct signup, or finds creator profile page | Direct signup, or invited via brand portal |
| Dashboard | Existing CRM dashboard | New creator dashboard |

On signup, users choose "I'm a brand" or "I'm a creator." Auth flow branches accordingly.

---

## Section 2: Brand Side — New Features

Existing CRM (contacts, campaigns, content deadlines, payments) is unchanged.

### 2.1 Influencer Discovery (`/discover`)
- Search creator profiles by niche, platform (Instagram/TikTok/YouTube), follower range, location
- Filter by engagement rate, content type, past brand categories
- Results show public profile cards — click through to full `/@username` page
- Locked behind paid brand plan (discovery requires subscription)

### 2.2 Email Outreach (`/outreach`)
- Select influencer(s) from contacts or discovery results
- Choose from outreach email templates (collab pitch, rate inquiry, follow-up)
- Schedule send or send immediately via Resend (already in stack)
- Track status: sent / opened / replied
- Track status via Resend webhook: sent / opened (no reply inbox — replies go to brand's own email)

### 2.3 Contract Generator (`/contracts`)
- Generate a contract from campaign data (deliverables, fee, due dates, usage rights)
- Pre-filled from existing campaign and influencer records
- Send via email link — influencer gets a `/sign/[token]` page to review and e-sign
- E-sign = checkbox + typed name + timestamp (no DocuSign needed)
- Contract status: draft / sent / signed / declined

### 2.4 Content Approval (upgrade to existing portal)
- Influencer uploads draft content via portal (`/portal/[token]` already exists)
- Brand sees submission in campaign view with approve / request revision buttons
- Revision request sends email with notes via Resend
- Approved content stored in Supabase storage and visible in a UGC library per campaign

---

## Section 3: Creator Side — Net New

All creator features are free. Creators sign up with "I'm a creator" flow.

### 3.1 Public Profile Page (`/@[username]`)
- SEO-indexed, publicly accessible without login
- Contains: profile photo, bio, niche tags, platforms with follower counts, engagement rate, past brand logos, starting rate range
- Creator edits this from `/creator/media-kit`
- Shareable URL they can include in pitch emails
- Social proof section: testimonials from past brand partners (optional, brand-submitted)

### 3.2 Deal Tracker (`/creator/dashboard`)
- See all active and past brand deals (populated when brands add them to campaigns)
- Track deliverable status, due dates, payment status from the creator's perspective
- Simple kanban: Negotiating → Confirmed → Content Due → Posted → Paid

### 3.3 Invoice Generator (`/creator/invoices`)
- Create invoice: brand name, service description, amount, due date
- Send via email link — brand receives a `/pay/[token]` page showing invoice
- Invoice status: draft / sent / viewed / paid
- Mark as paid manually (or auto-update if brand marks payment in their CRM)

### 3.4 Contract Signing
- Receive contract sent by brand to their email
- Review at `/sign/[token]` — no login required
- E-sign with name + checkbox + timestamp
- Signature metadata (name, timestamp, IP) stored in Supabase, both parties notified via email

### 3.5 Content Submission
- Upload draft post/video/image for brand review via portal
- See brand feedback and revision requests
- Resubmit after revisions
- See approval confirmation with final asset link

---

## Section 4: Routes

```
/                            Landing — updated with two CTAs (brands / creators)
/for-creators                Creator landing page explaining free tier benefits
/@[username]                 Public creator profile (SEO-indexed)
/sign/[token]                Contract e-sign page (no login needed)
/pay/[token]                 Invoice view page for brands (no login needed)

/creator/dashboard           Creator private deal tracker
/creator/media-kit           Edit public profile
/creator/invoices            Invoice list + generator
/creator/invoices/new        Create invoice

/discover                    Brand: search creator database (paid only)
/outreach                    Brand: email outreach manager
/outreach/[id]               Thread view for one influencer outreach
/contracts                   Brand: contract list
/contracts/new               Brand: generate contract from campaign data
```

Existing routes (`/dashboard`, `/influencers`, `/campaigns`, `/payments`, `/settings`) unchanged.

---

## Section 5: Database Schema Additions

```sql
-- Extend users table or profiles
ALTER TABLE profiles ADD COLUMN account_type TEXT DEFAULT 'brand'; -- 'brand' | 'creator'
ALTER TABLE profiles ADD COLUMN username TEXT UNIQUE; -- for /@username
ALTER TABLE profiles ADD COLUMN is_public BOOLEAN DEFAULT false;

-- Creator public profile
CREATE TABLE creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  bio TEXT,
  niche TEXT[],
  platforms JSONB, -- [{platform: 'instagram', handle: '@foo', followers: 12000, engagement: 3.2}]
  location TEXT,
  starting_rate INTEGER,
  past_brands TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Outreach emails
CREATE TABLE outreach_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES profiles(id),
  influencer_id UUID REFERENCES influencers(id),
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'draft', -- draft | sent | opened | replied
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Contracts
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES profiles(id),
  influencer_id UUID REFERENCES influencers(id),
  campaign_id UUID REFERENCES campaigns(id),
  sign_token TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  content TEXT, -- contract body
  status TEXT DEFAULT 'draft', -- draft | sent | signed | declined
  signed_at TIMESTAMPTZ,
  signer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Creator invoices
CREATE TABLE creator_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id),
  brand_name TEXT,
  brand_email TEXT,
  description TEXT,
  amount INTEGER, -- cents
  currency TEXT DEFAULT 'USD',
  due_date DATE,
  pay_token TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  status TEXT DEFAULT 'draft', -- draft | sent | viewed | paid
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Section 6: Error Handling

- Public pages (`/@username`, `/sign/[token]`, `/pay/[token]`) return 404 for unknown slugs/tokens — no auth errors exposed
- Discovery locked behind subscription check middleware — redirect to `/settings` with upgrade prompt
- Email sending failures (Resend) logged server-side, surface as toast error to user with retry option
- Contract/invoice token expiry: tokens don't expire — links stay valid permanently (user can manually cancel)

---

## Section 7: Testing

- Unit: contract generation logic, invoice amount formatting, slug uniqueness
- Integration: sign flow (token → sign → status update), invoice send → viewed → paid flow
- E2E (Playwright, already in stack): creator signup → fill profile → view public page; brand signup → discover creator → send outreach → generate contract → send for signing

---

## Out of Scope

- Payment processing for invoices (Stripe checkout for creator invoices is a future phase — mark paid manually for now)
- Fake follower audit (future, requires third-party API)
- Analytics/post performance tracking (future)
- Mobile app
