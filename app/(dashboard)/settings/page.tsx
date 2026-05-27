import { createClient } from '@/lib/supabase/server'
import BillingSection from '@/components/billing-section'
import BrandKitSection from '@/components/brand-kit-section'

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
      <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-foreground mb-4">Account</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
            <p className="text-sm text-foreground/90">{user?.email}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Account ID</label>
            <p className="text-sm text-muted-foreground/70 font-mono">{user?.id}</p>
          </div>
        </div>
      </div>

      <BrandKitSection />

      <BillingSection subscription={subscription} userEmail={user?.email ?? ''} />
    </div>
  )
}
