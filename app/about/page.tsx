import type { Metadata } from "next"
import type { CSSProperties } from "react"
import { Row } from "@/components/row"
import { about, type Entry } from "@/content/about"
import { site } from "@/content/site"

export const metadata: Metadata = {
  title: "About",
  description:
    "Marvin Mody: computer engineering at Stevens, co-founder of Phasm. Experience, leadership, education and recognition.",
  alternates: { canonical: "/about/" },
}

const order = (i: number) => ({ "--i": i }) as CSSProperties
const external = { target: "_blank", rel: "noopener noreferrer" } as const

// Title and period on one line, a grey meta line, then the detail.
function Entries({ entries }: { entries: Entry[] }) {
  return (
    <ul className="space-y-5">
      {entries.map((entry) => (
        <li key={entry.title} className="max-w-[60ch]">
          <h3 className="flex items-baseline justify-between gap-3">
            <span>{entry.title}</span>
            {entry.period && <span className="label shrink-0 text-grey">{entry.period}</span>}
          </h3>
          {entry.meta && <p className="text-grey">{entry.meta}</p>}
          {entry.detail && <p className="mt-1 text-pretty">{entry.detail}</p>}
        </li>
      ))}
    </ul>
  )
}

export default function About() {
  return (
    <div className="frame page-top">
      <h1 className="sr-only">About {site.name}</h1>

      <div className="cols">
        <p className="reveal label t1 text-grey">About</p>
        <p className="reveal lead t23 mt-2 max-w-[38ch] md:mt-0" style={order(1)}>
          {about.intro}
        </p>
      </div>

      {/* Four numbers that say the most in the least space. */}
      <dl className="reveal cols mt-12 gap-y-6 md:mt-20" style={order(2)}>
        {about.figures.map((figure) => (
          <div key={figure.label} className="col-span-2 flex flex-col-reverse justify-end md:col-span-3">
            <dt className="label mt-1 max-w-[22ch] text-grey">{figure.label}</dt>
            <dd className="display">{figure.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-12 md:mt-20">
        <Row id="experience" label="Experience" index="01">
          <Entries entries={about.experience} />
        </Row>
        <Row id="leadership" label="Leadership" index="02">
          <Entries entries={about.leadership} />
        </Row>
        <Row id="education" label="Education" index="03">
          <Entries entries={about.education} />
          <p className="mt-5 max-w-[60ch] text-grey">
            <span className="label">Coursework&emsp;</span>
            {about.coursework.join(", ")}.
          </p>
        </Row>
        <Row id="recognition" label="Recognition" index="04">
          <ul className="grid gap-x-[var(--gap)] gap-y-3 md:grid-cols-2">
            {about.recognition.map((entry) => (
              <li key={entry.title}>
                {entry.title}
                {entry.meta && <span className="block text-grey">{entry.meta}</span>}
              </li>
            ))}
          </ul>
        </Row>
        <Row id="capabilities" label="Capabilities" index="05">
          <dl className="grid gap-x-[var(--gap)] gap-y-3 md:grid-cols-2">
            {about.capabilities.map((group) => (
              <div key={group.title}>
                <dt>{group.title}</dt>
                <dd className="text-grey">{group.items.join(", ")}</dd>
              </div>
            ))}
          </dl>
        </Row>
        <Row id="elsewhere" label="Elsewhere" index="06">
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            <li>
              <a href={`mailto:${site.email}`} className="line-link">
                {site.email}
              </a>
            </li>
            {site.socials.map((social) => (
              <li key={social.href}>
                <a href={social.href} {...external} className="line-link">
                  {social.label}
                </a>
                <span aria-hidden="true">&nbsp;↗</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </li>
            ))}
            {site.resume && (
              <li>
                <a href={site.resume} {...external} className="line-link">
                  Résumé
                </a>
                <span aria-hidden="true">&nbsp;↗</span>
                <span className="sr-only"> (PDF, opens in a new tab)</span>
              </li>
            )}
          </ul>
        </Row>
      </div>
    </div>
  )
}
