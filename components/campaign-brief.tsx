'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

interface BriefData {
  goal?: string
  audience?: string
  messages?: string
  dos?: string
  donts?: string
  hashtags?: string
  links?: string
}

interface Props {
  campaignId: string
  brief: BriefData
}

export default function CampaignBrief({ campaignId, brief: initialBrief }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<BriefData>(initialBrief)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function set(key: keyof BriefData, value: string) {
    setForm(f => ({ ...f, [key]: value }))
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    await fetch(`/api/campaigns/${campaignId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief: form }),
    })
    setSaving(false)
    setSaved(true)
    router.refresh()
  }

  const filled = Object.values(form).filter(Boolean).length

  return (
    <div className="bg-card border border-border rounded-xl">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <h2 className="font-semibold text-foreground text-sm">Campaign brief</h2>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            {filled > 0 ? `${filled} field${filled !== 1 ? 's' : ''} filled` : 'Talking points, goals, dos & don\'ts for your influencers'}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={`text-muted-foreground/70 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div className={`grid transition-all duration-200 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Campaign goal</label>
              <textarea
                value={form.goal ?? ''}
                onChange={e => set('goal', e.target.value)}
                rows={2}
                placeholder="e.g. Drive awareness for our summer product launch among 18–24 year olds"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Target audience</label>
              <input
                value={form.audience ?? ''}
                onChange={e => set('audience', e.target.value)}
                placeholder="e.g. Women 25–34, interested in skincare and wellness"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Key messages / talking points</label>
              <textarea
                value={form.messages ?? ''}
                onChange={e => set('messages', e.target.value)}
                rows={3}
                placeholder="What should influencers communicate about the product?"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Do's</label>
                <textarea
                  value={form.dos ?? ''}
                  onChange={e => set('dos', e.target.value)}
                  rows={3}
                  placeholder="e.g. Show the product in use, mention the discount code"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Don'ts</label>
                <textarea
                  value={form.donts ?? ''}
                  onChange={e => set('donts', e.target.value)}
                  rows={3}
                  placeholder="e.g. Don't mention competitor brands"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Required hashtags</label>
              <input
                value={form.hashtags ?? ''}
                onChange={e => set('hashtags', e.target.value)}
                placeholder="#ad #sponsored #BrandName"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Assets / links</label>
              <input
                value={form.links ?? ''}
                onChange={e => set('links', e.target.value)}
                placeholder="Google Drive, Dropbox, or any URL with brand assets"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save brief'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
