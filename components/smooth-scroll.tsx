"use client"

import Lenis from "lenis"
import { useEffect } from "react"
import { setLenis } from "@/lib/scroll"
import { onTick } from "@/lib/ticker"

// Smooths wheel scrolling on the window. Touch keeps the native feel, and
// Lenis steps aside on its own for people who prefer reduced motion. It runs
// first on the shared ticker, so everything after it sees this frame's scroll.
export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1, autoRaf: false, stopInertiaOnNavigate: true })
    setLenis(lenis)
    const stop = onTick((time) => lenis.raf(time), 0)
    return () => {
      stop()
      setLenis(null)
      lenis.destroy()
    }
  }, [])

  return null
}
