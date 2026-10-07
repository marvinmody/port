"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import { bus, NAVIGATE } from "@/lib/bus"
import { takeDrift } from "@/lib/drift"
import { onTick, whenIdle } from "@/lib/ticker"

// The stars behind every page: one WebGL point cloud seen in perspective.
// Each star drifts on its own; scrolling moves the camera (near stars pass
// faster than far ones), downwards or, on a page that moves sideways,
// sideways, and so does the Work row as it slides; the pointer leans it a
// little; and every page change carries you a short way forward through the
// field. On the home page the pointer also
// bends the light around it, like a small mass in front of the sky.

const VERTEX = /* glsl */ `
attribute vec4 a_seed; // xy: place on the far plane (-1..1); z: depth phase (0..1); w: random
attribute vec4 a_rand;

uniform vec2 u_view;
uniform float u_dpr;
uniform float u_time;
uniform float u_travel;
uniform vec2 u_offset;
uniform float u_streak;
uniform float u_bright;
uniform vec3 u_lens; // xy: the pointer in clip space; z: strength, 0..1

varying float v_alpha;
varying float v_size;
varying float v_stretch;
varying vec3 v_tint;

vec2 hash2(float n) {
  return fract(sin(vec2(n, n + 1.7317)) * vec2(43758.5453, 22578.1459));
}

void main() {
  // Depth runs from 1 (the far plane) to 0 (right in front of you). Travel
  // brings every star closer; one that passes you returns to the far plane
  // somewhere new.
  float phase = a_seed.z - u_travel;
  float cycle = floor(phase);
  float z = phase - cycle;
  float depth = mix(0.1, 1.0, z);
  float near = 1.0 - z;

  vec2 p = a_seed.xy;
  if (cycle < -0.5) p = hash2(a_seed.w * 97.13 + cycle * 17.31) * 2.0 - 1.0;

  float aspect = u_view.x / u_view.y;
  vec2 span = vec2(aspect, 1.0) * 1.1;
  vec2 w = p * span;
  w += vec2(
    sin(u_time * (0.11 + 0.17 * a_rand.z) + a_rand.w * 6.2832),
    cos(u_time * (0.09 + 0.15 * a_rand.x) + a_rand.y * 6.2832)
  ) * 0.006;
  // The camera offset, wrapped so the field never runs out.
  w -= u_offset;
  w = mod(w + span, 2.0 * span) - span;

  vec2 ndc = w / depth;
  ndc.x /= aspect;

  // Gravitational lensing, loosely: light from stars behind the pointer is
  // pushed outward, hardest inside a small ring, fading to nothing a short way
  // off. Measured in screen units so the ring stays round.
  vec2 off = (ndc - u_lens.xy) * vec2(aspect, 1.0);
  float r = max(length(off), 0.0001);
  float ring = 0.065;
  float bend = u_lens.z * ring * ring / max(r, ring) * (1.0 - smoothstep(0.24, 0.5, r));
  ndc += off / r * bend / vec2(aspect, 1.0);

  gl_Position = vec4(ndc, 0.0, 1.0);

  float size = min(mix(1.0, 2.1, a_rand.x) / pow(depth, 0.9), 7.0);
  float twinkle = 0.86 + 0.14 * sin(u_time * (0.5 + 1.6 * a_rand.y) + a_rand.z * 6.2832);
  float alpha = mix(0.78, 1.0, near) * twinkle * u_bright;
  // Fade in on the far plane and out before a star gets close enough to pop.
  alpha *= smoothstep(1.0, 0.86, z) * smoothstep(0.0, 0.12, z);

  // Below ~1.25 device pixels a point shimmers: hold the size and fade instead.
  float px = size * u_dpr;
  alpha *= clamp(px / 1.25, 0.4, 1.0);
  px = max(px, 1.25);

  // Fast scrolling draws the nearest stars out a little, like a long exposure.
  float stretch = 1.0 + u_streak * near * near * 2.5;
  gl_PointSize = px * stretch;

  v_alpha = alpha;
  v_size = px;
  v_stretch = stretch;
  v_tint = mix(vec3(1.0), mix(vec3(0.78, 0.85, 1.0), vec3(1.0, 0.92, 0.82), a_rand.w), 0.15 + 0.3 * z);
}
`

const FRAGMENT = /* glsl */ `
precision mediump float;

uniform float u_axis; // 0: streak along y (scrolling down); 1: along x (sideways)

varying float v_alpha;
varying float v_size;
varying float v_stretch;
varying vec3 v_tint;

void main() {
  vec2 q = (gl_PointCoord - 0.5) * 2.0;
  // The sprite is stretch times the dot; squeeze the other axis back.
  if (u_axis > 0.5) q.y *= v_stretch;
  else q.x *= v_stretch;
  float r = length(q);
  // About a pixel of soft edge: small stars stay solid, large ones stay crisp.
  float edge = clamp(1.6 / v_size, 0.18, 0.6);
  float a = (1.0 - smoothstep(1.0 - edge, 1.0, r)) * (1.0 - r * r * 0.3) * v_alpha;
  if (a < 0.003) discard;
  gl_FragColor = vec4(v_tint, a);
}
`

