'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Paperclip, Trash2, ExternalLink, Upload } from 'lucide-react'

interface Props {
  influencerId: string
  userId: string
  currentUrl: string | null
  onSaved: (url: string | null) => void
}

export default function FileUpload({ influencerId, userId, currentUrl, onSaved }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')

    const supabase = createClient()
    const path = `${userId}/${influencerId}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`

    const { error: uploadError } = await supabase.storage.from('briefs').upload(path, file, { upsert: true })
    if (uploadError) { setError(uploadError.message); setUploading(false); return }

    const { data } = supabase.storage.from('briefs').getPublicUrl(path)

    await fetch(`/api/influencers/${influencerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief_url: data.publicUrl }),
    })

    onSaved(data.publicUrl)
    setUploading(false)
    e.target.value = ''
  }

  async function handleRemove() {
    if (!confirm('Remove this file?')) return
    await fetch(`/api/influencers/${influencerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief_url: null }),
    })
    onSaved(null)
  }

  return (
    <div className="space-y-2">
      {currentUrl ? (
        <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
          <div className="flex items-center gap-2 min-w-0">
            <Paperclip size={14} className="text-muted-foreground/70 shrink-0" />
            <span className="text-sm text-foreground/80 truncate">Brief attached</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground/70 hover:text-foreground/80">
              <ExternalLink size={14} />
            </a>
            <button onClick={handleRemove} className="text-muted-foreground/90 hover:text-red-500 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ) : (
        <label className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-border rounded-lg cursor-pointer hover:border-zinc-400 hover:bg-background transition-colors">
          <Upload size={14} className="text-muted-foreground/70" />
          <span className="text-sm text-muted-foreground">{uploading ? 'Uploading…' : 'Attach brief (PDF / image, max 10MB)'}</span>
          <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleUpload} disabled={uploading} />
        </label>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
