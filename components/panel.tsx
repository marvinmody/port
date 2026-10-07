import type { CSSProperties, ReactNode } from "react"
import { cx } from "@/lib/util"

type Props = {
  /** Names the section (data-panel), for linking straight to it. */
  id: string
  label?: string
  /** Width on a rail, in the page's twelve columns: a third by default. */
  span?: number
  /** On screen when the page arrives: rise in with it, not on entering view. */
  first?: boolean
  /** Order in a staggered entrance. */
  order?: number
  className?: string
  children: ReactNode
}

// One section of a rail (components/rail.tsx): an optional label, then the
// content, whole columns wide so it sits on the header's grid. Stacked on
// small screens.
export function Panel({ id, label, span = 4, first, order = 0, className, children }: Props) {
  const heading = `${id}-label`
  return (
    <section
      data-panel={id}
      aria-labelledby={label ? heading : undefined}
      className={cx("panel panel-text", className)}
      style={{ "--span": span, "--i": order } as CSSProperties}
    >
      <div className={first ? "reveal" : "in-view"}>
        {label && (
          <h2 id={heading} className="label mb-3 text-grey">
            {label}
          </h2>
        )}
        {children}
      </div>
    </section>
  )
}
