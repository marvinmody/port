import type { CSSProperties } from "react"
import { Link } from "@/components/transitions"

const order = (i: number) => ({ "--i": i }) as CSSProperties

export default function NotFound() {
  return (
    <div className="frame cols page-top">
      <p className="reveal label t1 text-grey">404</p>
      <div className="t23 mt-2 md:mt-0">
        <h1 className="reveal title" style={order(1)}>
          Nothing out here.
        </h1>
        <p className="reveal label mt-6" style={order(2)}>
          <Link href="/" className="line-link">
            Back home
          </Link>
        </p>
      </div>
    </div>
  )
}
