# Two-Sided Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform influencr from a brand-only CRM into a two-sided platform where brands manage campaigns (paid) and creators manage deals + get discovered (free).

**Architecture:** Two account types (`brand` | `creator`) stored in a new `user_profiles` table linked to `auth.users`. Creator public profiles live at `/c/[username]` (note: `/@username` is not used because `@` is reserved for parallel routes in Next.js App Router). Brand features (discovery, outreach, contracts) gate behind subscription check already in the dashboard layout.

**Tech Stack:** Next.js 16 App Router, Supabase (auth + DB + storage), Resend (email via direct fetch), Stripe (existing), Tailwind CSS, shadcn/ui components in `components/ui/`

---

## File Map

**New files:**
- `supabase/migrations.sql` — new tables (append to `supabase/schema.sql`)
- `app/(auth)/signup/page.tsx` — modify: add account type selector
- `app/auth/callback/route.ts` — modify: redirect by account_type
- `app/c/[username]/page.tsx` — public creator profile (SEO)
- `app/for-creators/page.tsx` — creator landing page
- `app/sign/[token]/page.tsx` — contract e-sign (no auth)
- `app/pay/[token]/page.tsx` — invoice view (no auth)
- `app/(creator)/layout.tsx` — creator dashboard shell
- `app/(creator)/creator/onboarding/page.tsx` — first-login setup
- `app/(creator)/creator/dashboard/page.tsx` — deal tracker
- `app/(creator)/creator/media-kit/page.tsx` — edit public profile
- `app/(creator)/creator/invoices/page.tsx` — invoice list
- `app/(creator)/creator/invoices/new/page.tsx` — create invoice
- `app/(dashboard)/discover/page.tsx` — brand: search creators
- `app/(dashboard)/outreach/page.tsx` — brand: email outreach list
- `app/(dashboard)/outreach/new/page.tsx` — brand: compose outreach
- `app/(dashboard)/contracts/page.tsx` — brand: contract list
- `app/(dashboard)/contracts/new/page.tsx` — brand: generate contract
- `app/api/creator-profiles/route.ts` — CRUD creator profile
- `app/api/contracts/route.ts` — create/list contracts
- `app/api/contracts/[token]/sign/route.ts` — sign a contract
- `app/api/creator-invoices/route.ts` — create/list invoices
- `app/api/creator-invoices/[token]/view/route.ts` — mark invoice viewed
- `app/api/outreach/route.ts` — send outreach email
- `app/api/discover/route.ts` — search creator profiles
- `components/creator-sidebar.tsx` — creator nav sidebar
- `lib/data.ts` — modify: add creator data fetchers

---

## Task 1: Database Schema

**Files:**
- Modify: `supabase/schema.sql`

- [ ] **Step 1: Append new tables to `supabase/schema.sql`**

Add this block at the end of `supabase/schema.sql`:

```sql
-- User profiles (account type + username for both brands and creators)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  account_type TEXT NOT NULL DEFAULT 'brand',
  username TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Creator public profiles
CREATE TABLE IF NOT EXISTS creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  bio TEXT,
  niche TEXT[],
  platforms JSONB DEFAULT '[]',
  location TEXT,
  starting_rate INTEGER,
  past_brands TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contracts (brand generates, creator signs)
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  sign_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  signer_name TEXT,
  signer_ip TEXT,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Outreach emails (brand → influencer)
CREATE TABLE IF NOT EXISTS outreach_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Creator invoices
CREATE TABLE IF NOT EXISTS creator_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  brand_email TEXT NOT NULL,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  due_date DATE,
  pay_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile" ON user_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own creator profile" ON creator_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Creator profiles public read" ON creator_profiles FOR SELECT USING (is_published = true);
CREATE POLICY "Brands manage own contracts" ON contracts FOR ALL USING (auth.uid() = brand_id);
CREATE POLICY "Contracts public read by token" ON contracts FOR SELECT USING (true);
CREATE POLICY "Brands manage own outreach" ON outreach_emails FOR ALL USING (auth.uid() = brand_id);
CREATE POLICY "Creators manage own invoices" ON creator_invoices FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Invoices public read by token" ON creator_invoices FOR SELECT USING (true);

CREATE TRIGGER update_creator_profiles_updated_at BEFORE UPDATE ON creator_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

- [ ] **Step 2: Run the new SQL in Supabase**

Go to your Supabase project → SQL Editor → paste and run the block above.

Verify by running:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_profiles','creator_profiles','contracts','outreach_emails','creator_invoices');
```
Expected: 5 rows returned.

- [ ] **Step 3: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add two-sided platform schema tables"
```

---

## Task 2: Signup with Account Type

**Files:**
- Modify: `app/(auth)/signup/page.tsx`
- Modify: `app/auth/callback/route.ts`

- [ ] **Step 1: Replace `app/(auth)/signup/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Users, Briefcase } from 'lucide-react'

type AccountType = 'brand' | 'creator'

