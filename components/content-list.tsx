'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ExternalLink } from 'lucide-react'

interface ContentItem {
  id: string
  type: string
  due_date: string | null
  posted_at: string | null
  url: string | null
  status: string
  influencer: { name: string } | null
  influencer_id: string
  views: number | null
  reach: number | null
  likes: number | null
  comments: number | null
}

interface Influencer {
  id: string
  name: string
}

interface Props {
  campaignId: string
  userId: string
  content: ContentItem[]
  influencers: Influencer[]
}

const statusColors: Record<string, string> = {
  briefed: 'bg-zinc-100 text-zinc-600',
  in_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  posted: 'bg-green-100 text-green-700',
}

const CONTENT_TYPES = ['post', 'story', 'reel', 'video', 'blog']
const CONTENT_STATUSES = ['briefed', 'in_review', 'approved', 'posted']

export default function ContentList({ campaignId, userId, content, influencers }: Props) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [roiForm, setRoiForm] = useState<Record<string, string>>({})
  const [savingRoi, setSavingRoi] = useState(false)

  const [form, setForm] = useState({
    influencer_id: '',
    type: 'post',
    due_date: '',
    status: 'briefed',
    url: '',
  })
  const [loading, setLoading] = useState(false)

  async function addContent() {
    if (!form.influencer_id) return
    setLoading(true)
    await fetch('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_id: campaignId,
        user_id: userId,
        influencer_id: form.influencer_id,
        type: form.type,
        due_date: form.due_date || null,
        status: form.status,
        url: form.url || null,
      }),
    })
    setAdding(false)
    setForm({ influencer_id: '', type: 'post', due_date: '', status: 'briefed', url: '' })
    setLoading(false)
    router.refresh()
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/content/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    router.refresh()
  }

  async function remove(id: string) {
    if (!confirm('Delete this content piece?')) return
    await fetch(`/api/content/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  async function saveRoi(id: string) {
    setSavingRoi(true)
    const f = roiForm
    await fetch(`/api/content/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        views: f.views ? parseInt(f.views) : null,
        reach: f.reach ? parseInt(f.reach) : null,
        likes: f.likes ? parseInt(f.likes) : null,
        comments: f.comments ? parseInt(f.comments) : null,
      }),
    })
    setSavingRoi(false)
    setExpandedId(null)
    router.refresh()
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-zinc-900">Content ({content.length})</h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900 font-medium"
          >
            <Plus size={14} /> Add
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-4 p-4 bg-zinc-50 rounded-lg border border-zinc-200 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.influencer_id}
              onChange={e => setForm(f => ({ ...f, influencer_id: e.target.value }))}
              className="px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white"
            >
              <option value="">Select influencer</option>
              {influencers.map(inf => <option key={inf.id} value={inf.id}>{inf.name}</option>)}
            </select>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white"
            >
              {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input
              type="date"
              value={form.due_date}
              onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
              placeholder="Due date"
              className="px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white"
            />
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white"
            >
              {CONTENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <input
            value={form.url}
            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            placeholder="Content URL (optional)"
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={addContent}
              disabled={!form.influencer_id || loading}
              className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Adding…' : 'Add content'}
            </button>
            <button
              onClick={() => setAdding(false)}
              className="border border-zinc-200 text-zinc-600 px-4 py-2 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {content.length === 0 ? (
        <p className="text-sm text-zinc-400 py-4 text-center">No content pieces tracked yet</p>
      ) : (
        <div className="space-y-1">
          {content.map(c => (
            <div key={c.id} className="border-b border-zinc-100 last:border-0">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-zinc-800">{c.influencer?.name ?? '—'}</p>
                      <span className="text-xs text-zinc-400 capitalize">{c.type}</span>
                    </div>
                    {c.due_date && (
                      <p className="text-xs text-zinc-400">Due: {new Date(c.due_date).toLocaleDateString()}</p>
                    )}
                    {(c.views || c.reach) ? (
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {c.views ? `${c.views.toLocaleString()} views` : ''}
                        {c.views && c.reach ? ' · ' : ''}
                        {c.reach ? `${c.reach.toLocaleString()} reach` : ''}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.url && (
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-700">
                      <ExternalLink size={13} />
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setExpandedId(expandedId === c.id ? null : c.id)
                      setRoiForm({ views: c.views?.toString() ?? '', reach: c.reach?.toString() ?? '', likes: c.likes?.toString() ?? '', comments: c.comments?.toString() ?? '' })
                    }}
                    className="text-xs text-zinc-400 hover:text-zinc-700 font-medium"
                  >
                    ROI
                  </button>
                  <select
                    value={c.status}
                    onChange={e => updateStatus(c.id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${statusColors[c.status]}`}
                  >
                    {CONTENT_STATUSES.map(s => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <button onClick={() => remove(c.id)} className="text-zinc-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {expandedId === c.id && (
                <div className="pb-3 px-1">
                  <div className="bg-zinc-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-zinc-500 mb-2">Log performance metrics</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['views', 'reach', 'likes', 'comments'] as const).map(field => (
                        <div key={field}>
                          <label className="block text-xs text-zinc-500 mb-1 capitalize">{field}</label>
                          <input
                            type="number"
                            min="0"
                            value={roiForm[field] ?? ''}
                            onChange={e => setRoiForm(f => ({ ...f, [field]: e.target.value }))}
                            placeholder="0"
                            className="w-full px-2 py-1.5 border border-zinc-200 rounded text-sm"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => saveRoi(c.id)}
                      disabled={savingRoi}
                      className="w-full bg-zinc-900 text-white py-1.5 rounded text-xs font-medium disabled:opacity-50"
                    >
                      {savingRoi ? 'Saving…' : 'Save metrics'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
