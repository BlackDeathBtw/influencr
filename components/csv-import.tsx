'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'

interface Row {
  name: string
  handle?: string
  platform?: string
  niche?: string
  followers?: string
  engagement_rate?: string
  contact_email?: string
  contact_name?: string
  notes?: string
  status?: string
}

function parseCSV(text: string): Row[] {
  const lines = text.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, ''))
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { if (vals[i]) row[h] = vals[i] })
    return row as unknown as Row
  }).filter(r => r.name)
}

export default function CsvImport() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<Row[]>([])
  const [status, setStatus] = useState<'idle' | 'preview' | 'importing' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const parsed = parseCSV(ev.target?.result as string)
      if (parsed.length === 0) { setErrorMsg('No valid rows found. Make sure the CSV has a "name" column.'); setStatus('error'); return }
      setRows(parsed)
      setStatus('preview')
      setErrorMsg('')
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    setStatus('importing')
    setProgress(0)
    let success = 0
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      await fetch('/api/influencers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: r.name,
          handle: r.handle || null,
          platform: r.platform?.toLowerCase() || null,
          niche: r.niche || null,
          followers: r.followers ? parseInt(r.followers.replace(/[^0-9]/g, '')) : null,
          engagement_rate: r.engagement_rate ? parseFloat(r.engagement_rate) : null,
          contact_email: r.contact_email || null,
          contact_name: r.contact_name || null,
          notes: r.notes || null,
          status: r.status || 'prospect',
        }),
      })
      success++
      setProgress(Math.round((success / rows.length) * 100))
    }
    setStatus('done')
    router.refresh()
  }

  function reset() {
    setOpen(false)
    setRows([])
    setStatus('idle')
    setProgress(0)
    setErrorMsg('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-zinc-200 text-zinc-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors"
      >
        <Upload size={14} /> Import CSV
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <h2 className="font-semibold text-zinc-900">Import influencers from CSV</h2>
              <button onClick={reset} className="text-zinc-400 hover:text-zinc-700"><X size={18} /></button>
            </div>

            <div className="p-6 space-y-4">
              {status === 'idle' && (
                <>
                  <p className="text-sm text-zinc-500">
                    Upload a CSV file. Required column: <code className="bg-zinc-100 px-1 rounded">name</code>.
                    Optional: handle, platform, niche, followers, engagement_rate, contact_email, contact_name, notes, status.
                  </p>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-200 rounded-xl cursor-pointer hover:border-zinc-400 hover:bg-zinc-50 transition-colors">
                    <Upload size={20} className="text-zinc-400 mb-2" />
                    <span className="text-sm text-zinc-500">Click to choose a CSV file</span>
                    <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
                  </label>
                </>
              )}

              {status === 'error' && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}

              {status === 'preview' && (
                <>
                  <p className="text-sm text-zinc-600">Found <strong>{rows.length} rows</strong> to import.</p>
                  <div className="max-h-48 overflow-y-auto border border-zinc-200 rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-zinc-50 sticky top-0">
                        <tr>
                          {['Name', 'Platform', 'Niche', 'Followers'].map(h => (
                            <th key={h} className="text-left px-3 py-2 font-medium text-zinc-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={i} className="border-t border-zinc-100">
                            <td className="px-3 py-2 text-zinc-800">{r.name}</td>
                            <td className="px-3 py-2 text-zinc-500">{r.platform ?? '—'}</td>
                            <td className="px-3 py-2 text-zinc-500">{r.niche ?? '—'}</td>
                            <td className="px-3 py-2 text-zinc-500">{r.followers ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    onClick={handleImport}
                    className="w-full bg-zinc-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
                  >
                    Import {rows.length} influencers
                  </button>
                </>
              )}

              {status === 'importing' && (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-600">Importing… {progress}%</p>
                  <div className="w-full bg-zinc-100 rounded-full h-2">
                    <div className="bg-zinc-900 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {status === 'done' && (
                <div className="flex flex-col items-center py-4 gap-3">
                  <CheckCircle size={32} className="text-green-500" />
                  <p className="text-sm font-medium text-zinc-800">Imported {rows.length} influencers</p>
                  <button onClick={reset} className="bg-zinc-900 text-white px-6 py-2 rounded-lg text-sm font-medium">Done</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
