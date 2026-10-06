import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google"
import "lenis/dist/lenis.css"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { Reveals } from "@/components/reveals"
import { SmoothScroll } from "@/components/smooth-scroll"
import { Starfield } from "@/components/starfield"
import { Transitions } from "@/components/transitions"
import { projects } from "@/content/projects"
import { site } from "@/content/site"
import "./globals.css"

// Three voices: Instrument Serif for names and titles, Geist for reading,
// Geist Mono in small capitals for labels and numbers. next/font self-hosts
// all three with font-display: swap.
const sans = Geist({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-geist", display: "swap" })
const mono = Geist_Mono({ subsets: ["latin"], weight: "400", variable: "--font-geist-mono", display: "swap" })
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "normal",
  variable: "--font-instrument",
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
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable}`}>
      <body className="flex flex-col">
        <Starfield />
        <SmoothScroll />
        <Reveals />
        <Transitions>
          <div id="top" tabIndex={-1} className="outline-none" />
          <a href="#main" className="skip label">
            Skip to content
          </a>
          <Header workCount={projects.length} />
          <main id="main" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <Footer />
        </Transitions>
      </body>
    </html>
  )
}