/** Forward drift, in depth cycles per second: a star takes minutes to pass. */
const DRIFT = 0.0035
/** How far one page change carries you. */
const WARP = 0.05
/** Camera travel per viewport scrolled, in far-plane units: far stars move at
 *  5% of the page, the nearest at about half. */
const PARALLAX = 0.1
/** How far the pointer leans the camera. */
const LEAN = 0.025
/** Stars are points: past 1.5× the extra pixels cost fill rate and add nothing. */
const MAX_DPR = 1.5

// Full on the home page, quieter behind reading.
const brightnessFor = (path: string) => (path === "/" ? 1 : 0.6)
// The lens belongs to the home page, where the stars are the whole picture.
const lensFor = (path: string) => (path === "/" ? 1 : 0)

type Field = { warp(): void; page(path: string): void }

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader
  console.warn("Starfield:", gl.getShaderInfoLog(shader))
  gl.deleteShader(shader)
  return null
}

// Builds the field on a canvas. Returns null without WebGL; the page keeps
// its plain black ground.
function createField(canvas: HTMLCanvasElement, still: boolean): (Field & { destroy(): void }) | null {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  })
  if (!gl || gl.isContextLost()) return null

  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT)
  const program = gl.createProgram()
  if (!vertex || !fragment || !program) return null
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("Starfield:", gl.getProgramInfoLog(program))
    return null
  }
  gl.useProgram(program)

  // Roughly one star per 3,600 px², so a phone and a wide monitor look
  // equally dense. About half are in view at any moment.
  const count = Math.round(Math.min(Math.max((window.innerWidth * window.innerHeight) / 3600, 160), 480))
  const data = new Float32Array(count * 8)
  for (let i = 0; i < data.length; i++) data[i] = Math.random()
  for (let i = 0; i < count; i++) {
    data[i * 8] = data[i * 8] * 2 - 1
    data[i * 8 + 1] = data[i * 8 + 1] * 2 - 1
  }
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
  const seed = gl.getAttribLocation(program, "a_seed")
  const rand = gl.getAttribLocation(program, "a_rand")
  gl.enableVertexAttribArray(seed)
  gl.vertexAttribPointer(seed, 4, gl.FLOAT, false, 32, 0)
  gl.enableVertexAttribArray(rand)
  gl.vertexAttribPointer(rand, 4, gl.FLOAT, false, 32, 16)

  const u = (name: string) => gl.getUniformLocation(program, name)
  const uView = u("u_view")
  const uDpr = u("u_dpr")
  const uTime = u("u_time")
  const uTravel = u("u_travel")
  const uOffset = u("u_offset")
  const uStreak = u("u_streak")
  const uBright = u("u_bright")
  const uLens = u("u_lens")
  const uAxis = u("u_axis")

  gl.clearColor(0, 0, 0, 1)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE)

  let time = 0
  let last = 0
  let lastDraw = 0
  let travel = 0
  // The field glides forward once as it fades in.
  let travelTo = still ? 0 : WARP
  let travelSpeed = 0
  let lastWarp = performance.now()
  let bright = still ? brightnessFor(window.location.pathname) : 0
  let brightTo = brightnessFor(window.location.pathname)
  let leanX = 0
  let leanY = 0
  let leanToX = 0
  let leanToY = 0
  let pointerIn = false
  let lensX = 0
  let lensY = 0
  let lens = 0
  let lensTo = lensFor(window.location.pathname)
  let shiftX = 0
  let shiftY = 0
  let axis = 0
  let lastScroll = window.scrollY
  let streak = 0
  let stopTick: (() => void) | null = null

  const draw = () => {
    gl.uniform1f(uTime, time)
    gl.uniform1f(uTravel, travel)
    gl.uniform2f(uOffset, leanX * LEAN + shiftX, leanY * LEAN - shiftY)
    gl.uniform1f(uStreak, streak)
    gl.uniform1f(uBright, bright)
    gl.uniform3f(uLens, lensX, lensY, lens)
    gl.uniform1f(uAxis, axis)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.POINTS, 0, count)
  }

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    const width = Math.max(1, Math.round(canvas.clientWidth * dpr))
    const height = Math.max(1, Math.round(canvas.clientHeight * dpr))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
    gl.viewport(0, 0, width, height)
    gl.uniform2f(uView, width, height)
    gl.uniform1f(uDpr, dpr)
    if (still) draw()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  resize()

  // Runs on the shared ticker, after Lenis has moved the page this frame.
  const frame = (now: number) => {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60
    last = now
    time += dt
    const ease = (rate: number) => 1 - Math.exp(-dt * rate)

    // Forward travel follows its target on a critically damped spring, so a
    // warp eases in and out instead of starting with a jolt.
    travelTo += DRIFT * dt
    const omega = 3.2
    travelSpeed += (omega * omega * (travelTo - travel) - 2 * omega * travelSpeed) * dt
    travel += travelSpeed * dt

    leanX += (leanToX - leanX) * ease(2.2)
    leanY += (leanToY - leanY) * ease(2.2)
    bright += (brightTo - bright) * ease(1.4)
    // The lens follows the pointer closely and fades in and out gently.
    const lensWas = lens + lensX + lensY
    lensX += (leanToX - lensX) * ease(9)
    lensY += (leanToY - lensY) * ease(9)
    lens += ((pointerIn ? lensTo : 0) - lens) * ease(3)

    // Scroll moves the camera: down a page that reads downwards, sideways on
    // a rail, so the stars travel with the content. A jump of more than a
    // quarter screen in one frame is a teleport (a new page), not motion.
    const sideways = document.documentElement.dataset.flow === "horizontal"
    axis = sideways ? 1 : 0
    const y = window.scrollY
    let dy = y - lastScroll
    lastScroll = y
    if (Math.abs(dy) > window.innerHeight * 0.25) dy = 0
    if (sideways) shiftX += (dy / window.innerHeight) * PARALLAX
    else shiftY += (dy / window.innerHeight) * PARALLAX
    // Content that moves sideways without scrolling (the Work row) carries
    // the camera the same way, at the same rate.
    let dx = takeDrift()
    if (Math.abs(dx) > window.innerWidth * 0.5) dx = 0
    if (dx) {
      shiftX += (dx / window.innerHeight) * PARALLAX
      axis = 1
    }
    const speed = (Math.abs(dy) + Math.abs(dx)) / dt / window.innerHeight
    streak += (Math.min(speed / 3, 1) - streak) * ease(8)

    // With only the slow drift moving, every other frame is plenty: half the
    // GPU work and no visible difference. Scrolling, warps, the pointer and
    // brightness changes always get every frame.
    const busy =
      dy !== 0 ||
      dx !== 0 ||
      streak > 0.01 ||
      Math.abs(travelSpeed - DRIFT) > 0.002 ||
      Math.abs(leanToX - leanX) + Math.abs(leanToY - leanY) > 0.002 ||
      Math.abs(lens + lensX + lensY - lensWas) > 0.0005 ||
      Math.abs(brightTo - bright) > 0.004
    if (!busy && now - lastDraw < 30) return
    lastDraw = now
    draw()
    if (!canvas.dataset.ready) canvas.dataset.ready = ""
  }

  const onPointer = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return
    pointerIn = true
    leanToX = (event.clientX / window.innerWidth) * 2 - 1
    leanToY = -((event.clientY / window.innerHeight) * 2 - 1)
  }
  const onLeave = () => {
    pointerIn = false
    leanToX = 0
    leanToY = 0
  }

  if (still) {
    draw()
    canvas.dataset.ready = ""
  } else {
    stopTick = onTick(frame, 1)
    window.addEventListener("pointermove", onPointer, { passive: true })
    document.documentElement.addEventListener("pointerleave", onLeave)
  }

  return {
    warp() {
      const now = performance.now()
      // The click and the arrival both announce the same page change.
      if (still || now - lastWarp < 800) return
      lastWarp = now
      travelTo += WARP
    },
    page(path) {
      brightTo = brightnessFor(path)
      lensTo = lensFor(path)
      if (still) {
        bright = brightTo
        draw()
      }
    },
    destroy() {
      stopTick?.()
      observer.disconnect()
      window.removeEventListener("pointermove", onPointer)
      document.documentElement.removeEventListener("pointerleave", onLeave)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)
    },
  }
}

