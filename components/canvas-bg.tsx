'use client'

import { useEffect, useRef } from 'react'

export function CanvasBg() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio, 2)
    let raf: number
    let cw = 0
    let ch = 0

    function resize() {
      cw = canvas!.offsetWidth
      ch = canvas!.offsetHeight
      canvas!.width = cw * dpr
      canvas!.height = ch * dpr
      ctx!.scale(dpr, dpr)
    }

    resize()

    const N = cw < 768 ? 40 : 65

    type P = { x: number; y: number; vx: number; vy: number; r: number }

    const pts: P[] = Array.from({ length: N }, () => ({
      x: Math.random() * cw,
      y: Math.random() * ch,
      vx: (Math.random() - 0.5) * 0.32,
      vy: (Math.random() - 0.5) * 0.32,
      r: Math.random() * 1.6 + 0.5,
    }))

    const MAX_D = 140
    // Brand saffron: oklch(0.80 0.17 82) ≈ rgb(220,170,60)
    const DOT_COLOR = 'rgba(220,170,60,'
    const LINE_COLOR = 'rgba(220,170,60,'

    function tick() {
      ctx!.clearRect(0, 0, cw, ch)

      for (const p of pts) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > cw) p.vx *= -1
        if (p.y < 0 || p.y > ch) p.vy *= -1

        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fillStyle = DOT_COLOR + '0.55)'
        ctx!.fill()
      }

      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x
          const dy = pts[i].y - pts[j].y
          const d = Math.hypot(dx, dy)
          if (d < MAX_D) {
            ctx!.beginPath()
            ctx!.moveTo(pts[i].x, pts[i].y)
            ctx!.lineTo(pts[j].x, pts[j].y)
            ctx!.strokeStyle = LINE_COLOR + ((1 - d / MAX_D) * 0.13) + ')'
            ctx!.lineWidth = 0.6
            ctx!.stroke()
          }
        }
      }

      raf = requestAnimationFrame(tick)
    }

    tick()

    const obs = new ResizeObserver(resize)
    obs.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      obs.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full opacity-60"
      aria-hidden="true"
    />
  )
}
