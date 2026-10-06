// The work. Order here is the order on the site. Facts come from the résumé,
// the previous site's project notes and the images in media-src/. The
// narrative copy is drafted from those: read it once for accuracy, and confirm
// every field marked PLACEHOLDER.

export type Image = {
  /** File name in media-src/, without the extension. */
  media: string
  alt: string
  /** object-position when the image is cropped to fill. */
  position?: string
}

export type Section = "context" | "problem" | "approach" | "outcome"

export type Project = {
  slug: string
  title: string
  client: string
  /** Shown beside the title on the Work page. */
  disciplines: string[]
  year: number
  /** Still running: the year reads "2025–Now". */
  ongoing?: boolean
  summary: string
  role: string
  team: string
  deliverables: string[]
  links: { label: string; href: string }[]
  hero: Image
  context: string[]
  problem: string[]
  approach: string[]
  outcome: string[]
  /** One to three measurable results. */
  results: { value: string; label: string }[]
  /** Extra images, shown after the section they belong to. */
  images?: Partial<Record<Section, Image>>
}

export const projects: Project[] = [
  {
    slug: "phasm",
    title: "Phasm",
    client: "Own company",
    disciplines: ["AI", "Simulation"],
    year: 2025,
    ongoing: true,
    summary:
      "Structural analysis for drone and UAV engineers. Phasm segments an airframe, proposes its load cases and runs the finite-element solve, end to end.",
    role: "Co-founder, full-stack developer",
    team: "Founding team", // PLACEHOLDER: number of co-founders
    deliverables: ["FEA pipeline", "Point-cloud segmentation", "FastAPI backend"],
    links: [], // PLACEHOLDER: add the Phasm site when there is one
    hero: {
      media: "phasm-airframe",
      alt: "Illustration: a quadcopter airframe seen from above as a finite-element mesh, shaded brightest where the arms meet the body and stress is highest.",
    },
    context: [
      "Phasm is a startup I co-founded in October 2025. It was selected for Launchpad@Stevens, a 20-person innovation fellowship with more than 75 mentors.",
    ],
    problem: [
      "Finite-element analysis is how you find out whether an airframe will hold. Setting one up is specialist work: choosing load cases, meshing the geometry, configuring a solver and reading the result. Phasm puts that whole chain inside the design loop.",
    ],
    approach: [
      "A point-cloud model segments the airframe into arms, landing gear and props, so loads go where they physically act. An LLM proposes the load cases; the pipeline meshes the geometry, runs static and transient solves in CalculiX and renders the stress field in 3D.",
      "I built the Python FastAPI backend behind the team’s C++ and Qt 6 desktop client, with Supabase for auth and storage and the solvers in Docker.",
    ],
    outcome: [
      "Phasm has won two hackathons and secured $13,000 in equity-free funding.",
    ],
    results: [
      { value: "2", label: "Hackathon wins" },
      { value: "$13K", label: "Equity-free funding" },
      { value: "75+", label: "Mentors through Launchpad@Stevens" },
    ],
  },
  {
    slug: "better2gether",
    title: "better2gether",
    client: "IBM TechXchange",
    disciplines: ["AI", "Web"],
    year: 2025,
    summary:
      "A team of AI agents on IBM watsonx Orchestrate that scouts infrastructure opportunities, models ROI and assesses equity in one workflow.",
    role: "Agent workflow and front end", // PLACEHOLDER: confirm your role
    team: "Hackathon team", // PLACEHOLDER: team size
    deliverables: ["Agent workflow", "Web interface"],
    links: [{ label: "Source", href: "https://github.com/marvinmody/better2gether" }],
    hero: {
      media: "b2g-landing",
      alt: "better2gether landing page with the headline “Infrastructure Intelligence, Rewired”, a line about agents that scout opportunities and model ROI, and “Powered by IBM watsonx Orchestrate”.",
      position: "50% 45%",
    },
    context: [
      "better2gether was built for the IBM watsonx Orchestrate Hackathon at IBM TechXchange 2025. It points a team of AI agents at infrastructure planning.",
    ],
    problem: [
      "Deciding whether an infrastructure project is worth funding means finding the opportunity, modeling its return and checking who it actually serves. Those steps usually live in separate tools, owned by different people.",
    ],
    approach: [
      "I split the work into agents with one job each: one scouts opportunities, one models return on investment, one assesses equity, and a final step assembles an export-ready brief. watsonx Orchestrate runs them as a single workflow behind one interface.",
    ],
    outcome: ["better2gether took top placement at the hackathon."],
    results: [{ value: "4", label: "Steps in one orchestrated workflow: scout, model, assess, export" }],
    images: {
      approach: { media: "b2g-mark", alt: "The b2g monogram in white on deep navy." },
    },
  },
  {
    slug: "synapse",
    title: "Synapse",
    client: "Independent", // PLACEHOLDER: confirm (the model repo is shared with a collaborator)
    disciplines: ["AI", "Health"],
    year: 2025, // PLACEHOLDER: confirm year
    summary:
      "A symptom logger with a computer-vision model for skin conditions and an AI assistant that prepares entries for review.",
    role: "Machine learning and front end", // PLACEHOLDER: confirm your role
    team: "Two", // PLACEHOLDER: team size
    deliverables: ["Vision model", "Web app", "Review dashboard"],
    links: [
      { label: "Live", href: "https://synapsehealth.vercel.app/" },
      { label: "Model", href: "https://github.com/snigito/SkincareModel" },
    ],
    hero: {
      media: "synapse-dashboard",
      alt: "Synapse dashboard introducing Dr. Baylor, an AI health companion for tracking symptoms, above cards for symptom journaling, AI analysis, data visualization and historical tracking.",
      position: "50% 30%",
    },
    context: [
      "Synapse is a health companion for tracking symptoms over time. Patients journal what they notice, and an assistant called Dr. Baylor turns those entries into a history, charts and analysis.",
    ],
    problem: [
      "Skin symptoms are hard to put into words, and a long log is slow to review by hand. The tool had to read photos as well as text, and surface what matters before a clinician opens the file.",
    ],
    approach: [
      "I trained a TensorFlow vision model on more than 18,000 dermatology images to classify skin symptoms from photos, with OpenCV handling preprocessing. The Gemini API adds real-time visual analysis to each entry.",
      "The app is React and Tailwind on a Supabase database, with separate views for logging, history, visualization and skin analysis.",
    ],
    outcome: ["The classifier reached 98% accuracy, and automated symptom insights made clinical review 35% faster."],
    results: [
      { value: "98%", label: "Classification accuracy across 18,000+ images" },
      { value: "35%", label: "Faster clinical review" },
    ],
  },
  {
    slug: "paev",
    title: "Paev",
    client: "Independent",
    disciplines: ["AI", "Finance"],
    year: 2025, // PLACEHOLDER: confirm year
    summary: "A stock-signal dashboard with an AI assistant, refreshed every four hours from live market data.",
    role: "Full stack and AI", // PLACEHOLDER: confirm your role
    team: "Solo", // PLACEHOLDER: confirm
    deliverables: ["Web app", "Data pipeline", "AI assistant"],
    links: [{ label: "Live", href: "https://paev.vercel.app/" }],
    hero: {
      media: "paev-dashboard",
      alt: "Paev dashboard: “AI-Powered Stock Trading Signals”, tabs for Hot Picks and Value Opportunities, three Buy cards for AAPL, MSFT and GOOGL with prices and rationales, and a “Chat with Jordy?” button.",
    },
    context: [
      "Paev publishes a short list of stock signals for retail investors, split into Hot Picks and Value Opportunities. Each signal carries a price, a call and a plain-language rationale.",
    ],
    problem: [
      "Market data goes stale within hours, and a number on its own doesn’t explain itself. The product had to stay current without anyone updating it by hand, and answer follow-up questions in plain language.",
    ],
    approach: [
      "A Python pipeline pulls quotes from the Finnhub API every four hours and runs them through agentic tools that draft each signal and its reasoning. A Next.js front end renders the result.",
      "For questions the cards don’t answer, an assistant called Jordy works from the same data in chat.",
    ],
    outcome: ["Signals refresh on a fixed four-hour cycle without a manual step, and every pick arrives with the reasoning behind it."],
    results: [{ value: "4 h", label: "Refresh cycle for market data from Finnhub" }],
    images: {
      approach: { media: "paev-wordmark", alt: "The paev wordmark in white on black." },
    },
  },
  {
    slug: "pid-boat",
    title: "PID Boat",
    client: "Stevens Institute", // PLACEHOLDER: confirm (course project?)
    disciplines: ["Embedded", "Controls"],
    year: 2024, // PLACEHOLDER: confirm year
    summary: "An autonomous fan-driven boat that runs a marked course using ArUco markers and PID heading control.",
    role: "Controls, firmware and hull", // PLACEHOLDER: confirm your role
    team: "Course team", // PLACEHOLDER: team size
    deliverables: ["Hull, SolidWorks and PLA", "ESP32 firmware", "PID controller"],
    links: [
      {
        label: "Report",
        href: "https://docs.google.com/document/d/1ofeTOQ3B0zJh07dTKtYsdTawKFKTSO825JYqsHb2Jnc/edit?tab=t.0",
      },
    ],
    hero: {
      media: "pid-boat",
      alt: "The autonomous boat on a workbench beside a camera dome, with its wiring exposed, two ducted fans and a pair of ArUco markers.",
      position: "40% 50%",
    },
    context: [
      "The task: a small boat that completes three laps of a marked course on its own, passing every waypoint in order, against the clock.",
    ],
    problem: [
      "Fans push air, not water, so a fan-driven hull drifts and overshoots. Holding a line takes continuous correction from real sensor feedback, not a fixed sequence of turns.",
    ],
    approach: [
      "I modeled the hull in SolidWorks and printed it in PLA, with two fans for thrust and steering. ArUco markers on the deck give the system the boat’s position, and the ESP32 combines it with heading from an MPU6050 IMU.",
      "A PID loop in C++ turns heading error into a difference in fan speed, with telemetry over MQTT for tuning.",
    ],
    outcome: ["The boat completed all three laps and passed 12 of 12 waypoints in 6 minutes 14 seconds."],
    results: [
      { value: "12/12", label: "Waypoints passed over three laps" },
      { value: "6:14", label: "Course time, minutes and seconds" },
    ],
  },
  {
    slug: "irrigation-unit",
    title: "Irrigation Unit",
    client: "Stevens Institute", // PLACEHOLDER: confirm (course project?)
    disciplines: ["Embedded", "IoT"],
    year: 2024, // PLACEHOLDER: confirm year
    summary: "A sensor-driven irrigation unit on an ESP32 that doses 20 mL whenever soil moisture falls to 40%.",
    role: "Firmware, enclosure and data", // PLACEHOLDER: confirm your role
    team: "Course team", // PLACEHOLDER: team size
    deliverables: ["Enclosure, SolidWorks", "ESP32 firmware", "Telemetry dataset"],
    links: [
      {
        label: "Report",
        href: "https://docs.google.com/document/d/1sU4bxtBoCIfGUtDNDLlD1KcnlDUy5ZFOu9Ud4wyGbrM/edit?tab=t.0",
      },
    ],
    hero: {
      media: "irrigation-enclosure",
      alt: "Annotated SolidWorks render of the irrigation enclosure, with notes on the motor driver seat, motor fit, ESP32 and breadboard pockets, and the photocell opening.",
      position: "25% 50%",
    },
    context: [
      "An environmental irrigation unit: a self-contained enclosure that waters a plant on its own and records the conditions around it.",
    ],
    problem: [
      "Watering on a timer ignores what the soil actually needs. The unit had to decide from live readings, then show that those decisions held up in different environments.",
    ],
    approach: [
      "An ESP32 reads soil moisture, temperature and humidity from a DHT22, and light from a photocell, and drives the pump motor through a motor driver. Every reading goes out over MQTT at three-second intervals.",
      "I modeled the enclosure in SolidWorks so each board seats in its own pocket, with the photocell exposed through the open top.",
    ],
    outcome: [
      "Across four environments over five days, the unit logged more than 33,000 readings with 97.4% uptime. The exported time series went straight back into tuning the threshold.",
    ],
    results: [
      { value: "97.4%", label: "Uptime over five days" },
      { value: "33,000+", label: "Readings at three-second intervals" },
      { value: "20 mL", label: "Dose at 40% soil moisture" },
    ],
  },
]

/** "2025", or "2025–Now" for work that is still running. */
export const period = (p: Pick<Project, "year" | "ongoing">) => (p.ongoing ? `${p.year}–Now` : String(p.year))

export function getProject(slug: string) {
  const index = projects.findIndex((p) => p.slug === slug)
  if (index === -1) return undefined
  return { project: projects[index], index, next: projects[(index + 1) % projects.length] }
}
