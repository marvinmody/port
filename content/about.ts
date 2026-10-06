// About page, drawn from the résumé. Rewritten for reading on a screen rather
// than copied: each entry leads with what was built and what it changed.
// The phone number and SAT score stay on the résumé only.

export type Entry = {
  title: string
  /** Role, place: the grey line under the title. */
  meta?: string
  detail?: string
  period?: string
}

type About = {
  intro: string
  figures: { value: string; label: string }[]
  experience: Entry[]
  leadership: Entry[]
  education: Entry[]
  recognition: Entry[]
  capabilities: { title: string; items: string[] }[]
  coursework: string[]
}

export const about: About = {
  intro:
    "I’m a computer engineer at Stevens and the co-founder of Phasm. I like problems where software has to answer to something physical: an airframe carrying a load, a defect that needs a root cause, a boat finding its own way around a course.",

  figures: [
    { value: "4.00", label: "GPA, Computer Engineering" },
    { value: "$13K", label: "Equity-free funding secured for Phasm" },
    { value: "180+", label: "Members in the AI society I founded" },
    { value: "67%", label: "Shorter weekly reporting cycle at Zebra" },
  ],

  experience: [
    {
      title: "Phasm",
      meta: "Co-founder, full-stack developer · Launchpad@Stevens",
      detail:
        "Structural analysis for drone and UAV engineers. I built the finite-element pipeline, from LLM-proposed load cases to automated meshing and CalculiX solves, a point-cloud model that places loads on the airframe, and the FastAPI backend behind a C++ and Qt 6 desktop client.",
      period: "2025–Now",
    },
    {
      title: "Zebra Technologies",
      meta: "Supply chain engineer · Holtsville, NY",
      detail:
        "Built an agentic AI pipeline on Google Cloud that classifies root cause and severity in failure-analysis reports. Led a Lean Six Sigma kaizen that cut a weekly reporting run from three hours to one, saving 104 hours of labor a year, and turned input from three stakeholder groups into requirements and acceptance criteria.",
      period: "2026",
    },
  ],

  leadership: [
    {
      title: "Stevens Society of Artificial Intelligence",
      meta: "Founder, treasurer",
      detail:
        "Started the chapter and grew it to 180+ members in two semesters through workshops, speakers and hackathons, and gave technical talks at 3+ ML events on neural networks, regression and random forests.",
      period: "2024–Now",
    },
    {
      title: "Stevens Computer Science Club",
      meta: "Public relations chair, secretary",
      detail:
        "Organized the club’s first hackathon, 400+ attendees with ADP, Chubb, Databricks and AWS among the sponsors, and led 10+ workshops on AI, quantum computing and GitHub, averaging 50+ attendees with 89% retention.",
      period: "2024–Now",
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
    { title: "Launchpad@Stevens fellowship", meta: "One of a 20-person cohort, with Phasm" },
    { title: "Two hackathon wins", meta: "With Phasm" },
    { title: "Top placement, IBM watsonx Orchestrate Hackathon", meta: "TechXchange 2025, with better2gether" },
    { title: "Edwin A. Stevens Scholarship", meta: "Stevens Institute of Technology" },
    { title: "Presidential Scholarship", meta: "Stevens Institute of Technology" },
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
