'use client'

import { useState, useCallback } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/pay/${token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [token])

  return (
    <div className="relative inline-flex">
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        title="Copy payment link"
      >
        {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
      </button>
      {copied && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-0.5 rounded whitespace-nowrap">
          Copied!
        </span>
      )}
    </div>
  )
}
