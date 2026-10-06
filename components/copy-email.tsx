"use client"

import { useEffect, useRef, useState } from "react"

const legacyCopy = (text: string) => {
  const field = document.createElement("textarea")
  field.value = text
  field.setAttribute("readonly", "")
  field.style.position = "fixed"
  field.style.opacity = "0"
  document.body.appendChild(field)
  field.select()
  let ok = false
  try {
    ok = document.execCommand("copy")
  } catch {}
  field.remove()
  return ok
}

// The address in full; clicking copies it. The hint beneath rolls over to
// "Copied" for 1.6s and the change is announced to screen readers.
export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    let ok = false
    try {
      await navigator.clipboard.writeText(email)
      ok = true
    } catch {
      ok = legacyCopy(email)
    }
    if (!ok) {
      window.location.href = `mailto:${email}`
      return
    }
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div>
      <button
        type="button"
        onClick={copy}
        aria-describedby="copy-hint"
        className="copy display break-all text-left"
      >
        {email}
      </button>
      <span id="copy-hint" className="sr-only">
        Copies the address to your clipboard
      </span>
      <p className="label mt-1 text-grey" aria-hidden="true">
        <span className="swap" data-on={copied || undefined}>
          <span>
            <span className="[@media(hover:none)]:hidden">Click to copy</span>
            <span className="hidden [@media(hover:none)]:inline">Tap to copy</span>
          </span>
          <span className="text-fg">Copied to clipboard</span>
        </span>
      </p>
      <p className="sr-only" aria-live="polite">
        {copied ? "Email address copied to clipboard" : ""}
      </p>
    </div>
  )
}
