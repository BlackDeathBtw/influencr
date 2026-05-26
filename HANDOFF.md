# Handoff — influencr two-sided platform

## What this project is

**influencr** — a Next.js 16 SaaS app at `C:\Users\jakob\NewPP\influencr`.
GitHub: https://github.com/BlackDeathBtw/influencr
Vercel preview: https://influencr-ddskv0uop-blackdeathbtws-projects.vercel.app

Currently: a brand-only influencer CRM ($19/mo). The plan is to transform it into a two-sided platform — brands manage campaigns (paid), creators get free tools + a public profile page.

---

## Current state

The codebase is working and deployed. These features already exist:
- Brand auth (Supabase), subscription (Stripe), dashboard
- Influencer contacts, campaigns, content deadlines, payments
- CSV import, file upload, cron email reminders (Resend)
- Basic influencer portal at `/portal/[token]`

**Nothing from the new plan has been built yet.**

---

## What needs to be built

Full implementation plan is at:
`docs/superpowers/plans/2026-05-26-two-sided-platform.md`

Design spec is at:
`docs/superpowers/specs/2026-05-26-two-sided-platform-design.md`

### 11 tasks in order:

| # | Task | Status |
|---|------|--------|
| 1 | Database schema (5 new tables) | TODO |
| 2 | Signup with brand/creator toggle | TODO |
| 3 | Creator layout + onboarding | TODO |
| 4 | Public creator profile at `/c/[username]` | TODO |
| 5 | Creator media kit editor | TODO |
| 6 | Creator dashboard + invoices + `/pay/[token]` | TODO |
| 7 | Contract generator + `/sign/[token]` | TODO |
| 8 | Email outreach with templates | TODO |
| 9 | Discovery search for brands | TODO |
| 10 | Sidebar + landing page updates | TODO |
| 11 | Build check + deploy | TODO |

---

## Tech stack

| Thing | Detail |
|---|---|
| Framework | Next.js 16.2.6, App Router, Turbopack |
| Auth + DB | Supabase (cookie-based SSR auth) |
| Email | Resend — direct fetch to `api.resend.com`, key in `RESEND_API_KEY` |
| Payments | Stripe, keys in `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Styles | Tailwind CSS v4, shadcn/ui components in `components/ui/` |
| Deploy | Vercel — use `NODE_OPTIONS="--use-system-ca" vercel` (TLS fix on Windows) |

---

## Key codebase facts

- **No `profiles` table** — all tables reference `auth.users(id)` via `user_id` directly
- Auth callback: `app/auth/callback/route.ts` — exchanges code, redirects to `?next=` param
- Admin client pattern (used for bypassing RLS on public pages):
  ```ts
  import { createClient as createAdminClient } from '@supabase/supabase-js'
  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  ```
- Server client (auth-aware): `import { createClient } from '@/lib/supabase/server'`
- Client component client: `import { createClient } from '@/lib/supabase/client'`
- Resend send pattern: `fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: Bearer ${RESEND_API_KEY} }, body: JSON.stringify({...}) })`
- Existing schema: `supabase/schema.sql` (influencers, campaigns, campaign_influencers, content, payments, subscriptions)
- Dashboard layout checks subscription status and blocks `canceled`/`past_due` users

---

## How to start the next session

1. Read this file
2. Read `docs/superpowers/plans/2026-05-26-two-sided-platform.md`
3. Start with Task 1 (database schema) — run the SQL in Supabase SQL editor
4. Work through tasks in order — each ends with a git commit

To execute: use `/superpowers:executing-plans` or `/superpowers:subagent-driven-development`

---

## Env vars needed (already set in Vercel)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_APP_URL
CRON_SECRET
```
