// Site-wide copy and settings. Values marked PLACEHOLDER are educated guesses
// that need confirming before this goes live; search the repo for
// "PLACEHOLDER" to find every one.

export const site = {
  name: "Marvin Mody",
  role: "Computer engineer",
  url: "https://marvinmody.me",
  description:
    "Marvin Mody, computer engineer at Stevens and co-founder of Phasm. AI for physical systems: structural analysis, embedded control and machine learning.",

  email: "themarvinmody@gmail.com",

  // Shown with a live clock along the bottom of the home page.
  location: "New York",
  timeZone: "America/New_York",

  // The home page's other two facts, beside the clock.
  now: { role: "Co-founder of", company: "Phasm", href: "/work/phasm/" },
  study: "Computer engineering, Stevens ’28",

  // PLACEHOLDER: the month you can start.
  availableFrom: "May 2027",

  // PLACEHOLDER: a scheduling link (Cal.com, Calendly…). "Book a call" shows
  // on the Contact page only once this is set; until then the email does it.
  booking: "",

  // PLACEHOLDER: confirm your usual reply time.
  responseTime: "Replies within two working days, Eastern Time",

  // A public copy of the résumé, e.g. "/marvin-mody-resume.pdf" in public/.
  // Left empty on purpose: the PDF carries a phone number. Remove it from a
  // copy, drop that in public/ and set the path here to show a link on the
  // Contact page.
  resume: "",

  socials: [
    { label: "GitHub", href: "https://github.com/marvinmody" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/marvinrm" },
  ],
} as const
