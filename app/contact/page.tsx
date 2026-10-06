import type { Metadata } from "next"
import type { CSSProperties } from "react"
import { Clock } from "@/components/clock"
import { CopyEmail } from "@/components/copy-email"
import { Row } from "@/components/row"
import { site } from "@/content/site"

export const metadata: Metadata = {
  title: "Contact",
  description: `Email ${site.name} or book a call.`,
  alternates: { canonical: "/contact/" },
}

const order = (i: number) => ({ "--i": i }) as CSSProperties

export default function Contact() {
  const bookingIsExternal = site.booking.startsWith("http")
  const newTab = bookingIsExternal ? ({ target: "_blank", rel: "noopener noreferrer" } as const) : {}

  return (
    <div className="frame page-top">
      <h1 className="sr-only">Contact</h1>

      <div className="cols">
        <p className="reveal label t1 text-grey">Contact</p>
        <p className="reveal lead t23 mt-2 max-w-[30ch] md:mt-0" style={order(1)}>
          If you’re building something that has to work in the real world, I’d like to hear about it.
        </p>
      </div>

      <div className="mt-12 md:mt-20">
        <Row id="email" label="Email" index="01" first className="[--i:2]">
          <CopyEmail email={site.email} />
          <p className="mt-4">
            <a href={site.booking} {...newTab} className="line-link">
              Book a call
            </a>
            <span aria-hidden="true">&nbsp;↗</span>
            {bookingIsExternal && <span className="sr-only"> (opens in a new tab)</span>}
          </p>
        </Row>
        <Row id="elsewhere" label="Elsewhere" index="02" first className="[--i:3]">
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {site.socials.map((social) => (
              <li key={social.href}>
                <a href={social.href} target="_blank" rel="noopener noreferrer" className="line-link">
                  {social.label}
                </a>
                <span aria-hidden="true">&nbsp;↗</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </li>
            ))}
            {site.resume && (
              <li>
                <a href={site.resume} target="_blank" rel="noopener noreferrer" className="line-link">
                  Résumé
                </a>
                <span aria-hidden="true">&nbsp;↗</span>
                <span className="sr-only"> (PDF, opens in a new tab)</span>
              </li>
            )}
          </ul>
        </Row>
        <Row id="based" label="Based in" index="03" className="[--i:4]">
          <p>
            {site.location}
            <span className="label text-grey">
              &emsp;
              <Clock timeZone={site.timeZone} />
            </span>
          </p>
        </Row>
        <Row id="availability" label="Availability" index="04" className="[--i:5]">
          <p>Internships from {site.availableFrom}</p>
          <p className="text-grey">{site.responseTime}</p>
        </Row>
      </div>
    </div>
  )
}
