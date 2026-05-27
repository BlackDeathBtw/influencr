'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link2, Check, Calendar } from 'lucide-react'
import FileUpload from '@/components/file-upload'
import type { Influencer } from '@/types'

const OUTREACH_STATUSES = ['not_contacted', 'reached_out', 'responded', 'declined'] as const
const outreachColors: Record<string, string> = {
  not_contacted: 'bg-muted text-muted-foreground',
  reached_out: 'bg-blue-100 text-blue-700',
  responded: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-600',
}

interface Props {
  influencer: Influencer
  portalUrl: string
}

export default function InfluencerExtras({ influencer, portalUrl }: Props) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [outreachStatus, setOutreachStatus] = useState(influencer.outreach_status ?? 'not_contacted')
  const [lastContacted, setLastContacted] = useState(
    influencer.last_contacted_at ? influencer.last_contacted_at.slice(0, 10) : ''
  )
  const [briefUrl, setBriefUrl] = useState(influencer.brief_url)
  const [saving, setSaving] = useState(false)

  function copyPortalLink() {
    navigator.clipboard.writeText(portalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function saveOutreach() {
    setSaving(true)
    await fetch(`/api/influencers/${influencer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outreach_status: outreachStatus,
        last_contacted_at: lastContacted ? new Date(lastContacted).toISOString() : null,
      }),
    })
    setSaving(false)
    router.refresh()
  }

  async function markContactedToday() {
    const today = new Date().toISOString().slice(0, 10)
    setLastContacted(today)
    setSaving(true)
    await fetch(`/api/influencers/${influencer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        last_contacted_at: new Date().toISOString(),
        outreach_status: outreachStatus === 'not_contacted' ? 'reached_out' : outreachStatus,
      }),
    })
    setOutreachStatus(prev => prev === 'not_contacted' ? 'reached_out' : prev)
    setSaving(false)
    router.refresh()
  }

  return (
    <>
      {/* Portal link */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-foreground text-sm">Influencer portal</h3>
        <p className="text-xs text-muted-foreground">Share this link so the influencer can see their assignments, deadlines, and payment status.</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={portalUrl}
            className="flex-1 px-3 py-2 border border-border rounded-lg text-xs text-muted-foreground bg-background truncate"
          />
          <button
            onClick={copyPortalLink}
            className="flex items-center gap-1.5 px-3 py-2 bg-foreground/90 text-background rounded-lg text-xs font-medium hover:bg-foreground transition-colors shrink-0"
          >
            {copied ? <Check size={12} /> : <Link2 size={12} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Outreach log */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-foreground text-sm">Outreach log</h3>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
          <select
            value={outreachStatus}
            onChange={e => setOutreachStatus(e.target.value as typeof outreachStatus)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card"
          >
            {OUTREACH_STATUSES.map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Last contacted</label>
          <input
            type="date"
            value={lastContacted}
            onChange={e => setLastContacted(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={saveOutreach}
            disabled={saving}
            className="flex-1 bg-foreground/90 text-background py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={markContactedToday}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 border border-border text-muted-foreground rounded-lg text-sm hover:bg-background transition-colors disabled:opacity-50"
          >
            <Calendar size={13} /> Today
          </button>
        </div>
        {influencer.last_contacted_at && (
          <p className="text-xs text-muted-foreground/70">
            Last: {new Date(influencer.last_contacted_at).toLocaleDateString()}
            {' '}<span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${outreachColors[outreachStatus]}`}>
              {outreachStatus.replace(/_/g, ' ')}
            </span>
          </p>
        )}
      </div>

      {/* Brief upload */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-foreground text-sm">Brief / contract</h3>
        <FileUpload
          influencerId={influencer.id}
          userId={influencer.user_id}
          currentUrl={briefUrl}
          onSaved={url => { setBriefUrl(url); router.refresh() }}
        />
      </div>
    </>
  )
}
