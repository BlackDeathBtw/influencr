import { createClient } from '@/lib/supabase/server'
import { getInfluencers } from '@/lib/data'
import { getInfluencersForComparison } from '@/lib/compare-data'
import CreatorComparison from '@/components/creator-comparison'

type Props = {
  searchParams: Promise<{ ids?: string }>
}

export default async function ComparePage({ searchParams }: Props) {
  const { ids } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const allInfluencers = await getInfluencers(user!.id)

  const parsedIds =
    ids && ids.trim().length > 0
      ? ids
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
          .slice(0, 5)
      : []

  const selectedInfluencers =
    parsedIds.length > 0
      ? await getInfluencersForComparison(user!.id, parsedIds)
      : []

  return (
    <div className="p-8">
      <CreatorComparison
        allInfluencers={allInfluencers as any}
        selectedInfluencers={selectedInfluencers}
      />
    </div>
  )
}
