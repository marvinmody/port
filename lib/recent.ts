// The project you last looked at, so the Work page opens on it, and whether
// its page is still on screen. If it is while the Work page renders, you're
// coming back from it, and its image carries back into the row.

let last: string | null = null
let open: string | null = null

/** A project page has opened. */
export function opened(slug: string) {
  last = slug
  open = slug
}

/** A project page has closed. */
export function closed(slug: string) {
  if (open === slug) open = null
}

/** The Work row has come to rest on a project. */
export function viewed(slug: string) {
  last = slug
}

let flight = Number.NEGATIVE_INFINITY

/** The home page has just carried you through the name to the work. */
export function flew() {
  flight = performance.now()
}

/** Arriving on the Work page straight from that flight. */
export const justFlew = () => performance.now() - flight < 1500

export const lastProject = () => last
export const openProject = () => open
