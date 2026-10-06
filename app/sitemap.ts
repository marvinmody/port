import type { MetadataRoute } from "next"
import { projects } from "@/content/projects"
import { site } from "@/content/site"

export const dynamic = "force-static"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(process.env.NEXT_PUBLIC_LAST_UPDATED ?? Date.now())
  const paths = ["/", "/work/", "/about/", "/contact/", ...projects.map((project) => `/work/${project.slug}/`)]
  return paths.map((path) => ({ url: new URL(path, site.url).toString(), lastModified }))
}
