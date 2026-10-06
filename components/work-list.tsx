"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react"
import { Picture } from "@/components/picture"
import { Link, useNavigate } from "@/components/transitions"
import { HERO_SIZES, type Resolved } from "@/lib/media"
import { prefersReducedMotion } from "@/lib/scroll"
import { whenIdle } from "@/lib/ticker"

export type WorkItem = {
  slug: string
  title: string
  disciplines: string[]
  period: string
  hero: Resolved
}

type Exit = "up" | "down"

const pad = (n: number) => String(n).padStart(2, "0")

const isModified = (event: MouseEvent) =>
  event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey

// The index of projects. Hovering a row brings it forward and wipes its image
// into the preview, from the side the pointer came from. Choosing a row draws
// its rule across, parts the rest of the list around it, and then hands the
// title and image to the project page (components/transitions.tsx).
export function WorkList({ items }: { items: WorkItem[] }) {
  const router = useRouter()
  const navigate = useNavigate()
  const [active, setActive] = useState<number | null>(null)
  const [from, setFrom] = useState<"above" | "below">("below")
  const [exits, setExits] = useState<Record<number, Exit>>({})
  const [chosen, setChosen] = useState<number | null>(null)
  // Preview images load once the page is idle (or on first hover, if sooner).
  const [loaded, setLoaded] = useState(false)
  const preview = useRef<HTMLDivElement>(null)
  const timer = useRef(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])
  useEffect(() => whenIdle(() => setLoaded(true), 1500), [])

  // Decode the previews ahead of time, so the first wipe never waits on one.
  useEffect(() => {
    if (!loaded) return
    for (const img of preview.current?.querySelectorAll("img") ?? []) img.decode().catch(() => {})
  }, [loaded])

  const show = (i: number | null) => {
    if (chosen !== null || i === active) return
    // Moving down the list, the old image leaves upwards and the new one
    // arrives from below; moving up, the reverse.
    const down = i === null ? from === "below" : active === null || i > active
    if (active !== null) setExits({ ...exits, [active]: down ? "up" : "down" })
    if (i !== null && active !== null) setFrom(down ? "below" : "above")
    setActive(i)
    setLoaded(true)
  }

  const choose = (event: MouseEvent<HTMLAnchorElement>, i: number) => {
    if (event.defaultPrevented || isModified(event)) return
    event.preventDefault()
    if (chosen !== null) return
    setChosen(i)
    if (active !== i) show(i)
    // Long enough to see the rule draw and the list part, short enough not to wait on.
    timer.current = window.setTimeout(() => navigate(`/work/${items[i].slug}/`), prefersReducedMotion() ? 0 : 300)
  }

  return (
    <div className="work cols" data-choosing={chosen !== null || undefined} onPointerLeave={() => show(null)}>
      <ol className="work-list col-span-full md:col-span-8">
        {items.map((item, i) => (
          <li
            key={item.slug}
            className="work-row"
            data-active={active === i || undefined}
            data-chosen={chosen === i || undefined}
            style={
              {
                "--d": chosen === null ? 0 : Math.abs(i - chosen),
                "--side": chosen === null ? 0 : Math.sign(i - chosen),
              } as CSSProperties
            }
          >
            <Link
              href={`/work/${item.slug}/`}
              className="work-link"
              onPointerEnter={() => show(i)}
              onFocus={() => show(i)}
              // Fetch the page the moment a press starts, not when it ends.
              onPointerDown={() => router.prefetch(`/work/${item.slug}/`)}
              onClick={(event) => choose(event, i)}
            >
              <span className="work-index label" aria-hidden="true">
                {pad(i + 1)}
              </span>
              <span className="work-title-wrap">
                <span className="work-title display" data-morph="title" data-slug={item.slug}>
                  {item.title}
                </span>
              </span>
              <span className="work-meta label">{item.disciplines.join(", ")}</span>
              <span className="work-year label">{item.period}</span>
            </Link>
          </li>
        ))}
      </ol>

      <div ref={preview} className="work-preview" data-from={from} aria-hidden="true">
        {items.map((item, i) => (
          <div
            key={item.slug}
            className="work-shot"
            data-on={active === i || undefined}
            data-exit={exits[i]}
            // Only the image on show can carry over to the project page.
            data-morph={active === i ? "hero" : undefined}
            data-slug={item.slug}
            style={{ aspectRatio: `${item.hero.width} / ${item.hero.height}` }}
          >
            <div className="work-shot-frame" style={{ backgroundColor: item.hero.color }}>
              {loaded && <Picture image={item.hero} sizes={HERO_SIZES} decorative className="work-shot-img" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
