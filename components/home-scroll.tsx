"use client"

import { useEffect } from "react"
import { useNavigate } from "@/components/transitions"
import { bus, FLY } from "@/lib/bus"
import { flew } from "@/lib/recent"
import { prefersReducedMotion, scrollToTop } from "@/lib/scroll"
import { onTick } from "@/lib/ticker"

/** This far down, a scroll means it: the rest of the way plays by itself. */
const COMMIT = 0.25
/** Below this, a fresh scroll down counts (not a position restored on arrival). */
const ARM = 0.2
/** How long the rest of the way takes, however fast you scrolled. */
const FINISH_MS = 850

const clamp = (v: number) => Math.min(1, Math.max(0, v))
/** Leaves at the pace you scrolled in, settles at the end. */
const easeOut = (t: number) => 1 - (1 - t) * (1 - t)

// The home page is one screen held in place while you scroll. Scrolling
// carries you towards the name: it grows, its letters thin out from the ends
// inwards as you pass through them, and the facts along the bottom fall
// away. Past a short way in, the rest plays out at its own even pace while
// the stars push forward. Only once the name has gone entirely does the Work
// page take over, with no cross-fade (there's nothing left to fade, and a
// still of the old sky would ghost the moving one), and its row arrives from
// ahead (components/work-carousel.tsx). One movement, start to finish.
// Progress goes to CSS as --p (0 to 1) on .home.
export function HomeScroll() {
  const navigate = useNavigate()

  useEffect(() => {
    const home = document.querySelector<HTMLElement>(".home")
    if (!home) return

    // Arriving here partway down (the browser's back button restores where
    // the page was), start again at the name.
    if (window.scrollY > 0) scrollToTop(true)

    let p = -1
    let armed = false
    let from = 0
    let start = 0
    let gone = false
    const duration = prefersReducedMotion() ? 200 : FINISH_MS

    const set = (next: number) => {
      if (next === p) return
      p = next
      home.style.setProperty("--p", p.toFixed(4))
    }

    const stop = onTick((now) => {
      if (gone) return
      if (start) {
        const t = clamp((now - start) / duration)
        set(from + (1 - from) * easeOut(t))
        if (t === 1) {
          gone = true
          flew()
          navigate("/work/", { cut: true })
        }
        return
      }
      const room = home.offsetHeight - window.innerHeight
      const scrolled = room > 0 ? clamp(window.scrollY / room) : 0
      set(scrolled)
      if (scrolled < ARM) armed = true
      if (armed && scrolled >= COMMIT) {
        from = scrolled
        start = now
        bus?.dispatchEvent(new Event(FLY))
      }
    }, 1)

    return () => {
      stop()
      home.style.removeProperty("--p")
    }
  }, [navigate])

  return null
}
