import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/sidebar'
import Link from 'next/link'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', user.id)
    .single()

  const isBlocked = subscription?.status === 'canceled' || subscription?.status === 'past_due'

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      <Sidebar userEmail={user.email ?? ''} />
      <main className="flex-1 overflow-y-auto">
        {isBlocked ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="max-w-md">
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">Subscription required</h2>
              <p className="text-zinc-500 mb-6">
                {subscription?.status === 'past_due'
                  ? 'Your payment failed. Please update your billing details to continue.'
                  : 'Your subscription has ended. Resubscribe to access your data.'}
              </p>
              <Link
                href="/settings"
                className="inline-block bg-zinc-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-zinc-700 transition-colors"
              >
                Go to billing →
              </Link>
            </div>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  )
}
