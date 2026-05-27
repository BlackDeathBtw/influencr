import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import CreatorSidebar from '@/components/creator-sidebar'

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check account type — brands get sent to dashboard
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data: acct } = await admin
    .from('user_account_types')
    .select('account_type')
    .eq('user_id', user.id)
    .single()
  if (acct?.account_type === 'brand') redirect('/dashboard')

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <CreatorSidebar userEmail={user.email ?? ''} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
