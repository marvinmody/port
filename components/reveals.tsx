"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

// Blocks marked .in-view come in the first time they scroll into view: from
// below on a page that reads downwards, from the right on a rail. Used for
// what starts off screen; what's on screen at load uses .reveal, which is pure
// CSS and needs no JavaScript.
export function Reveals() {
  const pathname = usePathname()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.setAttribute("data-shown", "")
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: "0px -6% -8% 0px" },
    )
    for (const el of document.querySelectorAll(".in-view:not([data-shown])")) observer.observe(el)
    return () => observer.disconnect()
  }, [pathname])

  return null
}