export function Starfield() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const field = useRef<Field | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const element = canvas.current
    if (!element) return
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let current: ReturnType<typeof createField> = null
    // Compiling shaders can take a few frames on some GPUs: wait until the
    // page has hydrated and gone quiet. The canvas fades in, so it's unseen.
    const cancelIdle = whenIdle(() => {
      current = createField(element, still)
      field.current = current
    })

    const warp = () => field.current?.warp()
    bus?.addEventListener(NAVIGATE, warp)

    // A lost GPU context (driver reset, too many tabs) is rebuilt when the
    // browser hands it back.
    const onLost = (event: Event) => {
      event.preventDefault()
      current?.destroy()
      current = null
      field.current = null
    }
    const onRestored = () => {
      current = createField(element, still)
      field.current = current
    }
    element.addEventListener("webglcontextlost", onLost)
    element.addEventListener("webglcontextrestored", onRestored)

    return () => {
      cancelIdle()
      bus?.removeEventListener(NAVIGATE, warp)
      element.removeEventListener("webglcontextlost", onLost)
      element.removeEventListener("webglcontextrestored", onRestored)
      current?.destroy()
      field.current = null
    }
  }, [])

  // Every page change: travel forward, and settle into that page's sky.
  useEffect(() => {
    field.current?.page(pathname.replace(/(.)\/$/, "$1"))
    field.current?.warp()
  }, [pathname])

  return <canvas ref={canvas} className="starfield" aria-hidden="true" />
}
