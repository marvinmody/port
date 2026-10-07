"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Link } from "@/components/transitions"
import { site } from "@/content/site"

const trim = (path: string) => path.replace(/(.)\/$/, "$1")

const nav = [
  { label: "Work", href: "/work/", place: "md:col-start-5 md:col-span-4" },
  { label: "About", href: "/about/", place: "md:col-start-9 md:col-span-3" },
  { label: "Contact", href: "/contact/", place: "md:col-start-12 md:justify-self-end" },
]

// The name and three places, on the thirds of the grid. On the home page the
// name steps aside: it's already in the middle of the screen. The section
// you're in is grey. On a page that reads downwards the header steps out of
// the way as you go and returns when you scroll back up; on a page that moves
// sideways (components/rail.tsx) it simply stays.
export function Header() {
  const pathname = trim(usePathname())
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (document.documentElement.dataset.flow === "horizontal") {
        setScrolled(false)
        setHidden(false)
        last = y
        return
      }
      setScrolled(y > 8)
      if (Math.abs(y - last) < 8) return
      setHidden(y > last && y > 240)
      last = y
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => setHidden(false), [pathname])

  return (
    <header className="site-header" data-hidden={hidden || undefined} data-scrolled={scrolled || undefined}>
      <nav aria-label="Primary" className="frame">
        <ul className="flex h-[var(--header)] items-center justify-between md:grid md:grid-cols-12 md:gap-x-[var(--gap)]">
          <li className="md:col-span-4">
            <Link href="/" className="hit nav-link label brand" data-away={pathname === "/" || undefined}>
              <span className="roll">
                <span data-text={site.name}>{site.name}</span>
              </span>
            </Link>
          </li>
          {nav.map((item) => {
            // "page" on the page itself; "true" inside its section (a project under Work).
            const page = pathname === trim(item.href)
            const section = !page && pathname.startsWith(trim(item.href) + "/")
            return (
              <li key={item.href} className={item.place}>
                <Link
                  href={item.href}
                  aria-current={page ? "page" : section ? "true" : undefined}
                  className="hit nav-link label"
                >
                  <span className="roll">
                    <span data-text={item.label}>{item.label}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}
