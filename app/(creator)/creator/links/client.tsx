'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, ExternalLink } from 'lucide-react'

interface CreatorLink {
  id: string
  title: string
  url: string
  click_count: number
  sort_order: number
}

interface Props {
  links: CreatorLink[]
}

export default function LinksClient({ links: initialLinks }: Props) {
  const router = useRouter()
  const [links, setLinks] = useState<CreatorLink[]>(initialLinks)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !url.trim()) return
    setAdding(true)
    setAddError(null)

    try {
      const res = await fetch('/api/creator-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), url: url.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        setAddError(data.error ?? 'Failed to add link')
        return
      }
      const newLink: CreatorLink = await res.json()
      setLinks(prev => [...prev, newLink])
      setTitle('')
      setUrl('')
      titleRef.current?.focus()
      router.refresh()
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/creator-links/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setLinks(prev => prev.filter(l => l.id !== id))
        router.refresh()
      }
    } finally {
      setDeletingId(null)
    }
  }

  function truncateUrl(u: string, max = 40) {
    try {
      const display = u.replace(/^https?:\/\//, '')
      return display.length > max ? display.slice(0, max) + '…' : display
    } catch {
      return u
    }
  }

  return (
    <div className="space-y-4">
      {/* Current links list */}
      {links.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No links yet. Add one below.</p>
      ) : (
        <ul className="space-y-2">
          {links.map(link => (
            <li
              key={link.id}
              className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{link.title}</p>
                <p className="text-xs text-muted-foreground truncate">{truncateUrl(link.url)}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {link.click_count ?? 0} click{link.click_count === 1 ? '' : 's'}
                </span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Open link"
                >
                  <ExternalLink size={14} />
                </a>
                <button
                  onClick={() => handleDelete(link.id)}
                  disabled={deletingId === link.id}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                  aria-label="Delete link"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add link form */}
      <form onSubmit={handleAdd} className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Add link</h3>
        {addError && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-2 py-1">{addError}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Title</label>
            <input
              ref={titleRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="My Website"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">URL</label>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com"
              type="url"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={adding || !title.trim() || !url.trim()}
          className="inline-flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-semibold hover:bg-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={14} />
          {adding ? 'Adding…' : 'Add Link'}
        </button>
      </form>
    </div>
  )
}
