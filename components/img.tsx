import { Picture } from "@/components/picture"
import type { Image } from "@/content/projects"
import { resolve } from "@/lib/media"

type Props = {
  image: Image
  /** Rendered width, as an <img sizes> value. */
  sizes: string
  priority?: boolean
  decorative?: boolean
  className?: string
}

// <Picture> for server components: looks the image up in the media manifest.
export function Img({ image, ...props }: Props) {
  const resolved = resolve(image)
  return resolved ? <Picture image={resolved} {...props} /> : null
}
