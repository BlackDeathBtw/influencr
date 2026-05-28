# influencr — Project Handoff

**Live:** https://influencr-five.vercel.app
**Supabase project:** `bmzvkxlgvwaomosqaxrv`
**Stack:** Next.js 16.2.6 App Router · Supabase (auth + DB) · Tailwind v4 dark theme · Resend (email) · Stripe (billing)

---

## What was built

### Agency CRM side

| Feature | Key files |
|---|---|
| **Email sequences** (drip campaigns) | `app/api/email-sequences/*` (4 routes), `components/outreach-sequences.tsx`, `app/(dashboard)/outreach/client.tsx` |
| **Post-campaign results** | `app/api/campaign-results/route.ts`, `components/campaign-roi.tsx`, `app/(dashboard)/campaigns/[id]/page.tsx` |
| **Bulk outreach** | `app/api/outreach/bulk-send/route.ts`, outreach client Templates tab |
| **Creator segments / tags** | `app/(dashboard)/influencers/page.tsx` (filter bar + tag chips), `components/influencer-form.tsx` (tag CRUD) |
| **Contacts rename** | Sidebar, influencers page, brand demo — "Influencers" → "Contacts" everywhere |

### Creator CRM side

| Feature | Key files |
|---|---|
| **Earnings dashboard** | `app/(creator)/creator/earnings/page.tsx` |
| **Content calendar** | `app/(creator)/creator/calendar/page.tsx` |
| Both added to **creator sidebar** | `components/creator-sidebar.tsx` |

### Demo pages (both updated)

- **`/demo/brand`** — interactive fake app; Contacts with tag filter, Outreach with Templates/Sequences/Sent tabs, post-campaign results in Campaigns
- **`/demo/creator`** — media kit demo; Earnings snapshot section, Content calendar section, 6-card Creator HQ grid

---

## Supabase tables added (migrations already applied)

- `email_sequences` — drip sequences with steps stored as jsonb
- `sequence_enrollments` — per-influencer progress through a sequence
- `campaign_results` — post-campaign metrics (views, reach, clicks, conversions, revenue)
- `creator_pipeline` — added columns: `due_date`, `deliverable_type`, `actual_views`, `actual_reach`, `collab_notes`

---

## Pending / deferred

### Resend email sending
Sequences and bulk send already call Resend — just needs wiring up:
1. Verify your sending domain in the Resend dashboard
2. Set `RESEND_WEBHOOK_SECRET` env var in Vercel for open/click tracking
3. Add webhook URL `https://influencr-five.vercel.app/api/webhooks/resend` in Resend

### Loose ends
- Outreach open/click tracking requires Resend webhook above
- Earnings page divides amounts by 100 (assumes cents) — confirm `creator_invoices.amount` is stored in cents
- Content calendar reads `creator_pipeline.due_date` — creators must set due dates on their pipeline entries for it to populate

---

## Key conventions

- **Auth:** Supabase SSR cookies. All API routes call `supabase.auth.getUser()` + RLS enforces `user_id = auth.uid()`
- **Theme:** dark-first Tailwind v4 — use `bg-card`, `border-border`, `text-muted-foreground`, `bg-brand` tokens, never raw colours
- **Sidebars:** agency = `components/sidebar.tsx`, creator = `components/creator-sidebar.tsx`
- **Types:** all shared interfaces in `types/index.ts`
- **File size limit:** 500 lines per file
- **Windows deploy:** `$env:NODE_OPTIONS = "--use-system-ca"` prefix required before `vercel` CLI due to Windows TLS cert chain issue

---

## Deploy

```powershell
$env:NODE_OPTIONS = "--use-system-ca"
vercel --prod
```
