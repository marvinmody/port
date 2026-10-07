"use client"

import { useLayoutEffect, useRef, type ReactNode } from "react"
import { scrollToY } from "@/lib/scroll"
import { onTick } from "@/lib/ticker"

// A page's sections side by side. Scrolling down (wheel, trackpad, keys, the
// scrollbar) carries the row sideways: the rail pins to the screen while the
// page scrolls past it, and its track slides left by exactly the distance
// scrolled. Native scrolling stays in charge, so Lenis, the keyboard and
// screen readers all keep working.
//
// As the row moves, each section eases back the further it is from the
// reading line. The arrow keys step from section to section, landing each on
// the page's first column, so the row comes to rest on the header's grid
// (sections are whole columns wide: components/panel.tsx). Tabbing into a
// section brings it on screen.
//
// Only on screens wide and tall enough, and only when motion is welcome:
// elsewhere the sections simply stack. HORIZONTAL must match the media query
// for .rail in globals.css.

const HORIZONTAL = "(min-width: 48rem) and (min-height: 35rem) and (prefers-reduced-motion: no-preference)"
/** Where, across the screen, the section you're reading sits. */
const READING_LINE = 0.4

type Section = {
  el: HTMLElement
  left: number
  width: number
  opacity: string
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

export function Rail({ children }: { children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null)
  const view = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)

  // A layout effect: the rail is measured and placed before the first paint.
  useLayoutEffect(() => {
    const rail = outer.current
    const frame = view.current
    const row = track.current
    if (!rail || !frame || !row) return
    const query = window.matchMedia(HORIZONTAL)
    const root = document.documentElement

    let on = false
    let distance = 0
    let top = 0
    let width = 0
    /** Where the first column starts: the track's left padding. */
    let start = 0
    let x = Number.NaN
    let sections: Section[] = []

    const update = () => {
      if (!on) return
      const nx = -clamp(window.scrollY - top, 0, distance)
      if (nx === x) return
      x = nx
      row.style.transform = `translate3d(${x}px, 0, 0)`
      const line = width * READING_LINE
      for (const section of sections) {
        const center = section.left + x + section.width / 2
        // The section on the reading line leads; the rest ease back.
        const away = Math.abs(center - line) / width
        const opacity = (1 - 0.55 * smoothstep(0.3, 0.9, away)).toFixed(3)
        if (opacity !== section.opacity) {
          section.el.style.opacity = opacity
          section.opacity = opacity
        }
      }
    }

    const reset = () => {
      rail.style.height = ""
      row.style.transform = ""
      for (const section of sections) section.el.style.opacity = ""
      sections = []
      distance = 0
      x = Number.NaN
    }

    const measure = () => {
      on = query.matches
      rail.toggleAttribute("data-horizontal", on)
      if (on) root.dataset.flow = "horizontal"
      else delete root.dataset.flow
      if (!on) return reset()
      width = frame.clientWidth
      start = parseFloat(getComputedStyle(row).paddingLeft) || 0
      distance = Math.max(0, row.scrollWidth - width)
      rail.style.height = `${frame.clientHeight + distance}px`
      top = rail.getBoundingClientRect().top + window.scrollY
      sections = [...row.children].flatMap((el) =>
        el instanceof HTMLElement ? [{ el, left: el.offsetLeft, width: el.offsetWidth, opacity: "" }] : [],
      )
      x = Number.NaN
      update()
    }

    // The section's left edge to the first column (or as near as the row's ends allow).
    const goTo = (section: Section) => {
      scrollToY(top + clamp(section.left - start, 0, distance))
    }

    // Left and right step between sections.
    const onKey = (event: KeyboardEvent) => {
      if (!on || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return
      if ((event.target as HTMLElement | null)?.closest("input, textarea, select, [contenteditable]")) return
      event.preventDefault()
      // From the section nearest the first column, one either way.
      const offset = (s: Section) => Math.abs(s.left + x - start)
      let nearest = 0
      sections.forEach((s, i) => {
        if (offset(s) < offset(sections[nearest])) nearest = i
      })
      const next = sections[clamp(nearest + (event.key === "ArrowRight" ? 1 : -1), 0, sections.length - 1)]
      if (next) goTo(next)
    }

    // Tabbing into a section that's off screen brings it on.
    const onFocus = (event: FocusEvent) => {
      if (!on) return
      const section = sections.find((s) => s.el.contains(event.target as Node))
      if (!section) return
      const left = section.left + x
      if (left < 0 || left + section.width > width) goTo(section)
    }

    const observer = new ResizeObserver(measure)
    observer.observe(row)
    query.addEventListener("change", measure)
    window.addEventListener("resize", measure)
    window.addEventListener("keydown", onKey)
    row.addEventListener("focusin", onFocus)
    measure()
    // After Lenis on the shared ticker: the row moves in the same frame as the page.
    const stop = onTick(update, 1)

    return () => {
      stop()
      observer.disconnect()
      query.removeEventListener("change", measure)
      window.removeEventListener("resize", measure)
      window.removeEventListener("keydown", onKey)
      row.removeEventListener("focusin", onFocus)
      reset()
      delete root.dataset.flow
    }
  }, [])

  return (
    <div ref={outer} className="rail">
      <div ref={view} className="rail-view">
        <div ref={track} className="rail-track">
          {children}
        </div>
      </div>
    </div>
  )
}
