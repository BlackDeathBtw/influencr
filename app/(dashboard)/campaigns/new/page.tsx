import CampaignForm from '@/components/campaign-form'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function NewCampaignPage() {
  return (
    <div className="p-8">
      <Link href="/campaigns" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-6">
        <ChevronLeft size={14} /> Back to campaigns
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">New campaign</h1>
      <div className="max-w-2xl bg-white border border-zinc-200 rounded-xl p-6">
        <CampaignForm />
      </div>
    </div>
  )
}
