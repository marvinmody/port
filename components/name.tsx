"use client"

import { useEffect, useRef, type CSSProperties } from "react"
import { onTick } from "@/lib/ticker"

/** How far, in px, the deepest letter drifts at the pointer's furthest reach. */
const DRIFT = { x: 9, y: 6 }

// The name, letter by letter. It resolves from the middle out, and then each
// letter hangs at a depth of its own: as the pointer moves, they drift against
// it by different amounts, as stars at different distances would.
export function Name({ text }: { text: string }) {
  const heading = useRef<HTMLHeadingElement>(null)
  const letters = [...text]
  const middle = (letters.length - 1) / 2

  useEffect(() => {
    const el = heading.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (!window.matchMedia("(pointer: fine)").matches) return
    const spans = [...el.querySelectorAll<HTMLElement>(".letter")]
    // A fixed scatter of depths, nearer and further, never all in step.
    const depths = spans.map((_, i) => 0.3 + 0.7 * Math.abs(Math.sin(i * 1.93 + 0.4)))

    let targetX = 0
    let targetY = 0
    let x = 0
    let y = 0
    let last = 0
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return
      targetX = (event.clientX / window.innerWidth) * 2 - 1
      targetY = (event.clientY / window.innerHeight) * 2 - 1
    }
    const onLeave = () => {
      targetX = 0
      targetY = 0
    }

    const stop = onTick((now) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60
      last = now
      const k = 1 - Math.exp(-dt * 2.6)
      const nx = x + (targetX - x) * k
      const ny = y + (targetY - y) * k
      if (Math.abs(nx - x) + Math.abs(ny - y) < 0.0004) return
      x = nx
      y = ny
      spans.forEach((span, i) => {
        span.style.translate = `${(-x * depths[i] * DRIFT.x).toFixed(2)}px ${(-y * depths[i] * DRIFT.y).toFixed(2)}px`
      })
    }, 2)

    window.addEventListener("pointermove", onMove, { passive: true })
    document.documentElement.addEventListener("pointerleave", onLeave)
    return () => {
      stop()
      window.removeEventListener("pointermove", onMove)
      document.documentElement.removeEventListener("pointerleave", onLeave)
      for (const span of spans) span.style.translate = ""
    }
  }, [])

  return (
    <h1 ref={heading} className="name">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {letters.map((letter, i) => (
          <span key={i} className="letter" style={{ "--d": Math.abs(i - middle) } as CSSProperties}>
            {letter === " " ? " " : letter}
          </span>
        ))}
      </span>
    </h1>
  )
}
