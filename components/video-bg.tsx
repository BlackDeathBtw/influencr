'use client'

import { useEffect, useRef } from 'react'

export function VideoBg() {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (ref.current) ref.current.pause()
      return
    }
    ref.current?.play().catch(() => {})
  }, [])

  return (
    <video
      ref={ref}
      src="/hero-bg.mp4"
      autoPlay
      muted
      loop
      playsInline
      className="absolute inset-0 w-full h-full object-cover opacity-25"
      aria-hidden="true"
    />
  )
}
