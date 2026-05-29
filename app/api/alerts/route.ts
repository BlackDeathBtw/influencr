import { createClient } from '@/lib/supabase/server'
import { getReengagementAlerts } from '@/lib/alerts-data'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const alerts = await getReengagementAlerts(user.id)
  return NextResponse.json(alerts)
}
