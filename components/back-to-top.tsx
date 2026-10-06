"use client"

import { scrollToTop } from "@/lib/scroll"

// Glides to the top (Lenis) and puts focus back at the start of the page.
export function BackToTop() {
  return (
    <a
      href="#top"
      className="hit nav-link"
      onClick={(event) => {
        event.preventDefault()
        scrollToTop()
        document.getElementById("top")?.focus({ preventScroll: true })
      }}
    >
      <span className="roll">
        <span data-text="Back to top">Back to top</span>
      </span>
      <span aria-hidden="true">&nbsp;↑</span>
    </a>
  )
}
