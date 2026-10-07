"use client"

import { useEffect, useLayoutEffect } from "react"
import { useNavigate } from "@/components/transitions"
import { closed, opened } from "@/lib/recent"

// A project page shows everything at once, so it has nothing to scroll. Any
// scroll (wheel, trackpad either way, a swipe, the arrow, page and space
// keys, Escape) steps back out to the Work page, which opens on this project
// (lib/recent.ts). Left and right go to the previous and next project.
//
// Where it fits, the image takes exactly the room the screen leaves between
// the top of the page and the story: larger on a large screen, smaller on a
// small one, never overlapping. On screens where the page can't fit (phones, very short
// windows) it reads downwards as usual and only Escape and the links lead
// out. FITS must match the media query for .project in globals.css.

const FITS = "(min-width: 48rem) and (min-height: 35rem)"
/** Ignore scrolling for this long after arriving. */
const SETTLE_MS = 600
/** A new gesture begins after this long without a wheel event. */
const GESTURE_GAP_MS = 220
/** How much wheel travel counts as meaning it. */
const THRESHOLD = 40
/** Below this height the image is too small to be worth fitting: scroll instead. */
const MIN_IMAGE = 160

const isField = (target: EventTarget | null) =>
  target instanceof HTMLElement && !!target.closest("input, textarea, select, [contenteditable]")

export function BackOut({ slug, prev, next }: { slug: string; prev: string; next: string }) {
  const navigate = useNavigate()

  useEffect(() => {
    opened(slug)
    return () => closed(slug)
  }, [slug])

  // Fitted before the first paint, so a page transition carries the image to
  // its final size. Measured by layout position, which an entrance
  // animation's offset doesn't move.
  useLayoutEffect(() => {
    const page = document.querySelector<HTMLElement>(".project")
    if (!page) return
    const query = window.matchMedia(FITS)
    const fit = () => {
      page.style.removeProperty("--project-h")
      page.toggleAttribute("data-overflow", false)
      if (!query.matches) return
      const image = page.querySelector<HTMLElement>(".project-image")
      const story = page.querySelector<HTMLElement>(".project-story")
      const foot = page.querySelector<HTMLElement>(".project-foot")
      if (!story || !foot) return
      // The image's row gives way to the rest (the image can be clipped), so
      // the room for it is what's left between its top and the story's.
      const room = image ? story.offsetTop - parseFloat(getComputedStyle(story).marginTop) - image.offsetTop : Infinity
      const bottom = foot.offsetTop + foot.offsetHeight
      // It doesn't fit after all: let it scroll like any other page.
      if (bottom > page.offsetTop + page.clientHeight || room < MIN_IMAGE) {
        page.toggleAttribute("data-overflow", true)
        return
      }
      // As far as its columns allow.
      if (image) page.style.setProperty("--project-h", `${Math.floor(room)}px`)
    }
    fit()
    let live = true
    // Text set in a late-arriving font can change the story's height.
    document.fonts?.ready.then(() => live && fit())
    window.addEventListener("resize", fit)
    query.addEventListener("change", fit)
    return () => {
      live = false
      window.removeEventListener("resize", fit)
      query.removeEventListener("change", fit)
    }
  }, [])

  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".project")
    if (!page) return
    const query = window.matchMedia(FITS)
    const fits = () => query.matches && !page.hasAttribute("data-overflow")

    let gone = false
    const leave = (href = "/work/", back = true) => {
      if (gone) return
      gone = true
      navigate(href, { back })
    }

    // Trackpad momentum from the scroll that brought you here keeps sending
    // wheel events for a moment: only a fresh gesture, begun after arriving,
    // counts.
    const ready = performance.now() + SETTLE_MS
    let lastWheel = 0
    let fresh = false
    let travel = 0
    const onWheel = (event: WheelEvent) => {
      if (gone || !fits()) return
      const now = performance.now()
      if (now - lastWheel > GESTURE_GAP_MS) {
        fresh = now > ready
        travel = 0
      }
      lastWheel = now
      if (!fresh) return
      travel += Math.abs(event.deltaY) + Math.abs(event.deltaX)
      if (travel > THRESHOLD) leave()
    }

    let touchY: number | null = null
    let touchX: number | null = null
    const onTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? null
      touchX = event.touches[0]?.clientX ?? null
    }
    const onTouchMove = (event: TouchEvent) => {
      if (gone || !fits() || touchY === null || touchX === null) return
      const touch = event.touches[0]
      if (touch && Math.hypot(touch.clientY - touchY, touch.clientX - touchX) > 48) leave()
    }

    const onKey = (event: KeyboardEvent) => {
      if (gone || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || isField(event.target)) return
      if (event.key === "Escape") return leave()
      if (event.key === "ArrowRight") return leave(`/work/${next}/`, false)
      if (event.key === "ArrowLeft") return leave(`/work/${prev}/`, false)
      if (fits() && ["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"].includes(event.key)) {
        event.preventDefault()
        leave()
      }
    }

    window.addEventListener("wheel", onWheel, { passive: true })
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: true })
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("keydown", onKey)
    }
  }, [navigate, next, prev])

  return null
}
