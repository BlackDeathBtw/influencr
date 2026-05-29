'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { UGCAsset } from '@/types/ugc'

const RIGHTS_STATUSES = ['pending', 'approved', 'rejected', 'licensed']

interface Props {
  asset: UGCAsset
}

export default function UGCEditForm({ asset }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(asset.title)
  const [tagsRaw, setTagsRaw] = useState((asset.tags ?? []).join(', '))
  const [notes, setNotes] = useState(asset.notes ?? '')
  const [rightsStatus, setRightsStatus] = useState(asset.rights_status)
  const [thumbnailUrl, setThumbnailUrl] = useState(asset.thumbnail_url ?? '')
  const [externalUrl, setExternalUrl] = useState(asset.external_url ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  function parseTags(raw: string): string[] {
    return raw.split(',').map((t) => t.trim()).filter(Boolean)
  }

  async function handleSave() {
    if (!title.trim()) { setError('Title is required'); return }
    setError('')
    setSaving(true)

    const res = await fetch(`/api/ugc/${asset.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        tags: parseTags(tagsRaw),
        notes: notes || null,
        rights_status: rightsStatus,
        thumbnail_url: thumbnailUrl.trim() || null,
        external_url: externalUrl.trim() || null,
      }),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Failed to save')
      setSaving(false)
      return
    }

    router.refresh()
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this asset? This cannot be undone.')) return
    setDeleting(true)

    const res = await fetch(`/api/ugc/${asset.id}`, { method: 'DELETE' })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Failed to delete')
      setDeleting(false)
      return
    }

    router.push('/ugc')
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Tags</label>
        <input
          type="text"
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
          placeholder="tag1, tag2, tag3"
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Optional notes..."
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-zinc-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Rights status</label>
        <select
          value={rightsStatus}
          onChange={(e) => setRightsStatus(e.target.value as UGCAsset['rights_status'])}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
        >
          {RIGHTS_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Thumbnail URL</label>
        <input
          type="url"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      {asset.asset_type === 'link' && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">External URL</label>
          <input
            type="url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || deleting}
          className="flex-1 py-2.5 rounded-lg bg-foreground/90 text-background text-sm font-medium hover:bg-foreground transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={saving || deleting}
          className="px-4 py-2.5 rounded-lg bg-red-500/15 text-red-400 text-sm font-medium hover:bg-red-500/25 transition-colors disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  )
}
