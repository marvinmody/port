import manifest from "@/content/media.json"
import type { Image } from "@/content/projects"

type Source = [width: number, src: string]

export type Media = {
  width: number
  height: number
  color: string
  sources: { avif: Source[]; webp: Source[] }
}

/** Everything a <picture> needs, without the manifest: safe to pass to client components. */
export type Resolved = {
  alt: string
  position?: string
  width: number
  height: number
  color: string
  avif: string
  webp: string
  src: string
}

const media = manifest as unknown as Record<string, Media>

const getMedia = (id: string): Media | undefined => media[id]

const srcSet = (sources: Source[]) => sources.map(([w, src]) => `${src} ${w}w`).join(", ")

/** A sensible <img src> for browsers that ignore <source>: the variant closest to 1200px. */
const fallbackSrc = (m: Media) => {
  const list = m.sources.webp
  return (list.find(([w]) => w >= 1200) ?? list[list.length - 1])[1]
}

export function resolve(image: Image): Resolved | undefined {
  const m = getMedia(image.media)
  if (!m) return undefined
  return {
    alt: image.alt,
    position: image.position,
    width: m.width,
    height: m.height,
    color: m.color,
    avif: srcSet(m.sources.avif),
    webp: srcSet(m.sources.webp),
    src: fallbackSrc(m),
  }
}

/** The project hero's rendered width. The Work page's hover previews use the
 *  same value, so the browser picks the same file and the image is already
 *  cached when it carries over to the project page. */
export const HERO_SIZES = "(min-width: 64rem) calc(100vw - 40px), calc(100vw - 32px)"
