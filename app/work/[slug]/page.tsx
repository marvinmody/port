import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Fragment, type CSSProperties } from "react"
import { BackOut } from "@/components/back-out"
import { Img } from "@/components/img"
import { Logo } from "@/components/logo"
import { Link } from "@/components/transitions"
import { getProject, period, projects } from "@/content/projects"
import { HERO_SIZES, resolve } from "@/lib/media"

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

const order = (i: number) => ({ "--i": i }) as CSSProperties

// Everything on one screen, nothing to scroll: the title, one sentence and
// one line of facts beside the image, the story in columns beneath, and the
// next project. Scrolling steps back out to the Work page (BackOut).
export default async function ProjectPage({ params }: Params) {
  const { slug } = await params
  const data = getProject(slug)
  if (!data) notFound()
  const { project: p, prev, next } = data
  const hero = resolve(p.hero)

  return (
    <article className="project">
      <BackOut slug={p.slug} prev={prev.slug} next={next.slug} />

      <header className="project-intro">
        {p.logo && <Logo name={p.logo} className="project-logo reveal" />}
        {/* The title carries over from the Work page (data-morph). */}
        <h1 className="reveal title w-fit" data-morph="title" data-slug={p.slug} style={order(1)}>
          {p.title}
        </h1>
        <p className="reveal lead mt-3 max-w-[30ch] md:mt-4" style={order(2)}>
          {p.summary}
        </p>
        <p className="reveal label mt-3 text-grey" style={order(3)}>
          {period(p)}
          <span aria-hidden="true">&ensp;·&ensp;</span>
          {p.role}
          {p.links.map((link) => (
            <Fragment key={link.href}>
              <span aria-hidden="true">&ensp;·&ensp;</span>
              <a href={link.href} target="_blank" rel="noopener noreferrer" className="line-link text-fg">
                {link.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </Fragment>
          ))}
        </p>
      </header>

      {/* The image carries over from the Work page (data-morph). */}
      {hero && (
        <figure
          className="project-image reveal-media"
          data-morph="hero"
          data-slug={p.slug}
          style={{ "--ratio": hero.width / hero.height, ...order(2) } as CSSProperties}
        >
          <Img image={p.hero} sizes={HERO_SIZES} priority className="block h-full w-full object-cover" />
        </figure>
      )}

      <div className="project-story reveal" style={order(4)}>
        {p.story.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <footer className="project-foot label reveal" style={order(5)}>
        <Link href={`/work/${next.slug}/`} className="next-link">
          <span className="text-grey">Next&emsp;</span>
          <span className="next-title" data-morph="title" data-slug={next.slug}>
            {next.title}
          </span>
        </Link>
        <span className="project-hint text-grey" aria-hidden="true">
          Scroll to return
        </span>
        <Link href="/work/" className="project-back line-link">
          All work
        </Link>
      </footer>
    </article>
  )
}
