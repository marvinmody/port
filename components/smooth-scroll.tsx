"use client"

import Lenis from "lenis"
import { useEffect } from "react"
import { setLenis } from "@/lib/scroll"
import { onTick } from "@/lib/ticker"

// Smooths wheel scrolling on the window. Sideways trackpad swipes count too,
// so they carry a rail (components/rail.tsx) the way your hand expects. Touch
// keeps the native feel, and Lenis steps aside on its own for people who
// prefer reduced motion. It runs first on the shared ticker, so everything
// after it sees this frame's scroll.
export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      // A touch longer glide than the default 0.1: softer, still direct.
      lerp: 0.085,
      autoRaf: false,
      gestureOrientation: "both",
      stopInertiaOnNavigate: true,
    })
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
