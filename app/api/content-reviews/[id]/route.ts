import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const body = await req.json()

  // Public submission via token (no auth)
  if (body.action === 'submit') {
    const { submission_url, submission_notes, review_token } = body
    if (!review_token) return NextResponse.json({ error: 'token required' }, { status: 400 })

    const { data, error } = await supabase
      .from('content_reviews')
      .update({
        submission_url: submission_url || null,
        submission_notes: submission_notes || null,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('review_token', review_token)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // Brand review actions (requires auth)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const updates: Record<string, unknown> = { reviewed_at: new Date().toISOString() }
  if (body.action === 'approve') {
    updates.status = 'approved'
    updates.feedback = body.feedback || null
  } else if (body.action === 'request_changes') {
    updates.status = 'changes_requested'
    updates.feedback = body.feedback || null
  }

  const { data, error } = await supabase
    .from('content_reviews')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
