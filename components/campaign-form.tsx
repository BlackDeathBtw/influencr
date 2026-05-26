'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Campaign } from '@/types'

interface Props {
  campaign?: Campaign
}

const STATUSES = ['planning', 'active', 'paused', 'completed']

export default function CampaignForm({ campaign }: Props) {
  const router = useRouter()
  const isNew = !campaign

  const [form, setForm] = useState({
    name: campaign?.name ?? '',
    description: campaign?.description ?? '',
    start_date: campaign?.start_date ?? '',
    end_date: campaign?.end_date ?? '',
    budget: campaign?.budget?.toString() ?? '',
    currency: campaign?.currency ?? 'USD',
    status: campaign?.status ?? 'planning',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const body = {
      ...form,
      budget: form.budget ? parseFloat(form.budget) : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      description: form.description || null,
    }

    const url = isNew ? '/api/campaigns' : `/api/campaigns/${campaign!.id}`
    const method = isNew ? 'POST' : 'PATCH'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const { error } = await res.json()
      setError(error ?? 'Something went wrong')
      setLoading(false)
      return
    }

    if (isNew) {
      const data = await res.json()
      router.push(`/campaigns/${data.id}`)
    } else {
      router.refresh()
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this campaign? This cannot be undone.')) return
    setLoading(true)
    await fetch(`/api/campaigns/${campaign!.id}`, { method: 'DELETE' })
    router.push('/campaigns')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Campaign name *</label>
        <input
          value={form.name}
          onChange={e => set('name', e.target.value)}
          required
          placeholder="Summer 2025 campaign"
          className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Description</label>
        <textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={2}
          placeholder="What is this campaign about?"
          className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Start date</label>
          <input
            type="date"
            value={form.start_date}
            onChange={e => set('start_date', e.target.value)}
            className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">End date</label>
          <input
            type="date"
            value={form.end_date}
            onChange={e => set('end_date', e.target.value)}
            className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Budget</label>
          <div className="flex">
            <select
              value={form.currency}
              onChange={e => set('currency', e.target.value)}
              className="px-3 py-2.5 border border-r-0 border-zinc-200 rounded-l-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              {['USD', 'EUR', 'GBP', 'CAD', 'AUD'].map(c => <option key={c}>{c}</option>)}
            </select>
            <input
              type="number"
              value={form.budget}
              onChange={e => set('budget', e.target.value)}
              placeholder="5000"
              min="0"
              step="0.01"
              className="flex-1 px-3 py-2.5 border border-zinc-200 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Status</label>
          <select
            value={form.status}
            onChange={e => set('status', e.target.value)}
            className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-zinc-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving…' : isNew ? 'Create campaign' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-zinc-200 text-zinc-600 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
        </div>
        {!isNew && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Delete campaign
          </button>
        )}
      </div>
    </form>
  )
}
