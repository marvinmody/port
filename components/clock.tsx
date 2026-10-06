"use client"

import { useEffect, useState } from "react"

// Local time where I am, ticking on the second. Blank until it mounts, so the
// static HTML never shows a stale time.
export function Clock({ timeZone }: { timeZone: string }) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    let timer = 0
    const tick = () => {
      setNow(new Date())
      timer = window.setTimeout(tick, 1000 - (Date.now() % 1000))
    }
    tick()
    return () => window.clearTimeout(timer)
  }, [])

  const text = now
    ? new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(now)
    : "--:--:--"

  return (
    <time dateTime={now?.toISOString()} className="tabular-nums">
      {text}
    </time>
  )
}
