// Sideways motion the stars should follow from things that move without
// scrolling the page, like the Work row (components/flex-carousel.tsx). The
// starfield takes whatever has built up, once a frame.

let pending = 0

/** The content moved `px` to the left (negative: to the right). */
export function drift(px: number) {
  pending += px
}

export function takeDrift() {
  const px = pending
  pending = 0
  return px
}
