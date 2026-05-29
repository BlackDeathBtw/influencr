import { createClient } from '@/lib/supabase/server'
import UGCUploader from '@/components/ugc-uploader'

export default async function UGCNewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: influencers }, { data: campaigns }] = await Promise.all([
    supabase
      .from('influencers')
      .select('id, name')
      .eq('user_id', user!.id)
      .eq('status', 'active')
      .order('name'),
    supabase
      .from('campaigns')
      .select('id, name')
      .eq('user_id', user!.id)
      .order('name'),
  ])

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Upload Asset</h1>
        <p className="text-sm text-muted-foreground mt-1">Add a new asset to your UGC library</p>
      </div>
      <UGCUploader
        influencers={influencers ?? []}
        campaigns={campaigns ?? []}
      />
    </div>
  )
}
