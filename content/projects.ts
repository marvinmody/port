// The work. Order here is the order on the site. Facts come from the résumé,
// the previous site's project notes and the images in media-src/. Each fact
// appears once: the summary says what it is, the story says why and how and
// what came of it, and nothing is restated as a callout. Confirm every field
// marked PLACEHOLDER.

import type { LogoName } from "@/components/logo"

export type Image = {
  /** File name in media-src/, without the extension. */
  media: string
  alt: string
  /** object-position when the image is cropped to fill. */
  position?: string
}

export type Project = {
  slug: string
  title: string
  /** Shown beside the title on the Work page. */
  disciplines: string[]
  year: number
  /** Still running: reads "Since 2025". */
  ongoing?: boolean
  /** The project's own mark, shown above its title (components/logo.tsx). */
  logo?: LogoName
  role: string
  links: { label: string; href: string }[]
  /** One sentence: what it is. */
  summary: string
  /** A few short paragraphs: the problem, the build, the result. */
  story: string[]
  hero: Image
}

export const projects: Project[] = [
  {
    slug: "phasm",
    title: "Phasm",
    disciplines: ["AI", "Simulation"],
    year: 2025,
    ongoing: true,
    logo: "phasm",
    role: "Co-founder, full-stack developer",
    links: [{ label: "phasm.co", href: "https://phasm.co" }],
    summary: "Structural analysis for drone and UAV engineers, from airframe to finite-element result.",
    story: [
      "Finite-element analysis tells you whether an airframe will hold, but setting it up is specialist work: choosing load cases, meshing the geometry, configuring a solver, reading the result. Phasm runs that whole chain.",
      "A point-cloud model segments the airframe into arms, landing gear and props, so loads go where they physically act. An LLM proposes the load cases, and the pipeline meshes the geometry, runs static and transient solves in CalculiX and renders the stress field in 3D.",
      "I built the pipeline and the FastAPI backend behind our C++ and Qt 6 desktop client, with Supabase for auth and storage and the solvers in Docker.",
      "Phasm has won two hackathons, secured $13,000 in equity-free funding and was selected for Launchpad@Stevens, a 20-person fellowship with more than 75 mentors.",
    ],
    hero: {
      media: "phasm-site",
      alt: "Phasm’s website: a white flying-wing drone with four lift rotors crossing grey cloud, beneath the headline “Effortless Simulation.”",
    },
  },
  {
    slug: "better2gether",
    title: "better2gether",
    disciplines: ["AI", "Web"],
    year: 2025,
    role: "Agent workflow and front end", // PLACEHOLDER: confirm your role
    links: [{ label: "Source", href: "https://github.com/marvinmody/better2gether" }],
    summary: "AI agents for infrastructure planning, built on IBM watsonx Orchestrate.",
    story: [
      "Deciding whether an infrastructure project is worth funding means finding the opportunity, modeling its return and checking who it actually serves. That work usually lives in separate tools, owned by different people.",
      "I gave each step its own agent, plus a last one that assembles an export-ready brief, and watsonx Orchestrate runs them as one workflow behind a single interface.",
      "Built at the watsonx Orchestrate Hackathon at IBM TechXchange 2025, where it took top placement.",
    ],
    hero: {
      media: "b2g-landing",
      alt: "better2gether landing page with the headline “Infrastructure Intelligence, Rewired”, a line about agents that scout opportunities and model ROI, and “Powered by IBM watsonx Orchestrate”.",
      position: "50% 45%",
    },
  },
  {
    slug: "synapse",
    title: "Synapse",
    disciplines: ["AI", "Health"],
    year: 2025, // PLACEHOLDER: confirm year
    role: "Machine learning and front end", // PLACEHOLDER: confirm your role
    links: [
      { label: "Live", href: "https://synapsehealth.vercel.app/" },
      { label: "Model", href: "https://github.com/snigito/SkincareModel" },
    ],
    summary: "A symptom logger that reads photos as well as words, with an assistant that prepares entries for clinical review.",
    story: [
      "Skin symptoms are hard to put into words, and a long log is slow to review by hand. Patients journal what they notice, and an assistant called Dr. Baylor turns the entries into a history, charts and analysis.",
      "I trained a TensorFlow vision model on more than 18,000 dermatology images to classify symptoms from photos, with OpenCV for preprocessing and the Gemini API for real-time visual analysis. The app is React and Tailwind on Supabase.",
      "The classifier reached 98% accuracy, and the automated insights made clinical review 35% faster.",
    ],
    hero: {
      media: "synapse-dashboard",
      alt: "Synapse dashboard introducing Dr. Baylor, an AI health companion for tracking symptoms, above cards for symptom journaling, AI analysis, data visualization and historical tracking.",
      position: "50% 30%",
    },
  },
  {
    slug: "paev",
    title: "Paev",
    disciplines: ["AI", "Finance"],
    year: 2025, // PLACEHOLDER: confirm year
    role: "Full stack and AI", // PLACEHOLDER: confirm your role
    links: [{ label: "Live", href: "https://paev.vercel.app/" }],
    summary: "Stock signals with the reasoning attached, refreshed every four hours from live market data.",
    story: [
      "A number on its own doesn’t explain itself, and market data goes stale within hours. Paev publishes a short list of signals, split into Hot Picks and Value Opportunities, each with a price, a call and a plain-language rationale.",
      "A Python pipeline pulls quotes from the Finnhub API and runs them through agentic tools that draft each signal and its reasoning, and a Next.js front end renders the result. For questions the cards don’t answer, an assistant called Jordy works from the same data in chat.",
    ],
    hero: {
      media: "paev-dashboard",
      alt: "Paev dashboard: “AI-Powered Stock Trading Signals”, tabs for Hot Picks and Value Opportunities, three Buy cards for AAPL, MSFT and GOOGL with prices and rationales, and a “Chat with Jordy?” button.",
    },
  },
  {
    slug: "pid-boat",
    title: "PID Boat",
    disciplines: ["Embedded", "Controls"],
    year: 2024, // PLACEHOLDER: confirm year
    role: "Controls, firmware and hull", // PLACEHOLDER: confirm your role
    links: [
      {
        label: "Report",
        href: "https://docs.google.com/document/d/1ofeTOQ3B0zJh07dTKtYsdTawKFKTSO825JYqsHb2Jnc/edit?tab=t.0",
      },
    ],
    summary: "A fan-driven boat that steers itself around a marked course, three laps against the clock.",
    story: [
      "Fans push air, not water, so a fan-driven hull drifts and overshoots. Holding a line takes continuous correction from real sensor feedback, not a fixed sequence of turns.",
      "I modeled the hull in SolidWorks and printed it in PLA, with two fans for thrust and steering. ArUco markers on the deck give the boat its position and an MPU6050 IMU its heading, and on the ESP32 a PID loop in C++ turns heading error into a difference in fan speed, with telemetry over MQTT for tuning.",
      "It passed all 12 waypoints in 6 minutes 14 seconds.",
    ],
    hero: {
      media: "pid-boat",
      alt: "The autonomous boat on a workbench beside a camera dome, with its wiring exposed, two ducted fans and a pair of ArUco markers.",
      position: "40% 50%",
    },
  },
  {
    slug: "irrigation-unit",
    title: "Irrigation Unit",
    disciplines: ["Embedded", "IoT"],
    year: 2024, // PLACEHOLDER: confirm year
    role: "Firmware, enclosure and data", // PLACEHOLDER: confirm your role
    links: [
      {
        label: "Report",
        href: "https://docs.google.com/document/d/1sU4bxtBoCIfGUtDNDLlD1KcnlDUy5ZFOu9Ud4wyGbrM/edit?tab=t.0",
      },
    ],
    summary: "A self-contained irrigation unit that waters from live soil readings instead of a timer.",
    story: [
      "An ESP32 reads soil moisture, temperature and humidity from a DHT22 and light from a photocell, doses 20 mL whenever moisture falls to 40%, and publishes every reading over MQTT at three-second intervals.",
      "I modeled the enclosure in SolidWorks so each board seats in its own pocket, with the photocell exposed through the open top.",
      "Across four environments over five days it logged more than 33,000 readings with 97.4% uptime, and the exported time series went straight back into tuning the threshold.",
    ],
    hero: {
      media: "irrigation-enclosure",
      alt: "Annotated SolidWorks render of the irrigation enclosure, with notes on the motor driver seat, motor fit, ESP32 and breadboard pockets, and the photocell opening.",
      position: "25% 50%",
    },
  },
]

/** "2025", or "Since 2025" for work that is still running. */
export const period = (p: Pick<Project, "year" | "ongoing">) => (p.ongoing ? `Since ${p.year}` : String(p.year))

export function getProject(slug: string) {
  const index = projects.findIndex((p) => p.slug === slug)
  if (index === -1) return undefined
  const at = (offset: number) => projects[(index + offset + projects.length) % projects.length]
  return { project: projects[index], prev: at(-1), next: at(1) }
}
