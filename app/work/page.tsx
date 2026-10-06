import type { Metadata } from "next"
import type { CSSProperties } from "react"
import { WorkList, type WorkItem } from "@/components/work-list"
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
  const first = Math.min(...projects.map((project) => project.year))
  const last = projects.some((project) => project.ongoing) ? "Now" : Math.max(...projects.map((project) => project.year))

  return (
    <div className="frame page-top">
      <header className="cols label">
        <h1 className="reveal t1">Selected work</h1>
        <p className="reveal t2 mt-1 text-grey md:mt-0" style={{ "--i": 1 } as CSSProperties}>
          {items.length} projects, {first}–{last}
        </p>
      </header>
      <div className="mt-6 md:mt-10">
        <WorkList items={items} />
      </div>
    </div>
  )
}
