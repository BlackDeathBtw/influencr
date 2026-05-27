'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import SignaturePad from 'signature_pad'

interface ContractData {
  content: string
  status: string
  signer_name: string | null
  signer_email: string | null
  signed_at: string | null
  title: string
}

type Step = 'loading' | 'not_found' | 'already_signed' | 1 | 2 | 3 | 'done'

function GreenCheck() {
  return (
    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-green-600"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  )
}

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {([1, 2, 3] as const).map((s) => {
        const active = s === step
        const past = s < step
        return (
          <span
            key={s}
            className={[
              'rounded-full border transition-all duration-300',
              active
                ? 'w-2.5 h-2.5 bg-foreground border-foreground'
                : past
                ? 'w-2 h-2 bg-foreground/50 border-foreground/50'
                : 'w-2 h-2 bg-transparent border-foreground/30',
            ].join(' ')}
          />
        )
      })}
    </div>
  )
}

export default function SignPage() {
  const params = useParams<{ token: string }>()
  const token = params.token

  const [contract, setContract] = useState<ContractData | null>(null)
  const [step, setStep] = useState<Step>('loading')

  // Step 2 fields
  const [signerName, setSignerName] = useState('')
  const [signerEmail, setSignerEmail] = useState('')

  // Step 3
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const signaturePadRef = useRef<SignaturePad | null>(null)
  const [sigError, setSigError] = useState<string | null>(null)
  const [signing, setSigning] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Step 1 scroll detection
  const contractBodyRef = useRef<HTMLDivElement>(null)
  const [hasScrolled, setHasScrolled] = useState(false)

  // Fade transition
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    fetch(`/api/contracts/${token}/view`)
      .then(async (res) => {
        if (res.status === 404) {
          setStep('not_found')
          return
        }
        const data: ContractData = await res.json()
        setContract(data)
        if (data.status === 'signed') {
          setStep('already_signed')
        } else {
          setStep(1)
        }
      })
      .catch(() => setStep('not_found'))
  }, [token])

  // Re-initialize SignaturePad whenever we arrive at step 3
  useEffect(() => {
    if (step !== 3) return
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    canvas.width = canvas.offsetWidth * ratio
    canvas.height = canvas.offsetHeight * ratio
    canvas.getContext('2d')?.scale(ratio, ratio)

    signaturePadRef.current = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)',
      minWidth: 1,
      maxWidth: 3,
    })
    signaturePadRef.current.clear()

    return () => {
      signaturePadRef.current?.off()
    }
  }, [step])

  function handleContractScroll() {
    const el = contractBodyRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setHasScrolled(true)
    }
  }

  function goToStep(next: Step) {
    setVisible(false)
    setTimeout(() => {
      setStep(next)
      setVisible(true)
    }, 180)
  }

  async function handleSubmitSign() {
    setSigError(null)
    setApiError(null)

    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      setSigError('Signature is required')
      return
    }

    const signatureDataUrl = signaturePadRef.current.toDataURL('image/png')
    setSigning(true)

    try {
      const res = await fetch(`/api/contracts/${token}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signer_name: signerName,
          signer_email: signerEmail,
          signature_data_url: signatureDataUrl,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setApiError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      setContract((prev) =>
        prev
          ? {
              ...prev,
              status: 'signed',
              signer_name: signerName,
              signer_email: signerEmail,
              signed_at: new Date().toISOString(),
            }
          : prev
      )
      goToStep('done')
    } catch {
      setApiError('Something went wrong. Please try again.')
    } finally {
      setSigning(false)
    }
  }

  const fadeClass = `transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`

  // ── Loading ──────────────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (step === 'not_found') {
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

  // ── Already signed ───────────────────────────────────────────────────────
  if (step === 'already_signed' && contract) {
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
          <GreenCheck />
          <h1 className="text-lg font-semibold text-foreground mb-1">Already signed</h1>
          {contract.signer_name && (
            <p className="text-muted-foreground text-sm">
              Signed by{' '}
              <span className="font-medium text-foreground">{contract.signer_name}</span>
              {signedDate && <> on {signedDate}</>}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (!contract) return null

  // ── Done ─────────────────────────────────────────────────────────────────
  if (step === 'done') {
    const signedDate = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    return (
      <div className={`min-h-screen bg-background flex items-center justify-center p-6 ${fadeClass}`}>
        <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center">
          <GreenCheck />
          <h1 className="text-xl font-semibold text-foreground mb-2">Contract signed</h1>
          <p className="text-muted-foreground text-sm mb-4">
            Thank you,{' '}
            <span className="font-medium text-foreground">{signerName}</span>.{' '}
            Your signature has been recorded.
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            Signed on {signedDate}
            {signerEmail ? ` · ${signerEmail}` : ''}
          </p>
          <p className="text-xs text-muted-foreground/60">
            This signature is legally binding. A confirmation has been noted.
          </p>
        </div>
      </div>
    )
  }

  // ── Steps 1–3 ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className={`max-w-2xl mx-auto ${fadeClass}`}>
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">
            influencr · e-sign
          </p>
          <h1 className="text-xl font-semibold text-foreground">{contract.title}</h1>
        </div>

        {/* Step indicator */}
        {(step === 1 || step === 2 || step === 3) && (
          <StepIndicator step={step} />
        )}

        {/* ── Step 1: Review contract ── */}
        {step === 1 && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div
              ref={contractBodyRef}
              onScroll={handleContractScroll}
              className="max-h-[55vh] overflow-y-auto rounded-lg"
            >
              <pre className="whitespace-pre-wrap font-mono text-sm text-foreground/80 leading-relaxed">
                {contract.content}
              </pre>
            </div>
            <button
              onClick={() => goToStep(2)}
              disabled={!hasScrolled}
              className="w-full bg-foreground/90 text-background py-2.5 rounded-lg text-sm font-medium hover:bg-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              I have read this contract
            </button>
            {!hasScrolled && (
              <p className="text-xs text-center text-muted-foreground">
                Scroll to the bottom to continue
              </p>
            )}
          </div>
        )}

        {/* ── Step 2: Your information ── */}
        {step === 2 && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <h2 className="text-base font-semibold text-foreground">Your information</h2>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Full name *
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Your full legal name"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Email address *
              </label>
              <input
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                required
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => goToStep(1)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-border hover:border-foreground/30"
              >
                Back
              </button>
              <button
                onClick={() => goToStep(3)}
                disabled={!signerName.trim() || !signerEmail.trim()}
                className="flex-1 bg-foreground/90 text-background py-2.5 rounded-lg text-sm font-medium hover:bg-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Sign ── */}
        {step === 3 && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-foreground mb-1">
                Draw your signature
              </h2>
              <p className="text-sm text-muted-foreground">
                Sign in the box below using your mouse or finger
              </p>
            </div>

            {/* Canvas wrapper — touch-action none prevents mobile scroll while drawing */}
            <div
              style={{ touchAction: 'none' }}
              className="rounded-lg border border-border overflow-hidden"
            >
              <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '150px', display: 'block', cursor: 'crosshair', background: 'white' }}
              />
            </div>

            {sigError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {sigError}
              </p>
            )}

            {apiError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {apiError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => goToStep(2)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-border hover:border-foreground/30"
              >
                Back
              </button>
              <button
                onClick={() => {
                  signaturePadRef.current?.clear()
                  setSigError(null)
                }}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-border hover:border-foreground/30"
              >
                Clear
              </button>
              <button
                onClick={handleSubmitSign}
                disabled={signing}
                className="flex-1 bg-foreground/90 text-background py-2.5 rounded-lg text-sm font-medium hover:bg-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {signing ? 'Signing…' : 'Sign contract'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
