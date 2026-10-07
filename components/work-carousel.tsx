"use client"

import { useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react"
import { flushSync } from "react-dom"
import {
  cardHeightFor,
  Digits,
  FlexCarousel,
  type FlexHandle,
  type FlexItem,
  type FlexRect,
} from "@/components/flex-carousel"
import { Picture } from "@/components/picture"
import { landed, Link, useNavigate } from "@/components/transitions"
import { drift } from "@/lib/drift"
import { HERO_SIZES, type Resolved } from "@/lib/media"
import { lastProject, openProject, viewed } from "@/lib/recent"
import { prefersReducedMotion } from "@/lib/scroll"

export type WorkItem = {
  slug: string
  title: string
  disciplines: string[]
  period: string
  hero: Resolved
}

// The glass. cardHeight and cardWidth size the cards (see cardHeightFor);
// the rest shape the bend where the row meets the glass's edge.
const GLASS = {
  preset: "liquid",
  cardHeight: 0.5,
  cardWidth: 0.56,
  gap: 20,
  squeeze: 0.2,
  lensWidth: 0.92,
  lensHeight: 1.17,
  tilt: -61,
  roundness: 0,
  bend: 0.38,
  reach: 0.4,
  dispersion: 0.5,
  liquid: 0.77,
} as const

/** Long enough to see the row part around the chosen card, short enough not to wait on. */
const OPEN_MS = 420

const pad = (n: number) => String(n).padStart(2, "0")
const href = (item: WorkItem) => `/work/${item.slug}/`

const isModified = (event: MouseEvent) =>
  event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey

const inField = (target: EventTarget | null) =>
  target instanceof HTMLElement && !!target.closest("input, textarea, select, [contenteditable]")

type Carry = { index: number; out: boolean; rect?: FlexRect }

// Every project in one row, seen through glass (components/flex-carousel.tsx).
// Scroll, drag, swipe or use the arrow keys to move along it; the stars
// drift with it. The caption under the middle card is a link to it.
// Choosing a project parts the row around it, then hands its image and title
// to the project page (components/transitions.tsx). Coming back, the image
// returns to the middle of the row and the rest fades in around it.
//
// The row draws the images of a plain list of the projects, which is also
// what screen readers get, and what shows without WebGL2 or script.
export function WorkCarousel({ items }: { items: WorkItem[] }) {
  const router = useRouter()
  const navigate = useNavigate()
  const stage = useRef<HTMLElement>(null)
  const list = useRef<HTMLOListElement>(null)
  const ghost = useRef<HTMLSpanElement>(null)
  const carousel = useRef<FlexHandle>(null)

  // Open on the project you last looked at. If its page is still on screen
  // while this renders, you're coming straight back from it.
  const [start] = useState(() => {
    const index = Math.max(0, items.findIndex((item) => item.slug === lastProject()))
    return { index, returning: openProject() === items[index].slug }
  })
  const [active, setActive] = useState(start.index)
  const [sources, setSources] = useState<HTMLImageElement[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [shown, setShown] = useState(start.returning)
  const [choosing, setChoosing] = useState(false)
  // Stands in for a card while a page transition carries its image: in from
  // a project page, or out to one.
  const [carry, setCarry] = useState<Carry | null>(start.returning ? { index: start.index, out: false } : null)
  const activeRef = useRef(start.index)
  const chosen = useRef<number | null>(null)
  const handover = useRef({ landed: false, ready: false })
  const alive = useRef(true)

  const widest = useMemo(() => Math.max(...items.map((item) => item.hero.width / item.hero.height)), [items])
  const flexItems = useMemo<FlexItem[] | null>(
    () =>
      sources?.length === items.length
        ? items.map((item, i) => ({
            image: sources[i],
            aspect: item.hero.width / item.hero.height,
            color: item.hero.color,
          }))
        : null,
    [sources, items],
  )

  // Size the cards the way the carousel will, before the first paint: the
  // stand-in and the caption sit against the middle card from the start.
  useLayoutEffect(() => {
    const el = stage.current
    if (!el) return
    const measure = () => {
      const height = cardHeightFor(el.clientWidth, el.clientHeight, GLASS.cardHeight, GLASS.cardWidth, widest)
      el.style.setProperty("--card-h", `${height}px`)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    // The list's own images, one per project, in order.
    setSources([...(list.current?.querySelectorAll("img") ?? [])])
    setMounted(true)
    return () => observer.disconnect()
  }, [widest])

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  // Back from a project: its image lands in the middle of the row, over its
  // card, which waits undrawn. Once the page transition has landed and the
  // card would be drawn whole, the card takes over in the same frame.
  const handOver = useCallback(() => {
    if (!handover.current.landed || !handover.current.ready) return
    carousel.current?.release()
    setCarry((current) => (current && !current.out ? null : current))
  }, [])

  useEffect(() => {
    if (!start.returning) return
    let live = true
    landed().then(() => {
      if (!live) return
      handover.current.landed = true
      handOver()
    })
    // An image that never loads mustn't keep the stand-in up for good.
    const timeout = window.setTimeout(() => {
      handover.current.ready = true
      handOver()
    }, 4000)
    return () => {
      live = false
      window.clearTimeout(timeout)
    }
  }, [handOver, start.returning])

  const choose = useCallback(
    (index: number) => {
      if (chosen.current !== null) return
      const item = items[index]
      const engine = carousel.current
      if (!engine || failed) return navigate(href(item))
      chosen.current = index
      router.prefetch(href(item))
      // The stand-in is readied now, unseen, so it's decoded when it's needed.
      flushSync(() => {
        setChoosing(true)
        setCarry({ index, out: true })
      })
      engine.open(index)
      const img = ghost.current?.querySelector("img")
      const decoded = img ? img.decode().catch(() => {}) : Promise.resolve()
      const opening = new Promise((resolve) => window.setTimeout(resolve, prefersReducedMotion() ? 0 : OPEN_MS))
      Promise.all([decoded, opening]).then(() => {
        if (!alive.current) return
        // The card stops and the stand-in takes its exact place: that's what
        // the page transition carries onto the project page.
        const rect = engine.hold(index) ?? undefined
        flushSync(() => setCarry({ index, out: true, rect }))
        navigate(href(item))
      })
    },
    [failed, items, navigate, router],
  )

  const onChange = useCallback(
    (index: number) => {
      activeRef.current = index
      setActive(index)
      viewed(items[index].slug)
    },
    [items],
  )

  const onSelect = useCallback(
    (index: number, event: PointerEvent) => {
      // A modified click opens it on its own, as a link would.
      if (event.metaKey || event.ctrlKey) {
        window.open(href(items[index]), "_blank", "noopener")
        return
      }
      choose(index)
    },
    [choose, items],
  )

  const onHeldReady = useCallback(() => {
    handover.current.ready = true
    handOver()
  }, [handOver])

  // Moving the row while the stand-in is up: stop waiting for the card.
  const onInteract = useCallback(() => {
    if (handover.current.ready) return
    handover.current.ready = true
    handOver()
  }, [handOver])

  const onLift = useCallback((lift: number) => {
    stage.current?.style.setProperty("--lift", lift.toFixed(4))
  }, [])

  // The arrow, page and space keys move along the row from anywhere on the
  // page, and Enter opens the project in the middle. The wheel over the
  // header (which sits over the row's top edge) moves the row too.
  useEffect(() => {
    if (failed) return
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || inField(event.target)) return
      const engine = carousel.current
      if (!engine || chosen.current !== null) return
      const onControl = event.target instanceof HTMLElement && !!event.target.closest("a, button")
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
          engine.step(1)
          break
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
          engine.step(-1)
          break
        case " ":
          if (onControl) return
          engine.step(event.shiftKey ? -1 : 1)
          break
        case "Home":
          engine.goTo(0)
          break
        case "End":
          engine.goTo(items.length - 1)
          break
        case "Enter":
          if (onControl) return
          choose(activeRef.current)
          break
        default:
          return
      }
      event.preventDefault()
    }
    const onWheel = (event: WheelEvent) => {
      const row = stage.current?.querySelector(".flex-carousel")
      if (!row || (event.target instanceof Node && row.contains(event.target))) return
      carousel.current?.wheel(event)
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("wheel", onWheel)
    }
  }, [choose, failed, items.length])

  const item = items[active]
  const carried = carry ? items[carry.index] : null
  const meta = (it: WorkItem) => (
    <>
      {it.disciplines.join(" & ")}
      <span aria-hidden="true">&ensp;·&ensp;</span>
      {it.period}
    </>
  )

  return (
    <section
      ref={stage}
      className="work"
      aria-label="Projects"
      data-gl={failed ? "off" : undefined}
      data-choosing={choosing || undefined}
    >
      {flexItems && !failed && (
        <FlexCarousel
          ref={carousel}
          items={flexItems}
          {...GLASS}
          intro={start.returning ? "bloom" : "rise"}
          initial={start.index}
          held={start.returning ? start.index : -1}
          onChange={onChange}
          onSelect={onSelect}
          onIntro={() => setShown(true)}
          onHeldReady={onHeldReady}
          onInteract={onInteract}
          onMove={drift}
          onLift={onLift}
          onFail={() => setFailed(true)}
        />
      )}

      {carry && carried && !failed && (
        <span
          key={carry.index}
          ref={ghost}
          className="work-carry"
          aria-hidden="true"
          data-morph="hero"
          data-slug={carried.slug}
          data-shown={!carry.out || carry.rect ? "" : undefined}
          style={
            carry.rect
              ? ({
                  left: carry.rect.x,
                  top: carry.rect.y,
                  width: carry.rect.width,
                  height: carry.rect.height,
                  translate: "none",
                } as CSSProperties)
              : ({ "--ratio": carried.hero.width / carried.hero.height } as CSSProperties)
          }
        >
          <Picture image={carried.hero} sizes={HERO_SIZES} priority decorative />
        </span>
      )}

      {!failed && (
        <>
          <div className="work-caption" data-shown={shown || undefined}>
            <Link
              key={item.slug}
              href={href(item)}
              className="work-title display"
              data-morph="title"
              data-slug={item.slug}
              onPointerDown={() => router.prefetch(href(item))}
              onClick={(event) => {
                if (isModified(event)) return
                event.preventDefault()
                choose(activeRef.current)
              }}
            >
              {item.title}
            </Link>
            <p key={`${item.slug}-meta`} className="work-meta label">
              {meta(item)}
            </p>
          </div>

          <div className="work-foot frame label" data-shown={shown || undefined} aria-hidden="true">
            <p>
              <Digits value={active + 1} />
              <span className="text-grey">&ensp;/&ensp;{pad(items.length)}</span>
            </p>
            <p className="text-grey">
              <span className="hint-fine">Scroll to browse</span>
              <span className="hint-touch">Swipe to browse</span>
            </p>
          </div>

          <p className="sr-only" aria-live="polite">
            {`${item.title}, ${active + 1} of ${items.length}`}
          </p>
        </>
      )}

      {/* The projects as a list: for screen readers, and on screen without
          WebGL2 or script. The row draws these images. */}
      <ol ref={list} className="work-index">
        {items.map((it) => (
          <li key={it.slug}>
            <Link href={href(it)} className="work-index-link" tabIndex={mounted && !failed ? -1 : undefined}>
              <span
                className="work-index-media"
                style={{ aspectRatio: `${it.hero.width} / ${it.hero.height}`, backgroundColor: it.hero.color }}
              >
                <Picture image={it.hero} sizes={HERO_SIZES} priority decorative />
              </span>
              <span className="work-index-title display">{it.title}</span>
              <span className="label text-grey">{meta(it)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
