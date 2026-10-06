// Site-wide signals between components that don't share a parent: the
// transition router tells the starfield a page change has begun, so the stars
// move as you click rather than once the new page arrives.
export const bus = typeof window === "undefined" ? null : new EventTarget()

export const NAVIGATE = "navigate"
