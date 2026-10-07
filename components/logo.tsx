import { cx } from "@/lib/util"

// Logos for the companies and projects that have one. Each is white on a
// transparent ground. `wordmark` marks a logo that spells out its own name:
// it stands in for the name rather than sitting beside it, so the name isn't
// said twice.
export const LOGOS = {
  phasm: { wordmark: false },
  zebra: { wordmark: true },
} as const

export type LogoName = keyof typeof LOGOS

type Props = { name: LogoName; className?: string }

// Sized by height in CSS (.logo-*); the width follows the logo's own shape.
export function Logo({ name, className }: Props) {
  if (name === "phasm") {
    return (
      <svg
        viewBox="0 0 258 133"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
        className={cx("logo logo-phasm", className)}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M75.361 66.4991L119.014 41.5315C125.671 37.7234 132.328 37.7234 138.985 41.5315L182.638 66.4991L138.985 91.4667C132.328 95.2748 125.671 95.2748 119.014 91.4667L75.361 66.4991ZM102.792 66.4991L121.236 54.7927C126.412 51.5062 131.588 51.5062 136.764 54.7927L155.21 66.4991L136.764 78.2056C131.588 81.4921 126.412 81.4921 121.236 78.2056L102.792 66.4991Z"
        />
        <path d="M179.774 78.8669L257.098 131.977L149.923 91.5019L179.774 78.8669Z" />
        <path d="M0.436417 0.384644L108.104 41.1051L78.1819 53.7868L0.436417 0.384644Z" />
        <path d="M78.0224 78.696L107.69 91.4357L0.411667 132.017L78.0224 78.696Z" />
        <path d="M256.169 1.06393L180.053 53.7866L149.768 40.9052L256.169 1.06393Z" />
      </svg>
    )
  }
  return (
    <img
      src="/logos/zebra.png"
      width={198}
      height={64}
      alt=""
      decoding="async"
      className={cx("logo logo-zebra", className)}
    />
  )
}
