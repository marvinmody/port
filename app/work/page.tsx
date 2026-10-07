import type { Metadata } from "next"
import { WorkCarousel, type WorkItem } from "@/components/work-carousel"
import { period, projects } from "@/content/projects"
import { resolve } from "@/lib/media"

export const metadata: Metadata = {
  title: "Work",
  description: "Selected work by Marvin Mody: a structural-analysis startup, AI products and embedded systems.",
  alternates: { canonical: "/work/" },
}

export default function Work() {
  const items = projects.flatMap((project): WorkItem[] => {
    const hero = resolve(project.hero)
    if (!hero) return []
    return [{ slug: project.slug, title: project.title, disciplines: project.disciplines, period: period(project), hero }]
  })

  return (
    <>
      <h1 className="sr-only">Work</h1>
      <WorkCarousel items={items} />
    </>
  )
}
