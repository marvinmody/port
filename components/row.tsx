import type { ReactNode } from "react"
import { cx } from "@/lib/util"

type Props = {
  id: string
  label: string
  /** "01", "02"…: a quiet index before the label. */
  index?: string
  /** On screen at load: rise in with the page instead of on scroll. */
  first?: boolean
  className?: string
  children: ReactNode
}

// One block of a page: a hairline, the label on the first third, the content
// across the other two. Stacks on phones.
export function Row({ id, label, index, first, className, children }: Props) {
  return (
    <section aria-labelledby={id} className={cx("row cols", first ? "reveal" : "in-view", className)}>
      <h2 id={id} className="label t1">
        {index && <span className="text-grey">{index}&emsp;</span>}
        {label}
      </h2>
      <div className="t23 mt-2 md:mt-0">{children}</div>
    </section>
  )
}
