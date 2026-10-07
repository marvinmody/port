// About page, drawn from the résumé and rewritten for reading on a screen.
// Every fact appears once on the site: Phasm's story lives on its project
// page, so here it gets one line and a link. The phone number and SAT score
// stay on the résumé only.

import type { LogoName } from "@/components/logo"

export type Entry = {
  title: string
  /** Links the title, e.g. to a project page. */
  href?: string
  /** A logo beside the title, or in place of it if it spells the name. */
  logo?: LogoName
  /** Role and place: the quiet line under the title. */
  meta?: string
  detail?: string
  period?: string
}

type About = {
  intro: string
  experience: Entry[]
  leadership: Entry[]
  education: Entry[]
  recognition: Entry[]
  capabilities: { title: string; items: string[] }[]
  coursework: string[]
}

export const about: About = {
  intro:
    "I like problems where software has to answer to something physical: an airframe carrying a load, a defect that needs a root cause, a boat finding its own way around a course.",

  experience: [
    {
      title: "Phasm",
      href: "/work/phasm/",
      logo: "phasm",
      meta: "Co-founder, full-stack developer",
      detail: "Structural analysis for drone and UAV engineers.",
      period: "Since 2025",
    },
    {
      title: "Zebra Technologies",
      logo: "zebra",
      meta: "Supply chain engineer, Holtsville, NY",
      detail:
        "Built an agentic AI pipeline on Google Cloud that classifies root cause and severity in failure-analysis reports. Led a Lean Six Sigma kaizen that cut a weekly reporting run from three hours to one, saving 104 hours of labor a year, and turned input from three stakeholder groups into requirements and acceptance criteria.",
      period: "Summer 2026",
    },
  ],

  leadership: [
    {
      title: "Stevens Society of Artificial Intelligence",
      meta: "Founder, treasurer",
      detail:
        "Started the chapter and grew it to 180+ members in two semesters through workshops, speakers and hackathons, and gave technical talks at 3+ ML events on neural networks, regression and random forests.",
      period: "Since 2024",
    },
    {
      title: "Stevens Computer Science Club",
      meta: "Public relations chair, secretary",
      detail:
        "Organized the club’s first hackathon, 400+ attendees with ADP, Chubb, Databricks and AWS among the sponsors, and led 10+ workshops on AI, quantum computing and GitHub, averaging 50+ attendees with 89% retention.",
      period: "Since 2024",
    },
  ],

  education: [
    {
      title: "Stevens Institute of Technology",
      meta: "B.E. Computer Engineering, concentration in artificial intelligence",
      detail: "GPA 4.00. Lean Six Sigma Yellow Belt.",
      period: "Class of 2028",
    },
  ],

  recognition: [
    { title: "Two hackathon wins and the Launchpad@Stevens fellowship", meta: "With Phasm" },
    { title: "Top placement, IBM watsonx Orchestrate Hackathon", meta: "With better2gether" },
    { title: "Edwin A. Stevens Scholarship" },
    { title: "Presidential Scholarship" },
    { title: "NSF S-STEM Scholar", meta: "National Science Foundation" },
  ],

  capabilities: [
    { title: "Languages", items: ["Python", "TypeScript", "C++", "SQL", "Java", "MATLAB"] },
    { title: "AI and ML", items: ["LLM APIs", "Agentic workflows", "TensorFlow", "OpenCV", "Point-cloud segmentation"] },
    { title: "Web and cloud", items: ["Next.js", "React", "FastAPI", "Supabase", "Firebase", "Docker", "Google Cloud"] },
    { title: "Hardware and tools", items: ["ESP32", "MQTT", "PID control", "SolidWorks", "CalculiX", "Qt 6", "Figma"] },
  ],

  coursework: [
    "AI engineering and machine learning",
    "Data structures and algorithms",
    "Microprocessor systems",
    "Data acquisition systems",
    "Digital image processing",
    "Linear algebra",
    "Probability and statistics",
  ],
}
