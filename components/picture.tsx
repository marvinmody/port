import type { Resolved } from "@/lib/media"

type Props = {
  image: Resolved
  /** Rendered width, as an <img sizes> value. */
  sizes: string
  /** Above the fold: load eagerly with high priority. "low": eagerly, but
   *  after everything the page needs (fetching ahead for another page). */
  priority?: boolean | "low"
  /** Purely atmospheric: hidden from screen readers. */
  decorative?: boolean
  className?: string
}

// AVIF and WebP at several widths, with intrinsic dimensions so nothing
// shifts while it loads.
export function Picture({ image, sizes, priority, decorative, className }: Props) {
  return (
    <picture>
      <source type="image/avif" srcSet={image.avif} sizes={sizes} />
      <source type="image/webp" srcSet={image.webp} sizes={sizes} />
      <img
        src={image.src}
        width={image.width}
        height={image.height}
        alt={decorative ? "" : image.alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority === "low" ? "low" : priority ? "high" : undefined}
        decoding="async"
        className={className}
        style={image.position ? { objectPosition: image.position } : undefined}
      />
    </picture>
  )
}
