// One requestAnimationFrame loop for everything that moves per frame. Work runs
// in a fixed order, so Lenis moves the page before the starfield reads where
// it landed (no one-frame lag between the stars and the content), and the
// browser wakes once per frame instead of once per animation. The loop stops
// when nothing is subscribed.

type Tick = (time: number) => void

const ticks: { tick: Tick; order: number }[] = []
let raf = 0

function loop(time: number) {
  raf = requestAnimationFrame(loop)
  for (const { tick } of ticks) tick(time)
}

/** Runs `tick` every frame, lower `order` first. Returns an unsubscribe. */
export function onTick(tick: Tick, order = 0) {
  ticks.push({ tick, order })
  ticks.sort((a, b) => a.order - b.order)
  if (!raf) raf = requestAnimationFrame(loop)
  return () => {
    const index = ticks.findIndex((entry) => entry.tick === tick)
    if (index !== -1) ticks.splice(index, 1)
    if (ticks.length === 0 && raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
  }
}

/** Runs `work` once the browser is idle (or after `timeout` ms at the latest). */
export function whenIdle(work: () => void, timeout = 1200) {
  // Safari has no requestIdleCallback; a short timeout stands in for it.
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(work, { timeout })
    return () => window.cancelIdleCallback(id)
  }
  const id = window.setTimeout(work, Math.min(timeout, 300))
  return () => window.clearTimeout(id)
}
