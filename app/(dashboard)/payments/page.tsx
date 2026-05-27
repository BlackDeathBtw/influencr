import { createClient } from '@/lib/supabase/server'
import { getPayments } from '@/lib/data'
import PaymentManager from '@/components/payment-manager'

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [payments, { data: influencers }, { data: campaigns }] = await Promise.all([
    getPayments(user!.id),
    supabase.from('influencers').select('id, name').eq('user_id', user!.id),
    supabase.from('campaigns').select('id, name').eq('user_id', user!.id),
  ])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        <p className="text-sm text-muted-foreground mt-1">Track influencer fees and invoices</p>
      </div>
      <PaymentManager
        payments={payments}
        influencers={influencers ?? []}
        campaigns={campaigns ?? []}
        userId={user!.id}
      />
    </div>
  )
}
