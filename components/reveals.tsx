"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

// Blocks marked .in-view rise in the first time they scroll into view. Used
// below the fold only; what's on screen at load uses .reveal, which is pure
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
      { rootMargin: "0px 0px -8% 0px" },
    )
    for (const el of document.querySelectorAll(".in-view:not([data-shown])")) observer.observe(el)
    return () => observer.disconnect()
  }, [pathname])

  return null
}
