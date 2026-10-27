import type { CSSProperties } from "react"
import { Clock } from "@/components/clock"
import { HomeScroll } from "@/components/home-scroll"
import { Name } from "@/components/name"
import { Link } from "@/components/transitions"
import { site } from "@/content/site"

const order = (i: number) => ({ "--i": i }) as CSSProperties

// One screen: the name, alone in the stars, and three facts along the bottom
// edge on the thirds of the grid. Around the pointer, the stars bend
// (components/starfield.tsx). The screen holds still while you scroll on
// through the name to the work (components/home-scroll.tsx).
export function Home() {
  return (
    <section className="home relative">
      <HomeScroll />
      <div className="home-stage">
        <div className="home-name absolute inset-x-0 top-1/2 -translate-y-1/2 px-[var(--m)] text-center">
          <Name text={site.name} />
        </div>

        {/* Stacked on phones; on the thirds from 768px. */}
        <div className="home-facts frame label absolute inset-x-0 bottom-0 grid gap-x-[var(--gap)] gap-y-0.5 pb-3 text-grey md:grid-cols-12">
          <p className="reveal md:col-span-4" style={order(9)}>
            {site.now.role}{" "}
            <Link href={site.now.href} className="line-link text-fg">
              {site.now.company}
            </Link>
          </p>
          <p className="reveal md:col-start-5 md:col-span-4" style={order(10)}>
            {site.study}
          </p>
          <p className="reveal md:col-start-9 md:col-span-4 md:text-right" style={order(11)}>
            {site.location} <Clock timeZone={site.timeZone} />
          </p>
        </div>
      </div>
    </section>
  )
}
