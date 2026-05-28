import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('creator_expenses')
    .select('*')
    .eq('creator_id', user.id)
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { amount_dollars, category, description, date } = body

  if (!description?.trim()) {
    return NextResponse.json({ error: 'description is required' }, { status: 400 })
  }
  if (!amount_dollars || isNaN(Number(amount_dollars)) || Number(amount_dollars) <= 0) {
    return NextResponse.json({ error: 'amount_dollars must be a positive number' }, { status: 400 })
  }
  const validCategories = ['equipment', 'software', 'travel', 'marketing', 'other']
  if (!validCategories.includes(category)) {
    return NextResponse.json({ error: 'invalid category' }, { status: 400 })
  }
  if (!date) {
    return NextResponse.json({ error: 'date is required' }, { status: 400 })
  }

  const amountCents = Math.round(Number(amount_dollars) * 100)

  const { data, error } = await supabase
    .from('creator_expenses')
    .insert({
      creator_id: user.id,
      amount: amountCents,
      category,
      description: description.trim(),
      date,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { error } = await supabase
    .from('creator_expenses')
    .delete()
    .eq('id', id)
    .eq('creator_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
