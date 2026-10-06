import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Fragment, type CSSProperties } from "react"
import { Img } from "@/components/img"
import { Row } from "@/components/row"
import { Link } from "@/components/transitions"
import { getProject, period, projects, type Section } from "@/content/projects"
import { HERO_SIZES } from "@/lib/media"

type Params = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const data = getProject(slug)
  if (!data) return {}
  const { project } = data
  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: `/work/${slug}/` },
    openGraph: { type: "article", url: `/work/${slug}/`, title: project.title, description: project.summary },
  }
}

const SECTIONS: { id: Section; label: string }[] = [
  { id: "context", label: "Context" },
  { id: "problem", label: "Problem" },
  { id: "approach", label: "Approach" },
  { id: "outcome", label: "Outcome" },
]

const pad = (n: number) => String(n).padStart(2, "0")
const order = (i: number) => ({ "--i": i }) as CSSProperties

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params
  const data = getProject(slug)
  if (!data) notFound()
  const { project: p, index, next } = data

  const facts = [
    { label: "Year", value: period(p) },
    { label: "Client", value: p.client },
    { label: "Role", value: p.role },
    { label: "Team", value: p.team },
    { label: "Deliverables", value: p.deliverables.join(", ") },
  ]

  return (
    <article className="frame page-top">
      <header className="cols">
        <p className="reveal label t1 text-grey">
          {pad(index + 1)} / {pad(projects.length)}
        </p>
        <p className="reveal label t2 text-grey max-md:hidden" style={order(1)}>
          {p.disciplines.join(", ")}
        </p>
        {/* The title carries over from the Work list (data-morph). */}
        <h1 className="reveal title col-span-full mt-3 w-fit md:mt-4" data-morph="title" data-slug={p.slug} style={order(1)}>
          {p.title}
        </h1>
        <p className="reveal lead t23 mt-4 max-w-[34ch] md:mt-8" style={order(2)}>
          {p.summary}
        </p>
      </header>

      <dl className="reveal cols mt-8 gap-y-3 md:mt-12" style={order(3)}>
        {facts.map((fact) => (
          <div key={fact.label} className="col-span-2">
            <dt className="label text-grey">{fact.label}</dt>
            <dd className="mt-0.5 text-pretty">{fact.value}</dd>
          </div>
        ))}
        {p.links.length > 0 && (
          <div className="col-span-2">
            <dt className="label text-grey">Links</dt>
            {p.links.map((link) => (
              <dd key={link.href} className="mt-0.5">
                <a href={link.href} target="_blank" rel="noopener noreferrer" className="line-link">
                  {link.label}
                </a>
                <span aria-hidden="true">&nbsp;↗</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </dd>
            ))}
          </div>
        )}
      </dl>

      {/* The image carries over from the Work list's preview (data-morph). */}
      <figure className="hero reveal-media mt-8 md:mt-12" data-morph="hero" data-slug={p.slug} style={order(4)}>
        <Img image={p.hero} sizes={HERO_SIZES} priority className="drift block h-auto w-full" />
      </figure>

      <div className="mt-8 md:mt-12">
        {SECTIONS.map((section, i) => {
          const image = p.images?.[section.id]
          return (
            <Fragment key={section.id}>
              <Row id={section.id} label={section.label} index={pad(i + 1)}>
                <div className="max-w-[54ch] space-y-2">
                  {p[section.id].map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {section.id === "outcome" && (
                  <dl className="results mt-6 grid grid-cols-2 gap-x-[var(--gap)] gap-y-4 md:mt-8 md:grid-cols-3">
                    {p.results.map((result) => (
                      // The figure reads first; the label is announced first.
                      <div key={result.label} className="flex flex-col-reverse justify-end">
                        <dt className="label mt-1 max-w-[26ch] text-grey">{result.label}</dt>
                        <dd className="display">{result.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </Row>
              {image && (
                <figure className="in-view cols mt-8 md:mt-12">
                  <div className="frame-img t23">
                    <Img image={image} sizes="(min-width: 768px) 66vw, 100vw" className="drift block h-auto w-full" />
                  </div>
                </figure>
              )}
            </Fragment>
          )
        })}
      </div>

      <nav aria-label="Next project" className="next in-view cols mt-20 md:mt-32">
        <p className="label t1 text-grey">Next</p>
        <Link href={`/work/${next.slug}/`} className="next-link group t2 mt-2 md:col-span-6 md:mt-0">
          <span className="display w-fit" data-morph="title" data-slug={next.slug}>
            {next.title}
          </span>
          <span className="next-arrow display" aria-hidden="true">
            →
          </span>
          <span className="label mt-2 block text-grey">
            {next.disciplines.join(", ")}, {period(next)}
          </span>
        </Link>
        <p className="label mt-6 md:col-start-12 md:mt-0 md:justify-self-end">
          <Link href="/work/" className="hit nav-link">
            <span className="roll">
              <span data-text="All work">All work</span>
            </span>
          </Link>
        </p>
      </nav>
    </article>
  )
}
