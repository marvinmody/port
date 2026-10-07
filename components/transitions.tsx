"use client"

import NextLink from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react"
import { bus, NAVIGATE } from "@/lib/bus"
import { prefersReducedMotion, scrollToTop, scrollToY } from "@/lib/scroll"

// Page changes run through the View Transitions API. The old page is
// captured and dissolves forward (see globals.css) while the new one rises in
// underneath. A project's title and image are the exception: they carry over
// between the Work list and the project page, moving into their new place.
//
// Elements that carry over are marked data-morph="title" | "hero" and
// data-slug="<project>". Only the pair for the project in play is named, just
// before the old page is captured and just after the new one commits.

// The page transition in flight, if any. A carried element on the new page
// can wait for it to land before handing over to what it stands in for
// (components/work-carousel.tsx).
let landing: Promise<void> = Promise.resolve()

/** Resolves once the page transition in flight has finished; at once if there's none. */
export const landed = () => landing

type Options = {
  /** Go back in history instead, if that's where `href` is: no new entry. */
  back?: boolean
}

type Navigate = (href: string, options?: Options) => void

const NavigateContext = createContext<Navigate | null>(null)

export function useNavigate() {
  const navigate = useContext(NavigateContext)
  if (!navigate) throw new Error("useNavigate needs <Transitions> above it")
  return navigate
}

const trim = (path: string) => path.replace(/(.)\/$/, "$1")
const projectSlug = (path: string) => /^\/work\/([^/]+)\/?$/.exec(path)?.[1]

// The project whose title and image carry over: the one being opened, or the
// one being left on the way back to the list.
function carriedSlug(from: string, to: string) {
  return projectSlug(to) ?? (trim(to) === "/work" ? projectSlug(from) : undefined)
}

// Both ways: on a rail, a section can be off to the side.
function onScreen(el: HTMLElement) {
  const box = el.getBoundingClientRect()
  return (
    box.width > 0 && box.bottom > 0 && box.top < window.innerHeight && box.right > 0 && box.left < window.innerWidth
  )
}

// Arriving: at the top of the new page, with focus at its start. (Back on the
// Work page, the row opens on the project you left by itself: lib/recent.ts.)
function arriveAt() {
  scrollToTop(true)
  focusMain()
}

// Names the carried elements for `slug`, at most one of each kind, and only
// the kinds in `only` when given (those that left the old page).
function nameCarried(slug: string, onScreenOnly: boolean, only?: Set<string>) {
  const named: HTMLElement[] = []
  const kinds = new Set<string>()
  for (const el of document.querySelectorAll<HTMLElement>("[data-morph]")) {
    const kind = el.dataset.morph
    if (!kind || el.dataset.slug !== slug || kinds.has(kind)) continue
    if (only && !only.has(kind)) continue
    if (onScreenOnly && !onScreen(el)) continue
    kinds.add(kind)
    el.style.viewTransitionName = `morph-${kind}`
    named.push(el)
  }
  return named
}

// The move is a carried element's entrance: skip its own reveal animations,
// and any an ancestor is running, which would dim it the moment it lands.
function settleEntrance(el: HTMLElement) {
  const finish = (animations: Animation[]) => {
    for (const animation of animations) {
      try {
        if (animation.timeline === document.timeline) animation.finish()
      } catch {
        // An endless animation can't be finished; leave it running.
      }
    }
  }
  finish(el.getAnimations({ subtree: true }))
  for (let node = el.parentElement; node && node.id !== "main"; node = node.parentElement) finish(node.getAnimations())
}

function focusMain() {
  document.getElementById("main")?.focus({ preventScroll: true })
}

