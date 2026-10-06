import { BackToTop } from "@/components/back-to-top"
import { site } from "@/content/site"
import { shortDate } from "@/lib/util"

// Build-time: the date of the commit this deploy was built from.
const updated = process.env.NEXT_PUBLIC_LAST_UPDATED ?? new Date().toISOString()

export function Footer() {
  return (
    <footer className="site-footer frame label text-grey">
      <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 border-t border-line pt-2 pb-3 md:grid md:grid-cols-12 md:gap-x-[var(--gap)]">
        <p className="md:col-span-4">
          © {new Date(updated).getFullYear()} {site.name}
        </p>
        <p className="md:col-start-5 md:col-span-4">
          Updated <time dateTime={updated}>{shortDate(updated, site.timeZone)}</time>
        </p>
        <p className="max-md:w-full md:col-start-9 md:col-span-4 md:text-right">
          <BackToTop />
        </p>
      </div>
    </footer>
  )
}
