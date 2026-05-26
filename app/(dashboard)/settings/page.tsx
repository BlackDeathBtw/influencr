import { createClient } from '@/lib/supabase/server'
import BillingSection from '@/components/billing-section'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user!.id)
    .single()

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Settings</h1>

      <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-zinc-900 mb-4">Account</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Email</label>
            <p className="text-sm text-zinc-800">{user?.email}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Account ID</label>
            <p className="text-sm text-zinc-400 font-mono">{user?.id}</p>
          </div>
        </div>
      </div>

      <BillingSection subscription={subscription} userEmail={user?.email ?? ''} />
    </div>
  )
}
