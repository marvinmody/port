import type Lenis from "lenis"

// The one Lenis instance, set by <SmoothScroll>. Null until it mounts.
let lenis: Lenis | null = null

export const setLenis = (instance: Lenis | null) => {
  lenis = instance
}

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

export function scrollToTop(immediate = false) {
  if (lenis) {
    lenis.scrollTo(0, { immediate: immediate || prefersReducedMotion(), force: true })
    return
  }
  window.scrollTo({ top: 0, behavior: immediate || prefersReducedMotion() ? "instant" : "smooth" })
}
