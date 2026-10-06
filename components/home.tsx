import type { CSSProperties } from "react"
import { Clock } from "@/components/clock"
import { Link } from "@/components/transitions"
import { site } from "@/content/site"

// The name resolves letter by letter, from the middle out.
function Letters({ text }: { text: string }) {
  const letters = [...text]
  const middle = (letters.length - 1) / 2
  return letters.map((letter, i) => (
    <span key={i} className="letter" style={{ "--d": Math.abs(i - middle) } as CSSProperties}>
      {letter === " " ? " " : letter}
    </span>
  ))
}

const order = (i: number) => ({ "--i": i }) as CSSProperties

// One screen over the stars: the name, one line, and three facts along the
// bottom edge on the thirds of the grid.
export function Home() {
  return (
    <section className="home relative h-svh min-h-[520px]">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-[var(--m)] text-center">
        <h1 className="name">
          <span className="sr-only">{site.name}</span>
          <span aria-hidden="true">
            <Letters text={site.name} />
          </span>
        </h1>
        <p className="reveal mt-2 text-grey" style={order(7)}>
          {site.tagline}
        </p>
      </div>

      {/* Stacked on phones; on the thirds from 768px. */}
      <div className="frame label absolute inset-x-0 bottom-0 grid gap-x-[var(--gap)] gap-y-0.5 pb-3 md:grid-cols-12">
        <p className="reveal md:col-span-4" style={order(9)}>
          <span className="text-grey">Now&ensp;</span>
          <Link href={site.now.href} className="line-link">
            {site.now.lead}
          </Link>
        </p>
        <p className="reveal text-grey md:col-start-5 md:col-span-4" style={order(10)}>
          {site.study}
        </p>
        <p className="reveal md:col-start-9 md:col-span-4 md:text-right" style={order(11)}>
          <span className="text-grey">{site.location}&ensp;</span>
          <Clock timeZone={site.timeZone} />
        </p>
      </div>
    </section>
  )
}
