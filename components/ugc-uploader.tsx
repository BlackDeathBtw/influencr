'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, Link2 } from 'lucide-react'

interface SelectOption {
  id: string
  name: string
}

interface Props {
  influencers: SelectOption[]
  campaigns: SelectOption[]
}

const PLATFORMS = ['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'other']
const RIGHTS_STATUSES = ['pending', 'approved', 'rejected', 'licensed']

type Tab = 'upload' | 'link'

export default function UGCUploader({ influencers, campaigns }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<Tab>('upload')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState('')
  const [influencerId, setInfluencerId] = useState('')
  const [campaignId, setCampaignId] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')
  const [notes, setNotes] = useState('')
  const [rightsStatus, setRightsStatus] = useState('pending')

  const [externalUrl, setExternalUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')

  function parseTags(raw: string): string[] {
    return raw.split(',').map((t) => t.trim()).filter(Boolean)
  }

  async function uploadFileAndSubmit(file: File) {
    setError('')
    setUploading(true)
    setUploadProgress('Uploading file...')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setUploading(false); return }

    const ext = file.name.split('.').pop() ?? 'bin'
    const uuid = crypto.randomUUID()
    const path = `${user.id}/${uuid}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('ugc-assets')
      .upload(path, file)

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      setUploadProgress('')
      return
    }

    setUploadProgress('Saving metadata...')

    let assetType: string = 'document'
    if (file.type.startsWith('image/')) assetType = 'image'
    else if (file.type.startsWith('video/')) assetType = 'video'

    const res = await fetch('/api/ugc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim() || file.name,
        asset_type: assetType,
        storage_path: path,
        platform: platform || null,
        influencer_id: influencerId || null,
        campaign_id: campaignId || null,
        tags: parseTags(tagsRaw),
        notes: notes || null,
        rights_status: rightsStatus,
      }),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Failed to save asset')
      setUploading(false)
      setUploadProgress('')
      return
    }

    router.push('/ugc')
  }

  async function submitLink() {
    setError('')
    if (!externalUrl.trim()) { setError('URL is required'); return }
    if (!title.trim()) { setError('Title is required'); return }

    setUploading(true)

    const res = await fetch('/api/ugc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        asset_type: 'link',
        external_url: externalUrl.trim(),
        thumbnail_url: thumbnailUrl.trim() || null,
        platform: platform || null,
        influencer_id: influencerId || null,
        campaign_id: campaignId || null,
        tags: parseTags(tagsRaw),
        notes: notes || null,
        rights_status: rightsStatus,
      }),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Failed to save asset')
      setUploading(false)
      return
    }

    router.push('/ugc')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFileAndSubmit(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFileAndSubmit(file)
  }

  const commonFields = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Asset title"
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Platform</label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
        >
          <option value="">Select platform</option>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Influencer</label>
        <select
          value={influencerId}
          onChange={(e) => setInfluencerId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
        >
          <option value="">None</option>
          {influencers.map((inf) => (
            <option key={inf.id} value={inf.id}>{inf.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Campaign</label>
        <select
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
        >
          <option value="">None</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Tags</label>
        <input
          type="text"
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
          placeholder="ugc, summer, product (comma-separated)"
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
          onChange={(e) => setRightsStatus(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
        >
          {RIGHTS_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setTab('upload')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'upload' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Upload file
        </button>
        <button
          type="button"
          onClick={() => setTab('link')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'link' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Add link
        </button>
      </div>

      {tab === 'upload' ? (
        <div className="space-y-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              dragOver ? 'border-zinc-500 bg-zinc-500/5' : 'border-border hover:border-zinc-600 bg-muted/30'
            }`}
          >
            <Upload size={28} className="text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {uploading ? uploadProgress : 'Drop file here or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Images, videos, PDFs supported</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,video/*,.pdf"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>
          {commonFields}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                URL <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Thumbnail URL</label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://... (optional)"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
          </div>

          {commonFields}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="button"
            onClick={submitLink}
            disabled={uploading}
            className="w-full py-2.5 rounded-lg bg-foreground/90 text-background text-sm font-medium hover:bg-foreground transition-colors disabled:opacity-50"
          >
            {uploading ? 'Saving...' : 'Save link'}
          </button>
        </div>
      )}

      {error && tab === 'upload' && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
