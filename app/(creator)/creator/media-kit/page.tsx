'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Plus, Trash2, ExternalLink, Download } from 'lucide-react'
import type { CreatorProfile, CreatorPlatformStat } from '@/types'

const PLATFORMS = ['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'other']

const schema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores'),
  displayName: z.string().max(80).optional(),
  location: z.string().max(100).optional(),
  rateMin: z.string().optional(),
  rateMax: z.string().optional(),
  isPublic: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

interface PlatformRow {
  id: string
  platform: string
  handle: string
  followers: string
  engagement_rate: string
}

function newPlatformRow(): PlatformRow {
  return { id: crypto.randomUUID(), platform: 'instagram', handle: '', followers: '', engagement_rate: '' }
}

export default function MediaKitPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [platformRows, setPlatformRows] = useState<PlatformRow[]>([])
  const [profileId, setProfileId] = useState<string | null>(null)
  const [currentUsername, setCurrentUsername] = useState<string>('')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const watchedUsername = watch('username', '')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Tell brands about you…' }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class:
          'min-h-[120px] px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 prose prose-sm max-w-none',
      },
    },
  })

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/creator-profiles')
      if (!res.ok) return
      const profile: (CreatorProfile & { platform_stats?: CreatorPlatformStat[] }) | null = await res.json()
      if (!profile) return

      setProfileId(profile.id)
      setCurrentUsername(profile.username ?? '')

      reset({
        username: profile.username ?? '',
        displayName: profile.display_name ?? '',
        location: profile.location ?? '',
        rateMin: profile.rate_min != null ? String(profile.rate_min) : '',
        rateMax: profile.rate_max != null ? String(profile.rate_max) : '',
        isPublic: profile.is_public ?? false,
      })

      if (editor && profile.bio) {
        editor.commands.setContent(profile.bio)
      }

      const rows = (profile.platform_stats ?? []).map((s) => ({
        id: s.id,
        platform: s.platform,
        handle: s.handle ?? '',
        followers: s.followers != null ? String(s.followers) : '',
        engagement_rate: s.engagement_rate != null ? String(s.engagement_rate) : '',
      }))
      setPlatformRows(rows)
    } finally {
      setLoading(false)
    }
  }, [reset, editor])

  useEffect(() => {
    if (editor !== null) {
      loadProfile()
    }
  }, [editor, loadProfile])

  async function onSubmit(values: FormData) {
    setSaving(true)
    setSaved(false)
    setSaveError(null)

    const bioText = editor ? editor.getText() : ''

    const stats = platformRows
      .filter(r => r.platform)
      .map(r => ({
        platform: r.platform,
        handle: r.handle || null,
        followers: r.followers ? parseInt(r.followers, 10) : null,
        engagement_rate: r.engagement_rate ? parseFloat(r.engagement_rate) : null,
      }))

    const res = await fetch('/api/creator-profiles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: values.username,
        display_name: values.displayName || null,
        bio: bioText || null,
        location: values.location || null,
        rate_min: values.rateMin ? parseInt(values.rateMin, 10) : null,
        rate_max: values.rateMax ? parseInt(values.rateMax, 10) : null,
        is_public: values.isPublic ?? false,
        platform_stats: stats,
      }),
    })

    setSaving(false)

    if (!res.ok) {
      const data = await res.json()
      setSaveError(data.error ?? 'Failed to save')
      return
    }

    const updated = await res.json()
    if (updated?.username) setCurrentUsername(updated.username)
    if (updated?.id) setProfileId(updated.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function addPlatformRow() {
    setPlatformRows(rows => [...rows, newPlatformRow()])
  }

  function removePlatformRow(id: string) {
    setPlatformRows(rows => rows.filter(r => r.id !== id))
  }

  function updatePlatformRow(id: string, field: keyof Omit<PlatformRow, 'id'>, value: string) {
    setPlatformRows(rows => rows.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-40 bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Media Kit</h1>
          <p className="text-sm text-muted-foreground mt-1">Edit your public creator profile</p>
        </div>
        <div className="flex items-center gap-3">
          {currentUsername && (
            <a
              href={`/c/${currentUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink size={14} />
              View public page
            </a>
          )}
          {currentUsername && (
            <div className="flex flex-col items-end gap-0.5">
              <a
                href={`/c/${currentUsername}/print`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground bg-card border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <Download size={14} />
                Export PDF
              </a>
              <p className="text-[10px] text-muted-foreground">
                Opens print view — use Cmd+P / Ctrl+P to save as PDF
              </p>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {saveError && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {saveError}
          </p>
        )}

        {/* Basic info */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-foreground">Basic info</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-border bg-muted text-muted-foreground text-sm">
                  @
                </span>
                <input
                  {...register('username')}
                  className="flex-1 px-3 py-2 rounded-r-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>
              )}
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-foreground mb-1.5">Display name</label>
              <input
                {...register('displayName')}
                placeholder="Your Name"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Bio</label>
            <EditorContent editor={editor} />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
            <input
              {...register('location')}
              placeholder="City, Country"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>
        </div>

        {/* Rates */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-foreground">Rates</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Min rate ($/post)</label>
              <div className="flex items-center">
                <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-border bg-muted text-muted-foreground text-sm">$</span>
                <input
                  {...register('rateMin')}
                  type="number"
                  min="0"
                  placeholder="500"
                  className="flex-1 px-3 py-2 rounded-r-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Max rate ($/post)</label>
              <div className="flex items-center">
                <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-border bg-muted text-muted-foreground text-sm">$</span>
                <input
                  {...register('rateMax')}
                  type="number"
                  min="0"
                  placeholder="2000"
                  className="flex-1 px-3 py-2 rounded-r-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Platform stats */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Platform stats</h2>
            <button
              type="button"
              onClick={addPlatformRow}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus size={13} />
              Add platform
            </button>
          </div>

          {platformRows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No platforms added yet</p>
          ) : (
            <div className="space-y-3">
              {platformRows.map(row => (
                <div key={row.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3">
                    <select
                      value={row.platform}
                      onChange={e => updatePlatformRow(row.id, 'platform', e.target.value)}
                      className="w-full px-2 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 capitalize"
                    >
                      {PLATFORMS.map(p => (
                        <option key={p} value={p} className="capitalize">{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      value={row.handle}
                      onChange={e => updatePlatformRow(row.id, 'handle', e.target.value)}
                      placeholder="@handle"
                      className="w-full px-2 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      value={row.followers}
                      onChange={e => updatePlatformRow(row.id, 'followers', e.target.value)}
                      type="number"
                      min="0"
                      placeholder="Followers"
                      className="w-full px-2 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      value={row.engagement_rate}
                      onChange={e => updatePlatformRow(row.id, 'engagement_rate', e.target.value)}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="ER%"
                      className="w-full px-2 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removePlatformRow(row.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Visibility + save */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Public profile</p>
              <p className="text-xs text-muted-foreground mt-0.5">Allow brands to discover your profile at /c/{watchedUsername || 'yourhandle'}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('isPublic')}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-muted peer-focus:ring-2 peer-focus:ring-brand/40 rounded-full peer peer-checked:after:translate-x-5 peer-checked:bg-brand after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-foreground/90 text-background px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium">Saved!</span>
          )}
        </div>
      </form>
    </div>
  )
}
