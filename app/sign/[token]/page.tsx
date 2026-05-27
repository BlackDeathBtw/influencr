'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface ContractData {
  content: string
  status: string
  signer_name: string | null
  signed_at: string | null
  title: string
}

export default function SignPage() {
  const params = useParams<{ token: string }>()
  const token = params.token

  const [contract, setContract] = useState<ContractData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [signerName, setSignerName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/contracts/${token}/view`)
      .then(async res => {
        if (res.status === 404) {
          setNotFound(true)
          return
        }
        const data = await res.json()
        setContract(data)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [token])

  async function handleSign() {
    if (!agreed || !signerName.trim()) return
    setSigning(true)
    setError(null)

    try {
      const res = await fetch(`/api/contracts/${token}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signer_name: signerName }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      setSigned(true)
      setContract(prev =>
        prev
          ? { ...prev, status: 'signed', signer_name: signerName, signed_at: new Date().toISOString() }
          : prev
      )
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSigning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <p className="text-foreground font-medium mb-2">Contract not found.</p>
          <p className="text-muted-foreground text-sm">
            This link may be invalid or expired.
          </p>
        </div>
      </div>
    )
  }

  if (!contract) return null

  const alreadySigned = contract.status === 'signed' && !signed

  if (alreadySigned) {
    const signedDate = contract.signed_at
      ? new Date(contract.signed_at).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : null

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-1">Already signed</h1>
          {contract.signer_name && (
            <p className="text-muted-foreground text-sm">
              Signed by <span className="font-medium text-foreground">{contract.signer_name}</span>
              {signedDate && <> on {signedDate}</>}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-1">Contract signed</h1>
          <p className="text-muted-foreground text-sm">
            Thank you, <span className="font-medium text-foreground">{signerName}</span>. Your signature has been recorded.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">influencr · e-sign</p>
          <h1 className="text-xl font-semibold text-foreground">{contract.title}</h1>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <pre className="text-sm text-foreground/80 whitespace-pre-wrap font-mono leading-relaxed overflow-y-auto max-h-[60vh]">
            {contract.content}
          </pre>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Full name *
            </label>
            <input
              type="text"
              value={signerName}
              onChange={e => setSignerName(e.target.value)}
              placeholder="Your full legal name"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
              required
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border cursor-pointer"
            />
            <span className="text-sm text-muted-foreground leading-snug">
              I have read and agree to the terms above. I understand this is a legally binding agreement.
            </span>
          </label>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            onClick={handleSign}
            disabled={!agreed || !signerName.trim() || signing}
            className="w-full bg-foreground/90 text-background py-2.5 rounded-lg text-sm font-medium hover:bg-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {signing ? 'Signing…' : 'Sign contract'}
          </button>
        </div>
      </div>
    </div>
  )
}
