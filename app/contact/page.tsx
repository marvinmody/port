import type { Metadata } from "next"
import { CopyEmail } from "@/components/copy-email"
import { Panel } from "@/components/panel"
import { Rail } from "@/components/rail"
import { site } from "@/content/site"

export const metadata: Metadata = {
  title: "Contact",
  description: `Email ${site.name}.`,
  alternates: { canonical: "/contact/" },
}

const external = { target: "_blank", rel: "noopener noreferrer" } as const

export default function Contact() {
  // Optional extras, shown once they're set in content/site.ts.
  const elsewhere = [
    ...site.socials,
    ...(site.booking ? [{ label: "Book a call", href: site.booking }] : []),
    ...(site.resume ? [{ label: "Résumé", href: site.resume }] : []),
  ]

  return (
    <Rail>
      <section className="panel panel-text" data-panel="intro">
        <h1 className="sr-only">Contact</h1>
        <p className="reveal lead max-w-[26ch]">
          If you’re building something that has to work in the real world, I’d like to hear about it.
        </p>
      </section>
      <Panel id="email" label="Email" first order={1}>
        <CopyEmail email={site.email} />
      </Panel>
      <Panel id="elsewhere" label="Elsewhere" span={2} first order={2}>
        <ul className="space-y-1">
          {elsewhere.map((link) => (
            <li key={link.href}>
              <a href={link.href} {...external} className="line-link">
                {link.label}
              </a>
              <span className="sr-only"> (opens in a new tab)</span>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel id="availability" label="Availability" span={2} first order={3}>
        <p>Internships from {site.availableFrom}</p>
        <p className="text-grey">{site.responseTime}</p>
      </Panel>
    </Rail>
  )
}
