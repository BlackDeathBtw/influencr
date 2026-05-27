import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('creator_invoices')
    .select('*')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { brand_name, brand_email, description, amount_dollars, due_date } = body

  if (!brand_name?.trim()) return NextResponse.json({ error: 'brand_name is required' }, { status: 400 })
  if (!brand_email?.trim()) return NextResponse.json({ error: 'brand_email is required' }, { status: 400 })
  if (!description?.trim()) return NextResponse.json({ error: 'description is required' }, { status: 400 })
  if (!amount_dollars || isNaN(Number(amount_dollars)) || Number(amount_dollars) <= 0) {
    return NextResponse.json({ error: 'amount_dollars must be a positive number' }, { status: 400 })
  }

  const amountCents = Math.round(Number(amount_dollars) * 100)
  const payToken = randomBytes(24).toString('hex')

  const { data, error } = await supabase
    .from('creator_invoices')
    .insert({
      creator_id: user.id,
      brand_name: brand_name.trim(),
      brand_email: brand_email.trim(),
      description: description.trim(),
      amount: amountCents,
      pay_token: payToken,
      status: 'draft',
      due_date: due_date ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
