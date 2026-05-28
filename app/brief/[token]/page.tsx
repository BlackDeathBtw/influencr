import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

interface Brief {
  id: string
  title: string
  objective: string | null
  target_audience: string | null
  key_messages: string | null
  dos: string | null
  donts: string | null
  deliverables: string | null
  deadline: string | null
  compensation: string | null
  created_at: string
}

function Section({ title, content }: { title: string; content: string | null }) {
  if (!content) return null
  return (
    <section className="mb-8">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        {title}
      </h2>
      <p className="text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
    </section>
  )
}

function PrintButton() {
  return (
    <button
      onClick={() => typeof window !== 'undefined' && window.print()}
      suppressHydrationWarning
      className="text-xs border border-border text-muted-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors print:hidden"
    >
      Print
    </button>
  )
}

export default async function BriefPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: brief } = await admin
    .from('campaign_briefs')
    .select('*')
    .eq('share_token', token)
    .single()

  if (!brief) notFound()

  const b = brief as Brief
  const createdDate = new Date(b.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-8 py-4 flex items-center justify-between print:border-0">
        <span className="font-display font-bold text-lg tracking-tight text-foreground">influencr</span>
        <PrintButton />
      </header>

      <main className="max-w-2xl mx-auto px-8 py-12">
        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground mb-2">{b.title}</h1>
        {b.deadline && (
          <p className="text-sm text-muted-foreground mb-10">
            Deadline:{' '}
            <span className="font-medium text-foreground/80">
              {new Date(b.deadline).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </p>
        )}
        {!b.deadline && <div className="mb-10" />}

        <Section title="Objective" content={b.objective} />
        <Section title="Target Audience" content={b.target_audience} />
        <Section title="Key Messages" content={b.key_messages} />

        {/* Dos & Don'ts side by side */}
        {(b.dos || b.donts) && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Dos &amp; Don&apos;ts
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {b.dos && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl p-4">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">Dos</p>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{b.dos}</p>
                </div>
              )}
              {b.donts && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">Don&apos;ts</p>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{b.donts}</p>
                </div>
              )}
            </div>
          </section>
        )}

        <Section title="Deliverables" content={b.deliverables} />
        <Section title="Compensation" content={b.compensation} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6 text-center text-xs text-muted-foreground/60 print:mt-8">
        Created with{' '}
        <span className="font-semibold text-muted-foreground">influencr</span>
        {' · '}{createdDate}
      </footer>
    </div>
  )
}
