import InfluencerForm from '@/components/influencer-form'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function NewInfluencerPage() {
  return (
    <div className="p-8">
      <Link href="/influencers" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-6">
        <ChevronLeft size={14} /> Back to influencers
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Add influencer</h1>
      <InfluencerForm />
    </div>
  )
}
