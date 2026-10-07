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

export const lastProject = () => last
export const openProject = () => open
