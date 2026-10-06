"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Link } from "@/components/transitions"
import { site } from "@/content/site"

const trim = (path: string) => path.replace(/(.)\/$/, "$1")
const pad = (n: number) => String(n).padStart(2, "0")

// Four entries on the thirds of the grid, the last flush right. The page
// you're on is grey. The header steps out of the way while you read down a
// page and returns as soon as you scroll back up.
export function Header({ workCount }: { workCount: number }) {
  const pathname = trim(usePathname())
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
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

  const nav = [
    { label: "Work", href: "/work/", count: workCount, place: "md:col-start-5 md:col-span-4" },
    { label: "About", href: "/about/", place: "md:col-start-9 md:col-span-3" },
    { label: "Contact", href: "/contact/", place: "md:col-start-12 md:justify-self-end" },
  ]

  return (
    <header className="site-header" data-hidden={hidden || undefined} data-scrolled={scrolled || undefined}>
      <nav aria-label="Primary" className="frame">
        <ul className="label flex h-[var(--header)] items-center justify-between md:grid md:grid-cols-12 md:gap-x-[var(--gap)]">
          <li className="md:col-span-4">
            <Link href="/" className="hit nav-link brand" aria-current={pathname === "/" ? "page" : undefined}>
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
                  className="hit nav-link slash"
                >
                  <span className="roll">
                    <span data-text={item.label}>{item.label}</span>
                  </span>
                  {item.count !== undefined && (
                    <>
                      <sup className="count" aria-hidden="true">
                        {pad(item.count)}
                      </sup>
                      <span className="sr-only">, {item.count} projects</span>
                    </>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}