export function Transitions({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  // Runs once the next route has committed to the DOM.
  const arrive = useRef<(() => void) | null>(null)
  const running = useRef(false)
  // The page before this one, to step back to it rather than forward.
  const here = useRef(pathname)
  const previous = useRef<string | null>(null)
  // Where each page was scrolled to, for the browser's back and forward.
  const scrolled = useRef(new Map<string, number>())

  // The site restores scroll itself. Left to the browser, it puts the old
  // position back after a history step, which would undo a rail opening on
  // the project you came from.
  useEffect(() => {
    window.history.scrollRestoration = "manual"
    const remember = () => scrolled.current.set(trim(here.current), window.scrollY)
    window.addEventListener("scroll", remember, { passive: true })
    return () => window.removeEventListener("scroll", remember)
  }, [])

  useLayoutEffect(() => {
    const changed = here.current !== pathname
    if (changed) {
      previous.current = here.current
      here.current = pathname
    }
    const done = arrive.current
    arrive.current = null
    if (done) done()
    // Back or forward from the browser: return to where this page was.
    else if (changed) scrollToY(scrolled.current.get(trim(pathname)) ?? 0, true)
  }, [pathname])

  const navigate = useCallback<Navigate>(
    (href, options) => {
      const url = new URL(href, window.location.href)
      const from = window.location.pathname
      if (url.origin !== window.location.origin) {
        window.location.assign(url)
        return
      }
      if (trim(url.pathname) === trim(from)) {
        if (!url.hash) scrollToTop()
        return
      }

      bus?.dispatchEvent(new Event(NAVIGATE))
      const to = url.pathname
      const slug = carriedSlug(from, to)
      const back = options?.back && previous.current !== null && trim(previous.current) === trim(to)
      const go = () => (back ? router.back() : router.push(href, { scroll: false }))

      if (!document.startViewTransition || prefersReducedMotion() || running.current) {
        arrive.current = arriveAt
        go()
        return
      }

      running.current = true
      const named = slug ? nameCarried(slug, true) : []
      // Only what leaves the old page can arrive on the new one; the rest of
      // the new page makes its usual entrance.
      const carried = new Set(named.map((el) => el.dataset.morph ?? ""))
      // The browser calls back once it has captured the old page. If that
      // never happens (the tab was hidden mid-click), navigate without it.
      let phase: "waiting" | "started" | "fell back" = "waiting"
      let stalled = 0

      const transition = document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            window.clearTimeout(stalled)
            // The old page is captured; its names are free for the new one.
            for (const el of named) el.style.viewTransitionName = ""
            if (phase === "fell back") return resolve()
            phase = "started"
            let settled = false
            const settle = () => {
              if (settled) return
              settled = true
              window.clearTimeout(timeout)
              resolve()
            }
            // Never hold the page frozen on a slow network: past this, the old
            // page lets go and the new one simply appears when it's ready.
            const timeout = window.setTimeout(settle, 1500)
            arrive.current = () => {
              arriveAt()
              if (slug && carried.size > 0 && !settled) {
                for (const el of nameCarried(slug, true, carried)) {
                  settleEntrance(el)
                  named.push(el)
                }
              }
              settle()
            }
            go()
          }),
      )
      stalled = window.setTimeout(() => {
        if (phase !== "waiting") return
        phase = "fell back"
        running.current = false
        transition.skipTransition()
        for (const el of named) el.style.viewTransitionName = ""
        arrive.current = arriveAt
        go()
      }, 1200)
      // A skipped transition still swaps the page; it just doesn't animate.
      transition.ready.catch(() => {})
      landing = transition.finished.then(
        () => {},
        () => {},
      )
      transition.finished.finally(() => {
        for (const el of named) el.style.viewTransitionName = ""
        running.current = false
      })
    },
    [router],
  )

  return <NavigateContext.Provider value={navigate}>{children}</NavigateContext.Provider>
}

const isModified = (event: MouseEvent) =>
  event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey

type LinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & { href: string }

// next/link, routed through the page transition. Modified clicks (new tab,
// new window) and links with a target behave as ordinary links.
export function Link({ href, onClick, ...props }: LinkProps) {
  const navigate = useNavigate()
  return (
    <NextLink
      href={href}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || isModified(event)) return
        if (props.target && props.target !== "_self") return
        event.preventDefault()
        navigate(href)
      }}
      {...props}
    />
  )
}