export default function SignupPage() {
  const [accountType, setAccountType] = useState<AccountType>('brand')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const redirectTo = `${location.origin}/auth/callback?next=${accountType === 'creator' ? '/creator/onboarding' : '/dashboard'}`

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { account_type: accountType },
      },
    })

    if (error) { setError(error.message); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Check your email</h2>
          <p className="text-sm text-zinc-500">
            We sent a confirmation link to <strong>{email}</strong>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900 mb-1">Create your account</h1>
        <p className="text-sm text-zinc-500 mb-6">Free for creators. 14-day trial for brands.</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          {([
            { type: 'brand' as AccountType, label: "I'm a brand", icon: Briefcase, sub: '$19/mo after trial' },
            { type: 'creator' as AccountType, label: "I'm a creator", icon: Users, sub: 'Always free' },
          ]).map(({ type, label, icon: Icon, sub }) => (
            <button
              key={type}
              type="button"
              onClick={() => setAccountType(type)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                accountType === type
                  ? 'border-zinc-900 bg-zinc-50'
                  : 'border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <Icon size={20} className={accountType === type ? 'text-zinc-900' : 'text-zinc-400'} />
              <span className="text-sm font-medium text-zinc-900">{label}</span>
              <span className="text-xs text-zinc-400">{sub}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Min. 6 characters"
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-zinc-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-zinc-900 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `app/auth/callback/route.ts` to create user_profiles row**

```ts
import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && session) {
      const accountType = session.user.user_metadata?.account_type ?? 'brand'

      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
      await admin.from('user_profiles').upsert(
        { user_id: session.user.id, account_type: accountType },
        { onConflict: 'user_id' }
      )

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(auth\)/signup/page.tsx app/auth/callback/route.ts
git commit -m "feat: add account type selection to signup"
```

---

## Task 3: Creator Layout + Onboarding

**Files:**
- Create: `app/(creator)/layout.tsx`
- Create: `app/(creator)/creator/onboarding/page.tsx`
- Create: `components/creator-sidebar.tsx`
- Create: `app/api/creator-profiles/route.ts`

- [ ] **Step 1: Create `components/creator-sidebar.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, User, FileText, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const nav = [
  { href: '/creator/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/creator/media-kit', label: 'Media Kit', icon: User },
  { href: '/creator/invoices', label: 'Invoices', icon: FileText },
]

export default function CreatorSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-zinc-200 flex flex-col h-full">
      <div className="px-5 py-5 border-b border-zinc-100">
        <span className="font-bold text-lg tracking-tight">influencr</span>
        <span className="ml-2 text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">creator</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}>
              <Icon size={16} />{label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 pb-4 border-t border-zinc-100 pt-4 space-y-0.5">
        <button onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">
          <LogOut size={16} />Sign out
        </button>
        <p className="px-3 pt-2 text-xs text-zinc-400 truncate">{userEmail}</p>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Create `app/(creator)/layout.tsx`**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CreatorSidebar from '@/components/creator-sidebar'

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('account_type')
    .eq('user_id', user.id)
    .single()

  if (profile && profile.account_type === 'brand') redirect('/dashboard')

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      <CreatorSidebar userEmail={user.email ?? ''} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/api/creator-profiles/route.ts`**

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase.from('creator_profiles').select('*').eq('user_id', user.id).single()
  return NextResponse.json(data ?? null)
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { bio, niche, platforms, location, starting_rate, past_brands, avatar_url, is_published, username } = body

  if (username) {
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      return NextResponse.json({ error: 'Username must be 3-30 lowercase letters, numbers, or underscores' }, { status: 400 })
    }
    await supabase.from('user_profiles').upsert({ user_id: user.id, username, account_type: 'creator' }, { onConflict: 'user_id' })
  }

  const { data, error } = await supabase.from('creator_profiles').upsert(
    { user_id: user.id, bio, niche, platforms, location, starting_rate, past_brands, avatar_url, is_published },
    { onConflict: 'user_id' }
  ).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 4: Create `app/(creator)/creator/onboarding/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [niche, setNiche] = useState('')
  const [location, setLocation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/creator-profiles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.toLowerCase(),
        bio,
        niche: niche.split(',').map(n => n.trim()).filter(Boolean),
        location,
        platforms: [],
        is_published: false,
      }),
    })

    if (!res.ok) {
      const { error: msg } = await res.json()
      setError(msg)
      setLoading(false)
      return
    }

    router.push('/creator/media-kit')
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 px-4">
      <div className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900 mb-1">Set up your profile</h1>
        <p className="text-sm text-zinc-500 mb-6">You can change this anytime from your media kit.</p>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Username</label>
            <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-zinc-900">
              <span className="px-3 py-2.5 text-sm text-zinc-400 bg-zinc-50 border-r border-zinc-200">influencr.app/c/</span>
              <input value={username} onChange={e => setUsername(e.target.value)} required minLength={3} maxLength={30}
                pattern="[a-z0-9_]+" placeholder="yourname"
                className="flex-1 px-3 py-2.5 text-sm focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Short bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Fashion & lifestyle creator based in NYC..."
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Niche(s)</label>
            <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="fashion, lifestyle, travel (comma separated)"
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="New York, USA"
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-zinc-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50">
            {loading ? 'Saving…' : 'Continue to media kit →'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/\(creator\)/ components/creator-sidebar.tsx app/api/creator-profiles/
git commit -m "feat: creator layout, onboarding, and profile API"
```

---

## Task 4: Public Creator Profile Page

**Files:**
- Create: `app/c/[username]/page.tsx`

- [ ] **Step 1: Create `app/c/[username]/page.tsx`**

```tsx
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { formatNumber } from '@/lib/utils'
import type { Metadata } from 'next'

interface Platform { platform: string; handle: string; followers: number; engagement: number }

async function getCreatorByUsername(username: string) {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data: profile } = await admin
    .from('user_profiles')
    .select('user_id, username')
    .eq('username', username)
    .single()

  if (!profile) return null

  const { data: creator } = await admin
    .from('creator_profiles')
    .select('*')
    .eq('user_id', profile.user_id)
    .eq('is_published', true)
    .single()

  return creator ? { ...creator, username: profile.username } : null
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  const creator = await getCreatorByUsername(username)
  if (!creator) return { title: 'Creator not found' }
  return {
    title: `@${username} — influencr`,
    description: creator.bio ?? `${username}'s media kit on influencr`,
  }
}

export default async function CreatorProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const creator = await getCreatorByUsername(username)
  if (!creator) notFound()

  const platforms: Platform[] = Array.isArray(creator.platforms) ? creator.platforms : []

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 mb-6">
          {creator.avatar_url && (
            <img src={creator.avatar_url} alt={username} className="w-20 h-20 rounded-full mb-4 object-cover" />
          )}
          <h1 className="text-2xl font-bold text-zinc-900">@{username}</h1>
          {creator.location && <p className="text-sm text-zinc-400 mt-0.5">{creator.location}</p>}
          {creator.bio && <p className="text-zinc-600 mt-3 leading-relaxed">{creator.bio}</p>}
          {creator.niche?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {creator.niche.map((n: string) => (
                <span key={n} className="text-xs bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full capitalize">{n}</span>
              ))}
            </div>
          )}
        </div>

        {platforms.length > 0 && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4">Platforms</h2>
            <div className="grid grid-cols-2 gap-4">
              {platforms.map((p) => (
                <div key={p.platform} className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                  <p className="text-xs text-zinc-400 capitalize mb-1">{p.platform}</p>
                  <p className="text-sm font-medium text-zinc-600">{p.handle}</p>
                  <p className="text-2xl font-bold text-zinc-900 mt-1">{formatNumber(p.followers)}</p>
                  {p.engagement > 0 && <p className="text-xs text-zinc-400">{p.engagement}% engagement</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {creator.starting_rate && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-2">Starting rate</h2>
            <p className="text-3xl font-bold text-zinc-900">${creator.starting_rate.toLocaleString()}<span className="text-base font-normal text-zinc-400">/post</span></p>
          </div>
        )}

        {creator.past_brands?.length > 0 && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Past collaborations</h2>
            <div className="flex flex-wrap gap-2">
              {creator.past_brands.map((b: string) => (
                <span key={b} className="text-sm bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded-lg">{b}</span>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-zinc-300 mt-8">
          Powered by <a href="/" className="hover:text-zinc-400">influencr</a>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Test locally**

Start dev server: `npm run dev`
Navigate to `/creator/onboarding`, fill in username `testcreator`, complete form.
Navigate to `/creator/media-kit` (next task), publish profile.
Navigate to `/c/testcreator` — should show the public profile.
If profile shows correctly, proceed.

- [ ] **Step 3: Commit**

```bash
git add app/c/
git commit -m "feat: public creator profile page at /c/[username]"
```

---

## Task 5: Creator Media Kit Editor

**Files:**
- Create: `app/(creator)/creator/media-kit/page.tsx`

- [ ] **Step 1: Create `app/(creator)/creator/media-kit/page.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, ExternalLink } from 'lucide-react'

interface Platform { platform: string; handle: string; followers: number; engagement: number }

export default function MediaKitPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [niche, setNiche] = useState('')
  const [location, setLocation] = useState('')
  const [startingRate, setStartingRate] = useState('')
  const [pastBrands, setPastBrands] = useState('')
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [isPublished, setIsPublished] = useState(false)

  useEffect(() => {
    fetch('/api/creator-profiles').then(r => r.json()).then(data => {
      if (data) {
        setBio(data.bio ?? '')
        setNiche((data.niche ?? []).join(', '))
        setLocation(data.location ?? '')
        setStartingRate(data.starting_rate ? String(data.starting_rate) : '')
        setPastBrands((data.past_brands ?? []).join(', '))
        setPlatforms(Array.isArray(data.platforms) ? data.platforms : [])
        setIsPublished(data.is_published ?? false)
      }
    })
    fetch('/api/creator-profiles/username').then(r => r.json()).then(d => {
      if (d?.username) setUsername(d.username)
    }).finally(() => setLoading(false))
  }, [])

  function addPlatform() {
    setPlatforms(p => [...p, { platform: 'instagram', handle: '', followers: 0, engagement: 0 }])
  }

  function updatePlatform(i: number, field: keyof Platform, value: string | number) {
    setPlatforms(p => p.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  function removePlatform(i: number) {
    setPlatforms(p => p.filter((_, idx) => idx !== i))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch('/api/creator-profiles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        bio,
        niche: niche.split(',').map(n => n.trim()).filter(Boolean),
        location,
        starting_rate: startingRate ? parseInt(startingRate) : null,
        past_brands: pastBrands.split(',').map(b => b.trim()).filter(Boolean),
        platforms,
        is_published: isPublished,
      }),
    })

    if (!res.ok) {
      const { error: msg } = await res.json()
      setError(msg)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  if (loading) return <div className="p-8 text-sm text-zinc-400">Loading…</div>

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Media Kit</h1>
          <p className="text-sm text-zinc-500 mt-1">This is your public profile page.</p>
        </div>
        {username && (
          <a href={`/c/${username}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 border border-zinc-200 px-3 py-2 rounded-lg">
            <ExternalLink size={14} />View public page
          </a>
        )}
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
          <h2 className="font-semibold text-zinc-900">Basic info</h2>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Username</label>
            <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-zinc-900">
              <span className="px-3 py-2.5 text-sm text-zinc-400 bg-zinc-50 border-r border-zinc-200">influencr.app/c/</span>
              <input value={username} onChange={e => setUsername(e.target.value)} pattern="[a-z0-9_]+" minLength={3} maxLength={30}
                className="flex-1 px-3 py-2.5 text-sm focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell brands about yourself…"
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Niche(s)</label>
              <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="fashion, lifestyle"
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Location</label>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="New York, USA"
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Starting rate ($/post)</label>
            <input type="number" value={startingRate} onChange={e => setStartingRate(e.target.value)} placeholder="500"
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Past brand collaborations</label>
            <input value={pastBrands} onChange={e => setPastBrands(e.target.value)} placeholder="Nike, H&M, Sephora (comma separated)"
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-900">Platforms</h2>
            <button type="button" onClick={addPlatform}
              className="flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900 border border-zinc-200 px-3 py-1.5 rounded-lg">
              <Plus size={14} />Add platform
            </button>
          </div>
          {platforms.length === 0 && <p className="text-sm text-zinc-400">No platforms added yet.</p>}
          <div className="space-y-3">
            {platforms.map((p, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 items-center">
                <select value={p.platform} onChange={e => updatePlatform(i, 'platform', e.target.value)}
                  className="px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none">
                  {['instagram','tiktok','youtube','twitter','linkedin'].map(pl => (
                    <option key={pl} value={pl}>{pl}</option>
                  ))}
                </select>
                <input value={p.handle} onChange={e => updatePlatform(i, 'handle', e.target.value)} placeholder="@handle"
                  className="px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none" />
                <input type="number" value={p.followers || ''} onChange={e => updatePlatform(i, 'followers', parseInt(e.target.value) || 0)} placeholder="Followers"
                  className="px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none" />
                <button type="button" onClick={() => removePlatform(i)} className="flex justify-center text-zinc-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-zinc-900">Visibility</h2>
              <p className="text-sm text-zinc-500">Make your profile discoverable by brands.</p>
            </div>
            <button type="button" onClick={() => setIsPublished(p => !p)}
              className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${isPublished ? 'bg-zinc-900' : 'bg-zinc-200'}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-1 ${isPublished ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full bg-zinc-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50">
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Add username endpoint `app/api/creator-profiles/username/route.ts`**

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json(null)

  const { data } = await supabase.from('user_profiles').select('username').eq('user_id', user.id).single()
  return NextResponse.json(data ?? null)
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(creator\)/creator/media-kit/ app/api/creator-profiles/username/
git commit -m "feat: creator media kit editor"
```

---

## Task 6: Creator Dashboard + Invoices

**Files:**
- Create: `app/(creator)/creator/dashboard/page.tsx`
- Create: `app/(creator)/creator/invoices/page.tsx`
- Create: `app/(creator)/creator/invoices/new/page.tsx`
- Create: `app/api/creator-invoices/route.ts`
- Create: `app/pay/[token]/page.tsx`

- [ ] **Step 1: Create `app/(creator)/creator/dashboard/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'

export default async function CreatorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: invoices } = await supabase
    .from('creator_invoices')
    .select('*')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const pending = (invoices ?? []).filter(i => i.status !== 'paid')
  const pendingTotal = pending.reduce((s, i) => s + i.amount, 0)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Your deals and earnings at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-sm font-medium text-zinc-500 mb-2">Pending payments</p>
          <p className="text-2xl font-bold text-zinc-900">${(pendingTotal / 100).toLocaleString()}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{pending.length} invoice{pending.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-sm font-medium text-zinc-500 mb-2">Total invoiced</p>
          <p className="text-2xl font-bold text-zinc-900">${((invoices ?? []).reduce((s, i) => s + i.amount, 0) / 100).toLocaleString()}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{(invoices ?? []).length} invoice{(invoices ?? []).length !== 1 ? 's' : ''} total</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-zinc-900">Recent invoices</h2>
          <a href="/creator/invoices" className="text-xs text-zinc-500 hover:text-zinc-700">View all →</a>
        </div>
        {(invoices ?? []).length === 0 ? (
          <p className="text-sm text-zinc-400 py-4 text-center">No invoices yet. <a href="/creator/invoices/new" className="text-zinc-700 underline">Create one →</a></p>
        ) : (
          <div className="space-y-2">
            {(invoices ?? []).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-zinc-800">{inv.brand_name}</p>
                  <p className="text-xs text-zinc-400">{inv.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                    inv.status === 'sent' ? 'bg-amber-100 text-amber-700' :
                    'bg-zinc-100 text-zinc-600'
                  }`}>{inv.status}</span>
                  <span className="text-sm font-semibold text-zinc-900">${(inv.amount / 100).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/api/creator-invoices/route.ts`**

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase.from('creator_invoices').select('*').eq('creator_id', user.id).order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { brand_name, brand_email, description, amount_dollars, due_date } = body

  if (!brand_name || !brand_email || !description || !amount_dollars) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase.from('creator_invoices').insert({
    creator_id: user.id,
    brand_name,
    brand_email,
    description,
    amount: Math.round(parseFloat(amount_dollars) * 100),
    due_date: due_date || null,
    status: 'draft',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 3: Create `app/api/creator-invoices/[token]/send/route.ts`**

```ts
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: invoice } = await admin.from('creator_invoices').select('*').eq('pay_token', token).eq('creator_id', user.id).single()
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_placeholder') {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://influencr.app'
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'influencr <invoices@influencr.app>',
        to: invoice.brand_email,
        subject: `Invoice from creator — $${(invoice.amount / 100).toLocaleString()}`,
        html: `<p>Hi ${invoice.brand_name},</p><p>You have received an invoice of <strong>$${(invoice.amount / 100).toLocaleString()}</strong> for: ${invoice.description}</p><p><a href="${appUrl}/pay/${token}">View Invoice →</a></p>`,
      }),
    })
  }

  await admin.from('creator_invoices').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('pay_token', token)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Create `app/pay/[token]/page.tsx`**

```tsx
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

export default async function PayInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: invoice } = await admin.from('creator_invoices').select('*').eq('pay_token', token).single()
  if (!invoice) notFound()

  // Mark as viewed
  if (invoice.status === 'sent') {
    await admin.from('creator_invoices').update({ status: 'viewed', viewed_at: new Date().toISOString() }).eq('pay_token', token)
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <span className="font-bold text-lg">influencr</span>
            <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">invoice</span>
          </div>
          <div className="mb-6">
            <p className="text-sm text-zinc-500">To</p>
            <p className="font-semibold text-zinc-900">{invoice.brand_name}</p>
          </div>
          <div className="mb-6">
            <p className="text-sm text-zinc-500">For</p>
            <p className="text-zinc-800">{invoice.description}</p>
          </div>
          {invoice.due_date && (
            <div className="mb-6">
              <p className="text-sm text-zinc-500">Due date</p>
              <p className="text-zinc-800">{new Date(invoice.due_date).toLocaleDateString()}</p>
            </div>
          )}
          <div className="border-t border-zinc-100 pt-6">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Total due</span>
              <span className="text-3xl font-bold text-zinc-900">${(invoice.amount / 100).toLocaleString()}</span>
            </div>
          </div>
          <div className={`mt-6 text-center text-sm py-2 rounded-lg font-medium ${
            invoice.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {invoice.status === 'paid' ? '✓ Paid' : 'Payment pending'}
          </div>
        </div>
        <p className="text-center text-xs text-zinc-300 mt-6">Powered by influencr</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create invoice list and new invoice pages**

Create `app/(creator)/creator/invoices/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: invoices } = await supabase.from('creator_invoices').select('*').eq('creator_id', user.id).order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Invoices</h1>
        <Link href="/creator/invoices/new" className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-700">
          <Plus size={16} />New invoice
        </Link>
      </div>
      {(invoices ?? []).length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <p className="mb-4">No invoices yet.</p>
          <Link href="/creator/invoices/new" className="text-zinc-700 underline text-sm">Create your first invoice →</Link>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100">
          {(invoices ?? []).map((inv) => (
            <div key={inv.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-medium text-zinc-900">{inv.brand_name}</p>
                <p className="text-sm text-zinc-400">{inv.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                  inv.status === 'viewed' ? 'bg-blue-100 text-blue-700' :
                  inv.status === 'sent' ? 'bg-amber-100 text-amber-700' :
                  'bg-zinc-100 text-zinc-600'
                }`}>{inv.status}</span>
                <span className="font-semibold text-zinc-900">${(inv.amount / 100).toLocaleString()}</span>
                <a href={`/pay/${inv.pay_token}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-zinc-500 hover:text-zinc-700 underline">View link</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

Create `app/(creator)/creator/invoices/new/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewInvoicePage() {
  const router = useRouter()
  const [brandName, setBrandName] = useState('')
  const [brandEmail, setBrandEmail] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/creator-invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand_name: brandName, brand_email: brandEmail, description, amount_dollars: amount, due_date: dueDate }),
    })

    if (!res.ok) {
      const { error: msg } = await res.json()
      setError(msg)
      setLoading(false)
      return
    }

    router.push('/creator/invoices')
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold text-zinc-900 mb-8">New Invoice</h1>
      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Brand name</label>
          <input value={brandName} onChange={e => setBrandName(e.target.value)} required placeholder="Nike"
            className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Brand email</label>
          <input type="email" value={brandEmail} onChange={e => setBrandEmail(e.target.value)} required placeholder="marketing@nike.com"
            className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Description</label>
          <input value={description} onChange={e => setDescription(e.target.value)} required placeholder="Instagram post — Spring campaign"
            className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Amount (USD)</label>
            <input type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="500"
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Due date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-zinc-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-700 disabled:opacity-50">
          {loading ? 'Creating…' : 'Create invoice'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add app/\(creator\)/creator/ app/api/creator-invoices/ app/pay/
git commit -m "feat: creator dashboard, invoices, and pay page"
```

---

## Task 7: Contract Generator + Sign Page

**Files:**
- Create: `app/(dashboard)/contracts/page.tsx`
- Create: `app/(dashboard)/contracts/new/page.tsx`
- Create: `app/sign/[token]/page.tsx`
- Create: `app/api/contracts/route.ts`
- Create: `app/api/contracts/[token]/sign/route.ts`

- [ ] **Step 1: Create `app/api/contracts/route.ts`**

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('contracts')
    .select('*, influencer:influencers(name), campaign:campaigns(name)')
    .eq('brand_id', user.id)
    .order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { influencer_id, campaign_id, content } = body
  if (!influencer_id || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { data, error } = await supabase.from('contracts').insert({
    brand_id: user.id, influencer_id, campaign_id: campaign_id || null, content, status: 'draft',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 2: Create `app/api/contracts/[token]/sign/route.ts`**

```ts
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await request.json()
  const { signer_name } = body

  if (!signer_name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: contract } = await admin.from('contracts').select('*').eq('sign_token', token).single()
  if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  if (contract.status === 'signed') return NextResponse.json({ error: 'Already signed' }, { status: 400 })

  const ip = request.headers.get('x-forwarded-for') ?? ''
  const { error } = await admin.from('contracts').update({
    status: 'signed', signer_name: signer_name.trim(), signer_ip: ip, signed_at: new Date().toISOString(),
  }).eq('sign_token', token)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_placeholder') {
    const { data: { user } } = await admin.auth.admin.getUserById(contract.brand_id)
    if (user?.email) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'influencr <contracts@influencr.app>',
          to: user.email,
          subject: `Contract signed by ${signer_name}`,
          html: `<p><strong>${signer_name}</strong> has signed your contract.</p><p>Signed at: ${new Date().toLocaleString()}</p>`,
        }),
      })
    }
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Create `app/sign/[token]/page.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface Contract { content: string; status: string; signer_name?: string; signed_at?: string }

export default function SignContractPage() {
  const { token } = useParams<{ token: string }>()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [signerName, setSignerName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/contracts/${token}/view`).then(r => r.json()).then(data => {
      setContract(data)
      if (data?.status === 'signed') setSigned(true)
    }).finally(() => setLoading(false))
  }, [token])

  async function handleSign(e: React.FormEvent) {
    e.preventDefault()
    if (!agreed) { setError('You must agree to the terms before signing.'); return }
    setSigning(true)
    setError('')

    const res = await fetch(`/api/contracts/${token}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signer_name: signerName }),
    })

    if (!res.ok) {
      const { error: msg } = await res.json()
      setError(msg)
    } else {
      setSigned(true)
    }
    setSigning(false)
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-sm text-zinc-400">Loading…</div>
  if (!contract) return <div className="flex items-center justify-center min-h-screen text-sm text-zinc-400">Contract not found.</div>

  return (
    <div className="min-h-screen bg-zinc-50 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <span className="font-bold text-lg">influencr</span>
          <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">contract</span>
        </div>

        {signed ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">Contract signed</h2>
            <p className="text-sm text-zinc-500">
              {contract.signer_name ? `Signed by ${contract.signer_name}` : 'This contract has been signed.'}
              {contract.signed_at && ` on ${new Date(contract.signed_at).toLocaleDateString()}`}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-zinc-200 p-8 mb-6">
              <h2 className="font-semibold text-zinc-900 mb-4">Contract terms</h2>
              <div className="prose prose-sm max-w-none text-zinc-700 whitespace-pre-wrap text-sm leading-relaxed border border-zinc-100 rounded-lg p-4 bg-zinc-50 max-h-96 overflow-y-auto">
                {contract.content}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 p-8">
              <h2 className="font-semibold text-zinc-900 mb-4">Sign this contract</h2>
              {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>}
              <form onSubmit={handleSign} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Full name</label>
                  <input value={signerName} onChange={e => setSignerName(e.target.value)} required placeholder="Your full legal name"
                    className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5" />
                  <span className="text-sm text-zinc-600">I have read and agree to the terms above. I understand this constitutes a legally binding agreement.</span>
                </label>
                <button type="submit" disabled={signing || !agreed}
                  className="w-full bg-zinc-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-zinc-700 disabled:opacity-50">
                  {signing ? 'Signing…' : 'Sign contract'}
                </button>
              </form>
            </div>
          </>
        )}
        <p className="text-center text-xs text-zinc-300 mt-8">Powered by influencr</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `app/api/contracts/[token]/view/route.ts`**

```ts
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data } = await admin.from('contracts').select('content, status, signer_name, signed_at').eq('sign_token', token).single()
  if (!data) return NextResponse.json(null, { status: 404 })
  return NextResponse.json(data)
}
```

- [ ] **Step 5: Create contracts list page `app/(dashboard)/contracts/page.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'

interface Contract {
  id: string; status: string; created_at: string; sign_token: string;
  influencer: { name: string } | null; campaign: { name: string } | null
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/contracts').then(r => r.json()).then(setContracts).finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Contracts</h1>
        <Link href="/contracts/new" className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-700">
          <Plus size={16} />New contract
        </Link>
      </div>
      {loading ? <p className="text-sm text-zinc-400">Loading…</p> : contracts.length === 0 ? (
        <p className="text-sm text-zinc-400 py-8 text-center">No contracts yet.</p>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100">
          {contracts.map(c => (
            <div key={c.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-medium text-zinc-900">{c.influencer?.name ?? '—'}</p>
                <p className="text-sm text-zinc-400">{c.campaign?.name ?? 'No campaign'} · {new Date(c.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  c.status === 'signed' ? 'bg-green-100 text-green-700' :
                  c.status === 'sent' ? 'bg-amber-100 text-amber-700' :
                  c.status === 'declined' ? 'bg-red-100 text-red-700' :
                  'bg-zinc-100 text-zinc-600'
                }`}>{c.status}</span>
                <a href={`/sign/${c.sign_token}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-zinc-500 hover:text-zinc-700 underline">Sign link</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Create contract generator `app/(dashboard)/contracts/new/page.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Influencer { id: string; name: string; handle: string }
interface Campaign { id: string; name: string }

export default function NewContractPage() {
  const router = useRouter()
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [influencerId, setInfluencerId] = useState('')
  const [campaignId, setCampaignId] = useState('')
  const [deliverables, setDeliverables] = useState('')
  const [fee, setFee] = useState('')
  const [usageRights, setUsageRights] = useState('6 months, social media only')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/influencers').then(r => r.json()).then(setInfluencers)
    fetch('/api/campaigns').then(r => r.json()).then(setCampaigns)
  }, [])

  function buildContractContent() {
    const inf = influencers.find(i => i.id === influencerId)
    const camp = campaigns.find(c => c.id === campaignId)
    const today = new Date().toLocaleDateString()
    return `INFLUENCER COLLABORATION AGREEMENT

Date: ${today}

PARTIES
Brand: [Your brand name]
Creator: ${inf?.name ?? '[Creator name]'} (${inf?.handle ?? ''})

CAMPAIGN
${camp ? `Campaign: ${camp.name}` : ''}

DELIVERABLES
${deliverables}

COMPENSATION
Total fee: $${fee}
Due date: ${dueDate || 'To be agreed'}

USAGE RIGHTS
${usageRights}

TERMS
1. Creator agrees to create and publish the deliverables described above.
2. Creator grants brand the usage rights described above upon payment.
3. Content must be original and comply with FTC disclosure guidelines.
4. Brand agrees to pay the agreed fee upon delivery and approval of content.

By signing below, both parties agree to the terms of this agreement.`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!influencerId) { setError('Select an influencer'); return }
    setLoading(true)
    setError('')

    const res = await fetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ influencer_id: influencerId, campaign_id: campaignId || null, content: buildContractContent() }),
    })

    if (!res.ok) {
      const { error: msg } = await res.json()
      setError(msg)
      setLoading(false)
      return
    }

    router.push('/contracts')
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-zinc-900 mb-8">New Contract</h1>
      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-zinc-900">Details</h2>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Influencer</label>
            <select value={influencerId} onChange={e => setInfluencerId(e.target.value)} required
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900">
              <option value="">Select influencer…</option>
              {influencers.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Campaign (optional)</label>
            <select value={campaignId} onChange={e => setCampaignId(e.target.value)}
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900">
              <option value="">No campaign</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Deliverables</label>
            <textarea value={deliverables} onChange={e => setDeliverables(e.target.value)} required rows={3}
              placeholder="2x Instagram posts, 1x Story (24h)"
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Fee ($)</label>
              <input type="number" value={fee} onChange={e => setFee(e.target.value)} required placeholder="500"
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Content due date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Usage rights</label>
            <input value={usageRights} onChange={e => setUsageRights(e.target.value)}
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-zinc-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-zinc-700 disabled:opacity-50">
          {loading ? 'Generating…' : 'Generate contract'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add app/\(dashboard\)/contracts/ app/sign/ app/api/contracts/
git commit -m "feat: contract generator and e-sign flow"
```

---

## Task 8: Email Outreach

**Files:**
- Create: `app/(dashboard)/outreach/page.tsx`
- Create: `app/(dashboard)/outreach/new/page.tsx`
- Create: `app/api/outreach/route.ts`

- [ ] **Step 1: Create `app/api/outreach/route.ts`**

```ts
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('outreach_emails')
    .select('*, influencer:influencers(name, handle)')
    .eq('brand_id', user.id)
    .order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { influencer_id, subject, body: emailBody } = body
  if (!influencer_id || !subject || !emailBody) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { data: influencer } = await supabase.from('influencers').select('contact_email, name').eq('id', influencer_id).eq('user_id', user.id).single()
  if (!influencer) return NextResponse.json({ error: 'Influencer not found' }, { status: 404 })
  if (!influencer.contact_email) return NextResponse.json({ error: 'Influencer has no email address' }, { status: 400 })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: row, error } = await admin.from('outreach_emails').insert({
    brand_id: user.id, influencer_id, subject, body: emailBody, status: 'draft',
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_placeholder') {
    const { data: brandUser } = await admin.auth.admin.getUserById(user.id)
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `influencr <outreach@influencr.app>`,
        reply_to: brandUser?.user?.email,
        to: influencer.contact_email,
        subject,
        html: emailBody.replace(/\n/g, '<br>'),
      }),
    })
    await admin.from('outreach_emails').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', row.id)
  }

  return NextResponse.json(row, { status: 201 })
}
```

- [ ] **Step 2: Create `app/(dashboard)/outreach/page.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'

interface OutreachEmail {
  id: string; subject: string; status: string; created_at: string;
  influencer: { name: string; handle: string } | null
}

export default function OutreachPage() {
  const [emails, setEmails] = useState<OutreachEmail[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/outreach').then(r => r.json()).then(setEmails).finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Outreach</h1>
          <p className="text-sm text-zinc-500 mt-1">Send pitch emails to influencers without leaving the app.</p>
        </div>
        <Link href="/outreach/new" className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-700">
          <Plus size={16} />New email
        </Link>
      </div>
      {loading ? <p className="text-sm text-zinc-400">Loading…</p> : emails.length === 0 ? (
        <p className="text-sm text-zinc-400 py-8 text-center">No outreach emails yet.</p>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100">
          {emails.map(e => (
            <div key={e.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-medium text-zinc-900">{e.influencer?.name ?? '—'}</p>
                <p className="text-sm text-zinc-400">{e.subject}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                e.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-600'
              }`}>{e.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create `app/(dashboard)/outreach/new/page.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Influencer { id: string; name: string; handle: string }

const TEMPLATES = {
  collab: `Hi [Name],

I came across your profile and love your content — especially your recent posts about [topic].

We're [Brand Name], and we'd love to explore a collaboration. We think your audience would genuinely connect with what we do.

Would you be open to a quick chat about what that could look like?

Best,
[Your name]`,
  rate: `Hi [Name],

I'm reaching out because we'd love to work with you on an upcoming campaign.

Could you share your current rate card for Instagram posts and Stories?

Thanks so much,
[Your name]`,
  followup: `Hi [Name],

Just following up on my previous message — wanted to make sure it didn't get lost!

We'd still love to connect about a potential collaboration. Let me know if you're interested.

Best,
[Your name]`,
}

export default function NewOutreachPage() {
  const router = useRouter()
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [influencerId, setInfluencerId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState(TEMPLATES.collab)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/influencers').then(r => r.json()).then(setInfluencers)
  }, [])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/outreach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ influencer_id: influencerId, subject, body }),
    })

    if (!res.ok) {
      const { error: msg } = await res.json()
      setError(msg)
      setLoading(false)
      return
    }
    router.push('/outreach')
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-zinc-900 mb-8">New Outreach Email</h1>
      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>}

      <div className="flex gap-2 mb-6">
        {(['collab', 'rate', 'followup'] as const).map(t => (
          <button key={t} type="button" onClick={() => setBody(TEMPLATES[t])}
            className="text-xs border border-zinc-200 px-3 py-1.5 rounded-lg hover:bg-zinc-50 capitalize">{t} template</button>
        ))}
      </div>

      <form onSubmit={handleSend} className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">To</label>
          <select value={influencerId} onChange={e => setInfluencerId(e.target.value)} required
            className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900">
            <option value="">Select influencer…</option>
            {influencers.map(i => <option key={i.id} value={i.id}>{i.name} ({i.handle})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Subject</label>
          <input value={subject} onChange={e => setSubject(e.target.value)} required placeholder="Collab opportunity with [Brand]"
            className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Message</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} required rows={10}
            className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none font-mono" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-zinc-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-zinc-700 disabled:opacity-50">
          {loading ? 'Sending…' : 'Send email'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/\(dashboard\)/outreach/ app/api/outreach/
git commit -m "feat: email outreach with templates"
```

---

## Task 9: Discovery Search

**Files:**
- Create: `app/(dashboard)/discover/page.tsx`
- Create: `app/api/discover/route.ts`

- [ ] **Step 1: Create `app/api/discover/route.ts`**

```ts
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const niche = searchParams.get('niche')
  const platform = searchParams.get('platform')
  const location = searchParams.get('location')
  const minRate = searchParams.get('min_rate')
  const maxRate = searchParams.get('max_rate')

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  let query = admin
    .from('creator_profiles')
    .select('*, user_profile:user_profiles(username)')
    .eq('is_published', true)

  if (niche) query = query.contains('niche', [niche.toLowerCase()])
  if (location) query = query.ilike('location', `%${location}%`)
  if (minRate) query = query.gte('starting_rate', parseInt(minRate))
  if (maxRate) query = query.lte('starting_rate', parseInt(maxRate))

  const { data, error } = await query.order('created_at', { ascending: false }).limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let results = data ?? []
  if (platform) {
    results = results.filter((c: any) =>
      Array.isArray(c.platforms) && c.platforms.some((p: any) => p.platform === platform)
    )
  }

  return NextResponse.json(results)
}
```

- [ ] **Step 2: Create `app/(dashboard)/discover/page.tsx`**

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

interface Platform { platform: string; handle: string; followers: number }
interface Creator {
  id: string; bio: string; niche: string[]; platforms: Platform[]; location: string;
  starting_rate: number | null; user_profile: { username: string } | null
}

const NICHES = ['fashion','beauty','lifestyle','fitness','food','travel','tech','gaming','parenting','finance']
const PLATFORMS = ['instagram','tiktok','youtube','twitter']

export default function DiscoverPage() {
  const [results, setResults] = useState<Creator[]>([])
  const [loading, setLoading] = useState(false)
  const [niche, setNiche] = useState('')
  const [platform, setPlatform] = useState('')
  const [location, setLocation] = useState('')
  const [maxRate, setMaxRate] = useState('')

  const search = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (niche) params.set('niche', niche)
    if (platform) params.set('platform', platform)
    if (location) params.set('location', location)
    if (maxRate) params.set('max_rate', maxRate)

    const res = await fetch(`/api/discover?${params}`)
    const data = await res.json()
    setResults(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [niche, platform, location, maxRate])

  useEffect(() => { search() }, [search])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Discover Creators</h1>
        <p className="text-sm text-zinc-500 mt-1">Find influencers who have published their profile on influencr.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-3 text-zinc-400" />
          <select value={niche} onChange={e => setNiche(e.target.value)}
            className="w-full pl-8 pr-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 appearance-none bg-white">
            <option value="">All niches</option>
            {NICHES.map(n => <option key={n} value={n} className="capitalize">{n}</option>)}
          </select>
        </div>
        <select value={platform} onChange={e => setPlatform(e.target.value)}
          className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900">
          <option value="">All platforms</option>
          {PLATFORMS.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
        </select>
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location (e.g. New York)"
          className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        <input type="number" value={maxRate} onChange={e => setMaxRate(e.target.value)} placeholder="Max rate ($/post)"
          className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Searching…</p>
      ) : results.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <p>No creators found matching your filters.</p>
          <p className="text-xs mt-2">Creators appear here once they publish their profile on influencr.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map(creator => {
            const username = creator.user_profile?.username
            const topPlatform = creator.platforms?.[0]
            return (
              <a key={creator.id} href={username ? `/c/${username}` : '#'} target="_blank" rel="noopener noreferrer"
                className="bg-white border border-zinc-200 rounded-xl p-5 hover:border-zinc-300 transition-colors block">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-zinc-900">@{username}</p>
                    {creator.location && <p className="text-xs text-zinc-400">{creator.location}</p>}
                  </div>
                  {creator.starting_rate && (
                    <p className="text-sm font-semibold text-zinc-700">${creator.starting_rate.toLocaleString()}</p>
                  )}
                </div>
                {creator.bio && <p className="text-sm text-zinc-500 line-clamp-2 mb-3">{creator.bio}</p>}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {creator.niche?.slice(0, 3).map(n => (
                    <span key={n} className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full capitalize">{n}</span>
                  ))}
                </div>
                {topPlatform && (
                  <p className="text-xs text-zinc-400 capitalize">{topPlatform.platform} · {formatNumber(topPlatform.followers)} followers</p>
                )}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(dashboard\)/discover/ app/api/discover/
git commit -m "feat: creator discovery search for brands"
```

---

## Task 10: Sidebar Updates + Landing Page

**Files:**
- Modify: `components/sidebar.tsx`
- Modify: `app/page.tsx`
- Create: `app/for-creators/page.tsx`

- [ ] **Step 1: Add new nav items to `components/sidebar.tsx`**

Replace the `nav` array:

```tsx
const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/influencers', label: 'Influencers', icon: Users },
  { href: '/campaigns', label: 'Campaigns', icon: BarChart3 },
  { href: '/discover', label: 'Discover', icon: Search },
  { href: '/outreach', label: 'Outreach', icon: Mail },
  { href: '/contracts', label: 'Contracts', icon: FileSignature },
  { href: '/payments', label: 'Payments', icon: CreditCard },
]
```

Add to imports:
```tsx
import { Users, BarChart3, CreditCard, LayoutDashboard, Settings, LogOut, Search, Mail, FileSignature } from 'lucide-react'
```

- [ ] **Step 2: Update landing page hero in `app/page.tsx`**

Replace the hero section's two link buttons with:

```tsx
<div className="flex flex-col sm:flex-row gap-4 mt-10">
  <Link
    href="/signup?type=brand"
    className="flex items-center justify-center gap-2 bg-zinc-900 text-white px-8 py-3.5 rounded-lg text-base font-medium hover:bg-zinc-700 transition-colors"
  >
    Start free trial — I'm a brand <ArrowRight size={16} />
  </Link>
  <Link
    href="/for-creators"
    className="flex items-center justify-center gap-2 border border-zinc-200 text-zinc-700 px-8 py-3.5 rounded-lg text-base font-medium hover:bg-zinc-50 transition-colors"
  >
    I'm a creator — it's free
  </Link>
</div>
```

- [ ] **Step 3: Create `app/for-creators/page.tsx`**

```tsx
import Link from 'next/link'
import { FileText, BarChart3, CreditCard, ArrowRight, Check } from 'lucide-react'

export default function ForCreatorsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <nav className="border-b border-zinc-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-bold text-xl tracking-tight">influencr</Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-zinc-600 hover:text-zinc-900">Sign in</Link>
            <Link href="/signup" className="text-sm bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors">
              Join free
            </Link>
          </div>
        </div>
      </nav>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 bg-zinc-50">
        <div className="inline-flex items-center gap-2 bg-white border border-zinc-200 rounded-full px-4 py-1.5 text-sm text-zinc-600 mb-8">
          Free for creators — forever
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-zinc-900 max-w-3xl leading-tight">
          Your media kit, invoices, and deals in one place
        </h1>
        <p className="mt-6 text-xl text-zinc-500 max-w-2xl">
          Stop cobbling together Canva, PayPal, and Google Docs. Get a shareable media kit page, a professional invoice generator, and a deal tracker — completely free.
        </p>
        <Link href="/signup" className="flex items-center justify-center gap-2 bg-zinc-900 text-white px-8 py-3.5 rounded-lg text-base font-medium hover:bg-zinc-700 transition-colors mt-10">
          Create your free profile <ArrowRight size={16} />
        </Link>
        <p className="mt-4 text-sm text-zinc-400">No credit card. No catch.</p>
      </section>

      <section className="py-20 px-6 max-w-6xl mx-auto w-full">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: FileText, title: 'Shareable media kit', desc: 'Your own page at influencr.app/c/yourname. Share it with brands in every pitch email.' },
            { icon: BarChart3, title: 'Deal tracker', desc: 'See all your active brand deals, deadlines, and payment status in one place. No more spreadsheets.' },
            { icon: CreditCard, title: 'Invoice generator', desc: 'Create professional invoices in seconds. Send a link — brands see what they owe. You mark it paid when done.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-xl border border-zinc-200 bg-white">
              <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center mb-4">
                <Icon size={20} className="text-zinc-700" />
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">{title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-6 bg-zinc-50 text-center">
        <h2 className="text-3xl font-bold text-zinc-900 mb-4">Everything free, forever</h2>
        <ul className="inline-flex flex-col gap-3 text-left mb-8">
          {['Public media kit page','Deal tracker for brand collaborations','Invoice generator','Contract signing','Discoverable by brands on influencr'].map(f => (
            <li key={f} className="flex items-center gap-3 text-sm text-zinc-700">
              <Check size={16} className="text-green-500 shrink-0" />{f}
            </li>
          ))}
        </ul>
        <div><Link href="/signup" className="inline-flex items-center gap-2 bg-zinc-900 text-white px-8 py-3.5 rounded-lg text-base font-medium hover:bg-zinc-700 transition-colors">
          Create your free profile <ArrowRight size={16} />
        </Link></div>
      </section>

      <footer className="border-t border-zinc-200 py-8 px-6 text-center text-sm text-zinc-400">
        <Link href="/" className="font-semibold text-zinc-700">influencr</Link>
        <span className="mx-4">·</span>
        <Link href="/login" className="hover:text-zinc-600">Login</Link>
        <span className="mx-4">·</span>
        <Link href="/signup" className="hover:text-zinc-600">Sign up</Link>
      </footer>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/sidebar.tsx app/page.tsx app/for-creators/
git commit -m "feat: update landing page and sidebar with new routes"
```

---

## Task 11: Final Push to GitHub + Vercel

- [ ] **Step 1: Build check**

```bash
npm run build 2>&1
```
Expected: no TypeScript errors, all routes compile.

- [ ] **Step 2: Fix any TypeScript errors surfaced by build**

If errors appear, fix them. Common ones:
- Missing `'use client'` on pages using `useState`/`useEffect`
- Type mismatches on Supabase responses — cast with `as any` only if necessary

- [ ] **Step 3: Push to GitHub**

```bash
git push origin master
```

- [ ] **Step 4: Deploy to Vercel preview**

```bash
NODE_OPTIONS="--use-system-ca" vercel 2>&1
```

Expected: READY state with a preview URL.

- [ ] **Step 5: Smoke test critical paths**

Open the preview URL in browser and verify:
1. Landing page shows two CTAs (brand trial + creator free)
2. `/for-creators` loads correctly
3. Signup shows brand/creator toggle
4. `/sign/[any-invalid-token]` shows "Contract not found"
5. `/pay/[any-invalid-token]` shows 404

---

## Self-Review Notes

- `user_profiles` created via `upsert` in auth callback — handles re-verification flows correctly
- `/c/[username]` uses admin client (service role) to bypass RLS for public reads
- Outreach emails use `reply_to: brand's email` so creator replies go directly to the brand
- Discovery filters run server-side with admin client — no user data exposed in client
- All token-based public pages (sign, pay) use `notFound()` for missing tokens — no info leakage
- Creator layout redirects brands to `/dashboard` if they accidentally hit `/creator/*`
