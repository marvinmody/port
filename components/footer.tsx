import { BackToTop } from "@/components/back-to-top"

// Build time: the year of the commit this deploy was built from.
const year = new Date(process.env.NEXT_PUBLIC_LAST_UPDATED ?? Date.now()).getFullYear()

export function Footer() {
  return (
    <footer className="site-footer frame label pb-3 text-grey">
      <p>© {year}</p>
      <p>
        <BackToTop />
      </p>
    </footer>
  )
}
