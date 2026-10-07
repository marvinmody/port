"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Picture } from "@/components/picture"
import { HERO_SIZES, type Resolved } from "@/lib/media"
import { whenIdle } from "@/lib/ticker"

type Connection = { saveData?: boolean; effectiveType?: string }

// Once the page you're on has gone quiet, fetches the Work page's images:
// the very files it will ask for (same sources, same sizes), so its row is
// ready the moment you open it. Never on a data-saving or slow connection.
export function WarmWork({ images }: { images: Resolved[] }) {
  const pathname = usePathname()
  const [warm, setWarm] = useState(false)

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: Connection }).connection
    if (connection?.saveData || /2g$/.test(connection?.effectiveType ?? "")) return
    return whenIdle(() => setWarm(true), 4000)
  }, [])

  // The Work page loads them itself.
  if (!warm || pathname.startsWith("/work")) return null
  return (
    <div hidden>
      {images.map((image) => (
        <Picture key={image.src} image={image} sizes={HERO_SIZES} priority="low" decorative />
      ))}
    </div>
  )
}
