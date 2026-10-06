import { execSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL(".", import.meta.url))

// "Last updated" in the footer is the date of the commit being built, so it
// changes on every deploy without anyone editing it by hand.
function lastCommitDate() {
  try {
    return execSync("git log -1 --format=%cI", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim()
  } catch {
    return new Date().toISOString()
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_LAST_UPDATED: lastCommitDate(),
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false,
  // Pin the project root (a stray lockfile higher up the tree confuses inference).
  outputFileTracingRoot: root,
  turbopack: { root },
}

export default nextConfig
