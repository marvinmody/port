import type Lenis from "lenis"

// The one Lenis instance, set by <SmoothScroll>. Null until it mounts.
let lenis: Lenis | null = null

export const setLenis = (instance: Lenis | null) => {
  lenis = instance
}

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** Scrolls the page to `y`: a Lenis glide, or a jump when `immediate`. */
export function scrollToY(y: number, immediate = false) {
  const jump = immediate || prefersReducedMotion()
  if (lenis) {
    // Just after a page change Lenis may still hold the last page's height
    // and clamp to it; measure first.
    lenis.resize()
    lenis.scrollTo(y, { immediate: jump, force: true })
    return
  }
  window.scrollTo({ top: y, behavior: jump ? "instant" : "smooth" })
}

export const scrollToTop = (immediate = false) => scrollToY(0, immediate)
