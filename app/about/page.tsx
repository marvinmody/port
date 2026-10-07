import type { Metadata } from "next"
import { LOGOS, Logo } from "@/components/logo"
import { Panel } from "@/components/panel"
import { Rail } from "@/components/rail"
import { Link } from "@/components/transitions"
import { about, type Entry } from "@/content/about"
import { site } from "@/content/site"

export const metadata: Metadata = {
  title: "About",
  description:
    "Marvin Mody: computer engineering at Stevens, co-founder of Phasm. Experience, leadership, education and recognition.",
  alternates: { canonical: "/about/" },
}

// The name (with its logo, if it has one) and period on one line, a quiet
// line of role and place, then the detail. A logo that spells the name stands
// in for it on screen; screen readers still hear the name.
function Name({ entry }: { entry: Entry }) {
  const name = entry.href ? (
    <Link href={entry.href} className="line-link">
      {entry.title}
    </Link>
  ) : (
    <span>{entry.title}</span>
  )
  if (!entry.logo) return name
  return (
    <span className="entry-name">
      <Logo name={entry.logo} className="entry-logo" />
      {LOGOS[entry.logo].wordmark ? <span className="sr-only">{entry.title}</span> : name}
    </span>
  )
}

function Entries({ entries }: { entries: Entry[] }) {
  return (
    <ul className="space-y-5">
      {entries.map((entry) => (
        <li key={entry.title}>
          <h3 className="flex items-baseline justify-between gap-3">
            <Name entry={entry} />
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
    <Rail>
      <section className="panel panel-text" data-panel="intro">
        <h1 className="sr-only">About {site.name}</h1>
        <p className="reveal lead max-w-[30ch]">{about.intro}</p>
      </section>
      <Panel id="experience" label="Experience" first order={1}>
        <Entries entries={about.experience} />
      </Panel>
      <Panel id="leadership" label="Leadership" order={2}>
        <Entries entries={about.leadership} />
      </Panel>
      <Panel id="education" label="Education">
        <Entries entries={about.education} />
        <p className="mt-4 text-grey">Coursework: {about.coursework.join(", ")}.</p>
      </Panel>
      <Panel id="recognition" label="Recognition">
        <ul className="space-y-3">
          {about.recognition.map((entry) => (
            <li key={entry.title}>
              {entry.title}
              {entry.meta && <span className="block text-grey">{entry.meta}</span>}
            </li>
          ))}
        </ul>
      </Panel>
      <Panel id="capabilities" label="Capabilities">
        <dl className="space-y-3">
          {about.capabilities.map((group) => (
            <div key={group.title}>
              <dt className="text-grey">{group.title}</dt>
              <dd>{group.items.join(", ")}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </Rail>
  )
}
