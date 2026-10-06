// Site-wide copy and settings. Values marked PLACEHOLDER are educated guesses
// that need confirming before this goes live; search the repo for
// "PLACEHOLDER" to find every one.

export const site = {
  name: "Marvin Mody",
  role: "Computer engineer",
  // The one line under the name on the home page.
  tagline: "Building AI for things that have to hold up.",
  url: "https://marvinmody.me",
  description:
    "Marvin Mody, computer engineer at Stevens and co-founder of Phasm. AI for physical systems: structural analysis, embedded control and machine learning.",

  email: "themarvinmody@gmail.com",

  // Shown with a live clock on the home and contact pages, and used for the
  // "Last updated" date in the footer.
  location: "New York",
  timeZone: "America/New_York",

  // The home page's "Now" line.
  now: { lead: "Co-founder, Phasm", href: "/work/phasm/" },
  study: "Computer Engineering, Stevens ’28",

  // PLACEHOLDER: the month you can start.
  availableFrom: "May 2027",

  // PLACEHOLDER: replace with a scheduling link (Cal.com, Calendly…).
  // Until then "Book a call" opens a pre-addressed email.
  booking: "mailto:themarvinmody@gmail.com?subject=Booking%20a%20call",

  // PLACEHOLDER: confirm your usual reply time.
  responseTime: "Replies within two working days, Eastern Time",

  // A public copy of the résumé, e.g. "/marvin-mody-resume.pdf" in public/.
  // Left empty on purpose: the PDF carries a phone number. Remove it from a
  // copy, drop that in public/ and set the path here to show a link on the
  // About and Contact pages.
  resume: "",

  socials: [
    { label: "GitHub", href: "https://github.com/marvinmody" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/marvinrm" },
  ],
} as const
