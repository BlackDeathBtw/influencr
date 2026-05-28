# Feature Additions Design — 2026-05-28

## Summary
Five new features + cleanup of features the user rejected.

## Features

### 1. Deliverable Tracker (Creator)
New table `creator_deliverables` (pipeline_id, creator_id, title, status, due_date).
Statuses: briefed → filmed → submitted → approved → posted.
UI: Expandable section inside each pipeline kanban card. Add inline, toggle status, delete.
API: GET/POST `/api/creator-deliverables`, PATCH/DELETE `/api/creator-deliverables/[id]`.

### 2. Quarterly P&L / Tax Summary (Creator)
No new table. Pull from `creator_invoices` (paid) and `creator_expenses`.
Group by quarter (Q1–Q4) for current year + prior year.
Show: Income / Expenses / Net per quarter.
CSV export: flat list of all income + expense rows with date, type, amount.
UI: New section appended to `/creator/earnings` page.

### 3. Campaign Performance Aggregation (Brand)
No new table. Aggregate existing `campaign_results` rows.
Add totals row above individual results in the CampaignROI component:
Total Views, Total Reach, Total Clicks, Total Conversions, Total Revenue.

### 4. Contact Filtering (Brand)
No new table. Add URL param filters to `/influencers` page.
New filters: `platform` (dropdown), `followers` (range: <10K / 10K–100K / 100K–1M / 1M+).
Server-side filtering (same pattern as existing status/tag filters).

### 5. Content Approval via Link (Brand → Creator)
New table `content_reviews` (user_id, campaign_id, influencer_id, title, brief, submission_url, submission_notes, review_token UNIQUE, status, feedback, submitted_at, reviewed_at).
Statuses: pending → submitted → approved / changes_requested.
Brand creates a review at `/content-reviews`, gets a shareable `/review/[token]` link.
Creator opens link (no login), sees brief, pastes content URL + notes, submits.
Brand sees updated status, can approve or request changes with a comment.
Add "Reviews" to sidebar Growth nav.

## Cuts
- Remove: AI Captions page + API
- Remove: Link-in-Bio page + API (all creator-links routes)
- Remove: Public creator profile (`/c/[username]`) + print pages
- Remove: "My Links" + "AI Captions" from creator sidebar nav

## Architecture
- All API routes follow existing pattern: `supabase.auth.getUser()` + RLS ownership check
- All UI follows existing Tailwind semantic tokens (bg-card, border-border, text-muted-foreground, bg-brand)
- Public pages (review/[token]) use no auth — same pattern as contracts and invoice pay pages
