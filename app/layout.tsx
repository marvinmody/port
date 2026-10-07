import type { Metadata, Viewport } from "next"
import { Fragment_Mono, Instrument_Sans, Instrument_Serif } from "next/font/google"
import "lenis/dist/lenis.css"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { Reveals } from "@/components/reveals"
import { SmoothScroll } from "@/components/smooth-scroll"
import { Starfield } from "@/components/starfield"
import { Transitions } from "@/components/transitions"
import { WarmWork } from "@/components/warm-work"
import { projects } from "@/content/projects"
import { site } from "@/content/site"
import { resolve } from "@/lib/media"
import "./globals.css"

// Instrument Sans to read and title in, Fragment Mono (Helvetica cut to a
// grid) in small capitals for labels, and Instrument Serif for the name on the
// home page alone. next/font self-hosts them with font-display: swap.
const sans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-instrument-sans",
  display: "swap",
})
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "normal",
  variable: "--font-instrument",
  display: "swap",
})
const mono = Fragment_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-fragment-mono",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.role}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_US",
    url: "/",
    title: `${site.name} — ${site.role}`,
    description: site.description,
  },
  twitter: { card: "summary" },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const heroes = projects.flatMap((project) => resolve(project.hero) ?? [])
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="flex flex-col">
        <Starfield />
        <SmoothScroll />
        <Reveals />
        <Transitions>
          <div id="top" tabIndex={-1} className="outline-none" />
          <a href="#main" className="skip">
            Skip to content
          </a>
          <Header />
          <main id="main" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <Footer />
        </Transitions>
        <WarmWork images={heroes} />
      </body>
    </html>
  )
}
