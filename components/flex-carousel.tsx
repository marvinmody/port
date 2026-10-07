"use client"

// FlexCarousel, adapted from React Bits (reactbits.dev, MIT). A row of images
// seen through a pane of glass that is never drawn: where the row crosses the
// glass's edge it bends and the light splits a little, and when the row moves
// fast the glass stretches like a liquid and the cards draw in. The row
// loops. Scroll, drag or click to move it.
//
// Made to fit this site: it runs on the shared ticker (lib/ticker.ts) and
// reports its motion, so the stars can follow it in the same frame; it draws
// <img> elements already on the page, so the browser picks each file and the
// image is cached when it carries over to a project page; each card shows
// its whole image, as the project page does, so the two match exactly as it
// travels; every card's size is known before anything loads; one card can be held back, undrawn, while
// a page transition carries its image in or out; and a mouse wheel always
// moves at least one card. Captions live outside it
// (components/work-carousel.tsx).

import { Mesh, Plane, Program, Renderer, RenderTarget, Texture, Triangle } from "ogl"
import { forwardRef, useEffect, useImperativeHandle, useRef, type CSSProperties } from "react"
import { onTick } from "@/lib/ticker"

type Curl = "twist" | "rise" | "fall"

type Lens = {
  /** Width of the glass, as a share of the container's width. */
  lensWidth: number
  /** Height of the glass, also as a share of the width, so it keeps its shape. */
  lensHeight: number
  /** Rotation of the glass in degrees: where its edge crosses the row. */
  tilt: number
  /** From a rounded rectangle (0) to an ellipse (1). */
  roundness: number
  /** How far the row flexes at the edge of the glass. */
  bend: number
  /** Width of the curved edge: small is a tight kink, large a long bend. */
  reach: number
  /** Which way the ends flex: twist (left down, right up), rise or fall. */
  curl: Curl
  /** Rainbow splitting of light, only where the edge bends the images. */
  dispersion: number
  /** How much the glass stretches and wobbles when the row moves. */
  liquid: number
  /** The glass drifts after the cursor like a loupe. */
  followCursor: boolean
}

const BEND_PRESETS = {
  liquid: {
    lensWidth: 0.74,
    lensHeight: 1.18,
    tilt: 62,
    roundness: 1,
    bend: 0.34,
    reach: 0.38,
    curl: "twist",
    dispersion: 0.45,
    liquid: 0,
    followCursor: false,
  },
  ribbon: {
    lensWidth: 0.8,
    lensHeight: 0.8,
    tilt: 0,
    roundness: 1,
    bend: 0.34,
    reach: 0.34,
    curl: "twist",
    dispersion: 0.4,
    liquid: 0,
    followCursor: false,
  },
  vortex: {
    lensWidth: 0.7,
    lensHeight: 0.95,
    tilt: 30,
    roundness: 1,
    bend: 0.46,
    reach: 0.3,
    curl: "twist",
    dispersion: 0.5,
    liquid: 0,
    followCursor: false,
  },
  arch: {
    lensWidth: 0.8,
    lensHeight: 0.8,
    tilt: 0,
    roundness: 1,
    bend: 0.3,
    reach: 0.36,
    curl: "rise",
    dispersion: 0.4,
    liquid: 0,
    followCursor: false,
  },
} satisfies Record<string, Lens>

export type Preset = keyof typeof BEND_PRESETS
/** Rise lifts the cards in from below, bloom fades them in as the bend
 *  forms, spin lands a fast flick, deal spreads them from the middle. */
export type Intro = "rise" | "bloom" | "spin" | "deal" | "none"
/** Natural keeps each image whole; the others crop every card to one shape. */
type Fit = "natural" | "portrait" | "square" | "landscape"

export type FlexItem = {
  /** An <img> on the page, loaded or still loading. */
  image: HTMLImageElement
  /** Width over height, known before the image loads, so nothing moves when it does. */
  aspect: number
  /** Shown in the card's place until the image is in (#rrggbb). */
  color?: string
}

export type FlexRect = { x: number; y: number; width: number; height: number }

export type FlexHandle = {
  /** Moves `delta` cards along. */
  step(delta: number): void
  /** Brings card `index` to the middle. */
  goTo(index: number): void
  /** Opens card `index`: the others part, the bend melts away and it grows. */
  open(index: number): void
  /** Stops the row and the drawing of card `index`; returns where it was, in
   *  the container's coordinates. */
  hold(index: number): FlexRect | null
  /** Draws the held card again, from this frame on. */
  release(): void
  /** Handles a wheel event from outside the container. */
  wheel(event: WheelEvent): void
}

type Settings = Lens & {
  intro: Intro
  fit: Fit
  cardHeight: number
  cardWidth: number
  gap: number
  radius: number
  squeeze: number
}

type Props = Partial<Lens> & {
  /** Read once, when the carousel mounts. */
  items: FlexItem[]
  preset?: Preset
  intro?: Intro
  fit?: Fit
  /** Card height as a share of the container's height. */
  cardHeight?: number
  /** The most of the container's width the widest card may take (see cardHeightFor). */
  cardWidth?: number
  /** Space between cards, in px. */
  gap?: number
  /** Corner radius of the cards, in px. */
  radius?: number
  /** How much the cards shrink while the row moves fast. */
  squeeze?: number
  /** The card in the middle to begin with. */
  initial?: number
  /** A card to leave undrawn until release(). */
  held?: number
  /** A different card has reached the middle. */
  onChange?: (index: number) => void
  /** The card in the middle was clicked. A card to the side is brought to the middle instead. */
  onSelect?: (index: number, event: PointerEvent) => void
  /** The entrance has begun. */
  onIntro?: () => void
  /** The held card is in place and would be drawn whole: release() is seamless from now. */
  onHeldReady?: () => void
  /** Any input: a press, a drag, the wheel, a step. */
  onInteract?: () => void
  /** The row moved this many px; positive is towards later cards. */
  onMove?: (px: number) => void
  /** How much the opened card has grown, 1 when none is open. */
  onLift?: (lift: number) => void
  /** No WebGL2, or the GPU context was lost. */
  onFail?: () => void
  className?: string
  style?: CSSProperties
}

const FIT_ASPECT: Partial<Record<Fit, number>> = { portrait: 0.75, square: 1, landscape: 4 / 3 }
const TAPS = 12
const PIXEL_BUDGET = 4.5e6
const INTRO_DURATION: Record<string, number> = { rise: 2.1, bloom: 1.6, spin: 2.2, deal: 1.5, fade: 0.35 }

const wrap = (value: number, size: number) => ((((value + size / 2) % size) + size) % size) - size / 2
const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)
const easeOut = (value: number) => 1 - Math.pow(1 - clamp01(value), 3)
const easeOutQuint = (value: number) => 1 - Math.pow(1 - clamp01(value), 5)
const easeInOut = (value: number) => {
  const t = clamp01(value)
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/** The most of the width the widest card may take: `cardWidth`, or 80% when
 *  the container is taller than wide. */
const widthShare = (width: number, height: number, cardWidth: number) =>
  width < height ? Math.max(cardWidth, 0.8) : cardWidth

/** Every card's height, in px: a share of the container's height, but never
 *  so tall that the widest card takes more than its share of the width.
 *  Shared with the page, so it can place things against the cards before the
 *  carousel has drawn. */
export function cardHeightFor(width: number, height: number, cardHeight: number, cardWidth: number, widest: number) {
  const share = widthShare(width, height, cardWidth)
  return Math.max(24, Math.min(cardHeight * height, (share * width) / Math.max(widest, 0.1)))
}

const hexColor = (hex?: string) => {
  const match = hex ? /^#([0-9a-f]{6})$/i.exec(hex) : null
  if (!match) return null
  const n = parseInt(match[1], 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

// The image's average colour, from an 8 × 8 copy.
function averageColor(image: HTMLImageElement) {
  try {
    const probe = document.createElement("canvas")
    probe.width = 8
    probe.height = 8
    const ctx = probe.getContext("2d", { willReadFrequently: true })
    if (!ctx) return null
    ctx.drawImage(image, 0, 0, 8, 8)
    const data = ctx.getImageData(0, 0, 8, 8).data
    const sum = [0, 0, 0]
    for (let i = 0; i < data.length; i += 4) {
      sum[0] += data[i]
      sum[1] += data[i + 1]
      sum[2] += data[i + 2]
    }
    return sum.map((v) => v / 64 / 255)
  } catch {
    return null
  }
}

const cardVertex = /* glsl */ `#version 300 es
in vec3 position;
in vec2 uv;
uniform vec4 uRect;
uniform vec2 uResolution;
out vec2 vUv;
out vec2 vLocal;
void main() {
  vUv = uv;
  vLocal = vec2(position.x, -position.y) * uRect.zw;
  vec2 px = uRect.xy + vLocal;
  gl_Position = vec4(px.x / uResolution.x * 2.0 - 1.0, 1.0 - px.y / uResolution.y * 2.0, 0.0, 1.0);
}
`

const cardFragment = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D tMap;
uniform vec2 uSize;
uniform vec2 uImage;
uniform float uRadius;
uniform float uAlpha;
uniform float uReady;
uniform float uDpr;
uniform vec3 uPlaceholder;
in vec2 vUv;
in vec2 vLocal;
out vec4 fragColor;

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  float sd = roundedBox(vLocal, uSize * 0.5, min(uRadius, min(uSize.x, uSize.y) * 0.5));
  float mask = clamp(0.5 - sd * uDpr, 0.0, 1.0);
  vec2 local = vLocal / uSize + 0.5;
  float cardAspect = uSize.x / uSize.y;
  float imageAspect = uImage.x / max(uImage.y, 1.0);
  vec2 scale = imageAspect > cardAspect ? vec2(cardAspect / imageAspect, 1.0) : vec2(1.0, imageAspect / cardAspect);
  vec2 uv = (local - 0.5) * scale + 0.5;
  vec3 image = texture(tMap, uv).rgb;
  vec3 color = mix(uPlaceholder, image, uReady);
  float alpha = mask * uAlpha;
  fragColor = vec4(color * alpha, alpha);
}
`

const lensVertex = /* glsl */ `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const lensFragment = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D tScene;
uniform vec2 uResolution;
uniform float uDpr;
uniform vec2 uCenter;
uniform vec2 uHalf;
uniform float uAngle;
uniform float uExponent;
uniform float uInner;
uniform float uOuter;
uniform float uFlow;
uniform float uCurl;
uniform float uDispersion;
uniform float uStrength;
uniform float uSceneAlpha;
out vec4 fragColor;

void main() {
  vec2 frag = gl_FragCoord.xy / uDpr;
  vec2 uv = frag / uResolution;
  vec2 rel = frag - vec2(uCenter.x, uResolution.y - uCenter.y);
  float ca = cos(uAngle);
  float sa = sin(uAngle);
  vec2 local = vec2(ca * rel.x + sa * rel.y, -sa * rel.x + ca * rel.y);
  vec2 k = max(abs(local) / uHalf, vec2(1e-5));
  float nd = pow(pow(k.x, uExponent) + pow(k.y, uExponent), 1.0 / uExponent);
  vec2 grad = pow(k, vec2(uExponent - 1.0)) * sign(local) / uHalf * pow(nd, 1.0 - uExponent);
  float glen = max(length(grad), 1e-6);
  float edge = (nd - 1.0) / glen;
  vec2 outward = grad / glen;
  vec2 normal = vec2(ca * outward.x - sa * outward.y, sa * outward.x + ca * outward.y);
  vec2 along = vec2(-normal.y, normal.x);

  float t = clamp((edge + uInner) / (uInner + uOuter), 0.0, 1.0);
  float ramp = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  float slope = 16.0 * t * t * (1.0 - t) * (1.0 - t);
  float reachX = rel.x / (uResolution.x * 0.5);
  float side = smoothstep(0.02, 0.3, abs(reachX)) * (uCurl == 0.0 ? sign(reachX) : uCurl);
  float lift = ramp * side * uFlow * uStrength;
  vec2 swirl = along * along.y * side * slope * uFlow * uStrength * 0.35;
  vec2 drift = vec2(0.0, -lift) - swirl;
  vec2 shifted = uv + drift / uResolution;

  vec2 texels = uResolution * uDpr;
  vec2 gx = dFdx(shifted);
  vec2 gy = dFdy(shifted);
  gx *= min(1.0, 3.0 / max(length(gx * texels), 1e-4));
  gy *= min(1.0, 3.0 / max(length(gy * texels), 1e-4));

  vec4 color = textureGrad(tScene, shifted, gx, gy);
  vec2 spread = vec2(0.0, side * slope * uFlow * uStrength) / uResolution * uDispersion;
  float spreadPx = length(spread * texels);
  if (color.a > 0.002 && spreadPx > 0.25) {
    vec3 base = color.rgb / color.a;
    vec3 sumColor = vec3(0.0);
    vec3 sumWeight = vec3(0.0);
    for (int i = 0; i < ${TAPS}; i++) {
      float s = (float(i) + 0.5) / float(${TAPS});
      vec4 c = textureGrad(tScene, shifted + spread * (s - 0.5), gx, gy);
      vec3 w = max(1.0 - abs(vec3(s) - vec3(0.15, 0.5, 0.85)) * 2.6, 0.0) * c.a;
      sumColor += c.rgb * (w / max(c.a, 0.002));
      sumWeight += w;
    }
    vec3 split = mix(base, sumColor / max(sumWeight, vec3(1e-4)), clamp(sumWeight * 2.0, 0.0, 1.0));
    color.rgb = mix(color.rgb, clamp(split, 0.0, 1.0) * color.a, smoothstep(0.25, 1.5, spreadPx));
  }

  fragColor = color * uSceneAlpha;
}
`

/** A number on reels: each digit rolls to its new value. */
export function Digits({ value, length = 2 }: { value: number; length?: number }) {
  return (
    <span className="digits">
      {String(value)
        .padStart(length, "0")
        .split("")
        .map((digit, index) => (
          <span key={index} className="digit">
            <span className="reel" style={{ transform: `translateY(${-Number(digit) * 10}%)` }}>
              {"0123456789".split("").map((n) => (
                <span key={n}>{n}</span>
              ))}
            </span>
          </span>
        ))}
    </span>
  )
}

type Engine = FlexHandle & { wake(): void }

type Slot = {
  index: number
  texture: Texture
  aspect: number
  image: [number, number]
  color: number[]
  /** Decoded (and resized, where the browser can) and waiting for its turn to upload. */
  waiting: HTMLImageElement | ImageBitmap | null
  loaded: boolean
  failed: boolean
  ready: number
  dispose: () => void
}

type Metrics = { cardH: number; widths: number[]; centers: number[]; gap: number; loop: number }
type Instance = { index: number; x0: number; x1: number; y0: number; y1: number }
type CardEffect = { alpha: number; x: number; y: number; scale: number }
type Draw = { i: number; rel: number; x: number; y: number; cw: number; ch: number; alpha: number }

export const FlexCarousel = forwardRef<FlexHandle, Props>(function FlexCarousel(props, ref) {
  const {
    preset = "liquid",
    intro = "rise",
    fit = "natural",
    cardHeight = 0.5,
    cardWidth = 0.6,
    gap = 12,
    radius = 0,
    squeeze = 0.2,
    className = "",
    style,
  } = props
  const containerRef = useRef<HTMLDivElement>(null)
  const latest = useRef(props)
  const settingsRef = useRef<Settings | null>(null)
  const engineRef = useRef<Engine | null>(null)

  const base: Lens = BEND_PRESETS[preset] ?? BEND_PRESETS.liquid

  useEffect(() => {
    latest.current = props
    settingsRef.current = {
      intro,
      fit,
      cardHeight,
      cardWidth,
      gap,
      radius,
      squeeze,
      lensWidth: props.lensWidth ?? base.lensWidth,
      lensHeight: props.lensHeight ?? base.lensHeight,
      tilt: props.tilt ?? base.tilt,
      roundness: props.roundness ?? base.roundness,
      bend: props.bend ?? base.bend,
      reach: props.reach ?? base.reach,
      curl: props.curl ?? base.curl,
      dispersion: props.dispersion ?? base.dispersion,
      liquid: props.liquid ?? base.liquid,
      followCursor: props.followCursor ?? base.followCursor,
    }
    engineRef.current?.wake()
  })

  useImperativeHandle(
    ref,
    () => ({
      step: (delta) => engineRef.current?.step(delta),
      goTo: (index) => engineRef.current?.goTo(index),
      open: (index) => engineRef.current?.open(index),
      hold: (index) => engineRef.current?.hold(index) ?? null,
      release: () => engineRef.current?.release(),
      wheel: (event) => engineRef.current?.wheel(event),
    }),
    [],
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const call = latest

    // Asked for here first, with the attributes ogl will ask for, so that
    // without WebGL2 the page quietly shows its list instead (ogl would log
    // an error). ogl then gets this same context back.
    const surface = document.createElement("canvas")
    const attributes = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false }
    if (!surface.getContext("webgl2", attributes)) {
      call.current.onFail?.()
      return
    }
    const renderer = new Renderer({
      canvas: surface,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      ...attributes,
    })
    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)
    const canvas = gl.canvas as HTMLCanvasElement
    canvas.style.display = "block"
    canvas.style.width = "100%"
    canvas.style.height = "100%"
    container.prepend(canvas)

    const cardProgram = new Program(gl, {
      vertex: cardVertex,
      fragment: cardFragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tMap: { value: new Texture(gl) },
        uRect: { value: [0, 0, 1, 1] },
        uResolution: { value: [1, 1] },
        uSize: { value: [1, 1] },
        uImage: { value: [1, 1] },
        uRadius: { value: 16 },
        uAlpha: { value: 1 },
        uReady: { value: 0 },
        uDpr: { value: 1 },
        uPlaceholder: { value: [0.5, 0.5, 0.5] },
      },
    })
    cardProgram.setBlendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    const cardMesh = new Mesh(gl, { geometry: new Plane(gl), program: cardProgram })

    const target = new RenderTarget(gl, {
      width: 2,
      height: 2,
      depth: false,
      minFilter: gl.LINEAR_MIPMAP_LINEAR,
      magFilter: gl.LINEAR,
    })

    const lensUniforms = {
      tScene: { value: target.texture },
      uResolution: { value: [1, 1] },
      uDpr: { value: 1 },
      uCenter: { value: [0, 0] },
      uHalf: { value: [1, 1] },
      uAngle: { value: 0 },
      uExponent: { value: 2 },
      uInner: { value: 60 },
      uOuter: { value: 80 },
      uFlow: { value: 0 },
      uCurl: { value: 0 },
      uDispersion: { value: 0 },
      uStrength: { value: 0 },
      uSceneAlpha: { value: 0 },
    }
    const lensMesh = new Mesh(gl, {
      geometry: new Triangle(gl),
      program: new Program(gl, {
        vertex: lensVertex,
        fragment: lensFragment,
        uniforms: lensUniforms,
        depthTest: false,
        depthWrite: false,
      }),
    })

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const anisotropy = renderer.getExtension("EXT_texture_filter_anisotropic") ? 8 : 0

    let slots: Slot[] = []
    let width = 1
    let height = 1
    let pos = 0
    let vel = 0
    let goal = 0
    let mode: "spring" | "wheel" = "spring"
    let wheelAt = 0
    /** Where the current wheel gesture began, snapped to a card. */
    let wheelFrom = 0
    let stopTick: (() => void) | null = null
    let last = performance.now()
    let visible = true
    let alive = true
    let dirty = true
    /** Held still for a page transition: nothing moves or redraws. */
    let frozen = false
    let activeIndex = -1
    let startIndex = call.current.initial ?? 0
    let held = call.current.held ?? -1
    let heldReady = false
    let deform = 0
    let deformVel = 0
    let layout: Metrics | null = null
    let resnap = false
    let hover = ""
    let lift = 1
    let energy = 0
    let lastPos = 0
    /** pos as last reported through onMove. */
    let reported = 0
    const lens = { x: 0, y: 0, vx: 0, vy: 0, ready: false }
    const pointer = {
      x: 0,
      y: 0,
      over: false,
      down: false,
      id: -1,
      startX: 0,
      startY: 0,
      startPos: 0,
      dragging: false,
      touch: false,
      samples: [] as { x: number; t: number }[],
    }
    const introState = { kind: "none", t: 0, running: false, done: false, readyAt: 0 }
    const focus = { index: -1, t: 0, v: 0, target: 0 }
    let instances: Instance[] = []

    // A texture needn't be larger than its card can be drawn (an opened card
    // grows by up to 1.3×): the browser resizes the image off the main thread,
    // so uploads are quick and light on the GPU. Without that, the <img> is
    // uploaded as it is.
    const shrink = async (image: HTMLImageElement, aspect: number) => {
      const s = settingsRef.current
      if (!s || typeof createImageBitmap !== "function") return null
      const cardH = metrics(s).cardH
      const w = Math.min(4096, Math.ceil(Math.min(cardH * aspect, width) * renderer.dpr * 1.3))
      try {
        return await createImageBitmap(image, {
          resizeWidth: w,
          resizeHeight: Math.max(1, Math.round(w / aspect)),
          resizeQuality: "high",
        })
      } catch {
        return null
      }
    }

    const loadSlot = (item: FlexItem, index: number): Slot => {
      // Top row first, the same for an <img> and an ImageBitmap (browsers
      // differ on flipping the latter); the shader reads it that way.
      const texture = new Texture(gl, {
        generateMipmaps: true,
        minFilter: gl.LINEAR_MIPMAP_LINEAR,
        magFilter: gl.LINEAR,
        anisotropy,
        flipY: false,
      })
      const image = item.image
      const slot: Slot = {
        index,
        texture,
        aspect: item.aspect,
        image: [item.aspect, 1],
        color: hexColor(item.color) ?? [0.5, 0.5, 0.5],
        waiting: null,
        loaded: false,
        failed: false,
        ready: 0,
        dispose: () => {},
      }
      let settled = false
      const fail = () => {
        if (settled || !alive) return
        settled = true
        slot.failed = true
        dirty = true
        start()
      }
      const load = () => {
        if (settled || !alive) return
        if (!image.naturalWidth) return fail()
        settled = true
        // Decode (and shrink) off the main thread first; upload() then takes
        // it on a frame of its own.
        image
          .decode()
          .catch(() => {})
          .then(() => shrink(image, slot.aspect))
          .then((bitmap) => {
            if (!alive || !slots.includes(slot)) return bitmap?.close()
            slot.image = [image.naturalWidth || 1, image.naturalHeight || 1]
            if (!item.color) slot.color = averageColor(image) ?? slot.color
            slot.waiting = bitmap ?? image
            start()
          })
      }
      // Complete without a width means it failed.
      if (image.complete) load()
      else {
        image.addEventListener("load", load)
        image.addEventListener("error", fail)
      }
      slot.dispose = () => {
        image.removeEventListener("load", load)
        image.removeEventListener("error", fail)
        if (slot.waiting instanceof ImageBitmap) slot.waiting.close()
        gl.deleteTexture(texture.texture)
      }
      return slot
    }

    // One texture upload a frame, the card in the middle first: several at
    // once would stall the frame they land in.
    const upload = () => {
      let next: Slot | null = null
      for (const slot of slots) {
        if (!slot.waiting) continue
        if (slot.index === held || slot.index === activeIndex || slot.index === startIndex) {
          next = slot
          break
        }
        if (!next) next = slot
      }
      if (!next?.waiting) return false
      const source = next.waiting
      // ogl uploads any image source; its types just don't list ImageBitmap.
      next.texture.image = source as HTMLImageElement
      next.texture.update()
      // The GPU has its own copy now.
      if (source instanceof ImageBitmap) source.close()
      next.waiting = null
      next.loaded = true
      dirty = true
      return true
    }

    const setItems = (next: FlexItem[]) => {
      slots.forEach((slot) => slot.dispose())
      slots = next.map(loadSlot)
      activeIndex = -1
      layout = null
      resnap = true
      focus.target = 0
      focus.t = 0
      focus.v = 0
      introState.readyAt = performance.now()
      dirty = true
      start()
    }

    const metrics = (s: Settings): Metrics => {
      const fixed = FIT_ASPECT[s.fit]
      const aspects = slots.map((slot) => fixed ?? slot.aspect)
      const cardH = cardHeightFor(width, height, s.cardHeight, s.cardWidth, Math.max(...aspects))
      const widths = aspects.map((aspect) => aspect * cardH)
      const centers: number[] = []
      let cursor = 0
      for (const w of widths) {
        centers.push(cursor + w / 2)
        cursor += w + s.gap
      }
      return { cardH, widths, centers, gap: s.gap, loop: Math.max(cursor, 1) }
    }

    const nearest = (m: Metrics, at: number) => {
      let best = 0
      let bestDist = Infinity
      for (let i = 0; i < m.centers.length; i++) {
        const dist = Math.abs(wrap(m.centers[i] - at, m.loop))
        if (dist < bestDist) {
          bestDist = dist
          best = i
        }
      }
      return best
    }

    const snapPoint = (m: Metrics, at: number) => {
      const i = nearest(m, at)
      return at + wrap(m.centers[i] - at, m.loop)
    }

    const remap = (from: Metrics, to: Metrics, at: number) => {
      const i = nearest(from, at)
      const offset = wrap(at - from.centers[i], from.loop)
      const cycles = Math.round((at - offset - from.centers[i]) / from.loop)
      return cycles * to.loop + to.centers[i] + offset * (to.widths[i] / from.widths[i])
    }

    const step = (m: Metrics, delta: number) => {
      let at = snapPoint(m, goal)
      let index = nearest(m, at)
      const n = m.centers.length
      for (let k = 0; k < Math.abs(delta); k++) {
        const next = (index + (delta > 0 ? 1 : n - 1)) % n
        const distance =
          delta > 0
            ? m.widths[index] / 2 + m.gap + m.widths[next] / 2
            : -(m.widths[next] / 2 + m.gap + m.widths[index] / 2)
        at += distance
        index = next
      }
      goal = at
      mode = "spring"
      dirty = true
      start()
    }

    const goTo = (m: Metrics, index: number) => {
      const i = ((index % m.centers.length) + m.centers.length) % m.centers.length
      goal = goal + wrap(m.centers[i] - goal, m.loop)
      mode = "spring"
      dirty = true
      start()
    }

    const openFocus = (index: number) => {
      focus.index = index
      focus.target = 1
      dirty = true
      start()
    }

    const closeFocus = () => {
      if (focus.target === 0) return false
      focus.target = 0
      dirty = true
      start()
      return true
    }

    const skipIntro = () => {
      if (introState.running) introState.t = 1
    }

    const introEffects = () => {
      const t = introState.running ? introState.t : introState.done ? 1 : 0
      const e: { sceneAlpha: number; strength: number; card: ((rel: number) => CardEffect) | null } = {
        sceneAlpha: 1,
        strength: 1,
        card: null,
      }
      if (!introState.done && !introState.running) {
        e.sceneAlpha = 0
        e.strength = 0
        return e
      }
      if (t >= 1) return e
      const kind = introState.kind
      if (kind === "rise") {
        e.strength = easeInOut((t - 0.3) / 0.65)
        e.card = (rel) => {
          const delay = Math.min(Math.abs(rel) / (width * 0.6), 1) * 0.34
          const local = clamp01((t - delay) / 0.6)
          return {
            alpha: clamp01(local * 4),
            x: 0,
            y: (1 - easeOutQuint(local)) * height * 0.62,
            scale: 0.5 + 0.5 * easeInOut((local - 0.18) / 0.82),
          }
        }
      } else if (kind === "bloom") {
        e.strength = easeInOut((t - 0.2) / 0.8)
        e.card = (rel) => {
          const delay = Math.min(Math.abs(rel) / (width * 0.6), 1) * 0.25
          const local = easeOut((t - delay) / 0.55)
          return { alpha: local, x: 0, y: 0, scale: 0.92 + 0.08 * local }
        }
      } else if (kind === "spin") {
        e.sceneAlpha = easeOut(t / 0.25)
        e.strength = easeOut((t - 0.55) / 0.45)
      } else if (kind === "deal") {
        e.strength = easeOut((t - 0.45) / 0.5)
        e.card = (rel) => {
          const spread = Math.min(Math.abs(rel) / (width * 0.6), 1) * 0.3
          const local = easeOut((t - 0.12 - spread) / 0.5)
          return { alpha: easeOut((t - spread) / 0.12), x: -rel * (1 - local), y: 0, scale: 1 }
        }
      } else {
        e.sceneAlpha = easeOut(t)
        e.strength = easeOut(t)
      }
      return e
    }

    const beginIntro = (s: Settings, m: Metrics) => {
      const kind = reducedMotion && s.intro !== "none" ? "fade" : s.intro
      introState.kind = INTRO_DURATION[kind] ? kind : "none"
      introState.running = introState.kind !== "none"
      introState.done = !introState.running
      introState.t = 0
      if (introState.kind === "spin") {
        const distance = m.loop * 1.6 + width
        pos = goal + distance
        vel = -distance * 3
        mode = "spring"
      }
      call.current.onIntro?.()
    }

    const resize = () => {
      width = Math.max(1, container.clientWidth)
      height = Math.max(1, container.clientHeight)
      renderer.dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(PIXEL_BUDGET / (width * height)))
      renderer.setSize(width, height)
      target.setSize(Math.max(2, Math.round(width * renderer.dpr)), Math.max(2, Math.round(height * renderer.dpr)))
      lensUniforms.tScene.value = target.texture
      dirty = true
      start()
    }

    const focusScaleFor = (m: Metrics) => {
      const w = focus.index >= 0 && focus.index < m.widths.length ? m.widths[focus.index] : m.cardH
      return Math.max(1, Math.min(1.3, (height * 0.84) / m.cardH, (width * 0.92) / w))
    }

    // Draws the row as it stands: the cards into a texture, then that texture
    // through the glass onto the canvas.
    const draw = (s: Settings, m: Metrics) => {
      dirty = false
      instances = []
      const n = slots.length
      const effects = introEffects()
      const focusAmount = clamp01(focus.t)
      const focusEase = easeInOut(focusAmount)
      const focusScale = focusScaleFor(m)
      const homeX = width / 2
      const homeY = height / 2
      const liquidAmount = reducedMotion ? 0 : s.liquid
      // Where the cards take more of the width, the glass grows with them, so
      // the bend stays clear of the card in the middle.
      const grow = widthShare(width, height, s.cardWidth) / s.cardWidth
      let halfW = (s.lensWidth * width * grow) / 2
      let halfH = (s.lensHeight * width * grow) / 2
      const squash = Math.abs(deform) * liquidAmount
      halfW *= 1 + squash * 0.16
      halfH *= 1 - squash * 0.08
      const lensX = lens.x - deform * 14 * liquidAmount
      const dpr = renderer.dpr

      cardProgram.uniforms.uResolution.value = [width, height]
      cardProgram.uniforms.uDpr.value = dpr
      cardProgram.uniforms.uRadius.value = s.radius
      const shrink = 1 - clamp01(s.squeeze) * energy
      const draws: Draw[] = []
      for (let i = 0; i < n; i++) {
        const w = m.widths[i]
        const baseRel = wrap(m.centers[i] - pos, m.loop)
        for (let k = -3; k <= 3; k++) {
          const rel = baseRel + k * m.loop
          if (Math.abs(rel) - w / 2 > width + 40) continue
          const fx = effects.card ? effects.card(rel) : null
          let x = homeX + rel + (fx ? fx.x : 0)
          let scale = shrink * (fx ? fx.scale : 1)
          let alpha = fx ? fx.alpha : 1
          if (focusAmount > 0) {
            if (i === focus.index && Math.abs(rel) < w) {
              scale *= 1 + (focusScale - 1) * focusEase
            } else {
              const order = Math.min(Math.abs(rel) / width, 1) * 0.25
              const part = easeInOut(focusAmount * 1.25 - order)
              x += Math.sign(rel) * part * width * 0.7
              alpha *= 1 - part
            }
          }
          const cw = w * scale
          if (alpha <= 0.001 || x + cw / 2 < -40 || x - cw / 2 > width + 40) continue
          draws.push({ i, rel, x, y: homeY + (fx ? fx.y : 0), cw, ch: m.cardH * scale, alpha })
        }
      }
      draws.sort((a, b) => Math.abs(b.rel) - Math.abs(a.rel))
      let first = true
      for (const d of draws) {
        const slot = slots[d.i]
        instances.push({ index: d.i, x0: d.x - d.cw / 2, x1: d.x + d.cw / 2, y0: d.y - d.ch / 2, y1: d.y + d.ch / 2 })
        if (d.i === held) {
          // The page transition's copy stands in for it. Say once it would be
          // drawn whole and in place, so the swap can't be seen.
          if (
            !heldReady &&
            slot.loaded &&
            slot.ready >= 1 &&
            d.alpha >= 0.999 &&
            Math.abs(d.x - homeX) < 0.5 &&
            Math.abs(d.y - homeY) < 0.5 &&
            Math.abs(d.ch - m.cardH) < 0.5
          ) {
            heldReady = true
            queueMicrotask(() => call.current.onHeldReady?.())
          }
          continue
        }
        cardProgram.uniforms.tMap.value = slot.texture
        cardProgram.uniforms.uRect.value = [d.x, d.y, d.cw + 2, d.ch + 2]
        cardProgram.uniforms.uSize.value = [d.cw, d.ch]
        cardProgram.uniforms.uImage.value = slot.image
        cardProgram.uniforms.uAlpha.value = d.alpha
        cardProgram.uniforms.uReady.value = slot.ready
        cardProgram.uniforms.uPlaceholder.value = slot.color
        renderer.render({ scene: cardMesh, target, clear: first })
        first = false
      }
      if (first) {
        renderer.bindFramebuffer(target)
        gl.viewport(0, 0, target.width, target.height)
        gl.clear(gl.COLOR_BUFFER_BIT)
      }
      renderer.bindFramebuffer()
      target.texture.bind()
      gl.generateMipmap(gl.TEXTURE_2D)

      lensUniforms.uResolution.value = [width, height]
      lensUniforms.uDpr.value = dpr
      lensUniforms.uCenter.value = [lensX, lens.y]
      lensUniforms.uHalf.value = [Math.max(halfW, 1), Math.max(halfH, 1)]
      lensUniforms.uAngle.value = (s.tilt * Math.PI) / 180
      lensUniforms.uExponent.value = 2 + Math.pow(1 - clamp01(s.roundness), 1.5) * 10
      const spanW = Math.max(halfW, 1)
      const spanH = Math.max(halfH, 1)
      const inner = Math.max(4, s.reach * (spanW + spanH) * 0.5)
      lensUniforms.uInner.value = inner
      lensUniforms.uOuter.value = inner * 1.6
      lensUniforms.uFlow.value = s.bend * (spanW + spanH) * 0.45
      lensUniforms.uCurl.value = s.curl === "rise" ? 1 : s.curl === "fall" ? -1 : 0
      lensUniforms.uDispersion.value = s.dispersion * 0.12 * (1 + Math.abs(deform) * liquidAmount * 1.2)
      lensUniforms.uStrength.value = effects.strength * (1 - focusEase)
      lensUniforms.uSceneAlpha.value = effects.sceneAlpha
      renderer.render({ scene: lensMesh })
    }

    const frame = (now: number) => {
      if (!alive || frozen) return stop()
      const s = settingsRef.current
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000))
      last = now
      if (!s || !slots.length) return

      const uploaded = upload()
      const m = metrics(s)
      const n = slots.length
      let animating = uploaded || slots.some((slot) => slot.waiting)

      if (resnap) {
        goal = startIndex >= 0 && startIndex < n ? m.centers[startIndex] : snapPoint(m, goal)
        startIndex = -1
        pos = goal
        vel = 0
        resnap = false
        reported = pos
        lastPos = pos
      } else if (layout && layout.loop !== m.loop) {
        pos = remap(layout, m, pos)
        goal = remap(layout, m, goal)
        wheelFrom = remap(layout, m, wheelFrom)
        pointer.startPos = pos + (pointer.x - pointer.startX)
        reported = pos
        lastPos = pos
        animating = true
      }
      layout = m

      if (!introState.running && !introState.done) {
        const allSettled = slots.every((slot) => slot.loaded || slot.failed)
        if (allSettled || now - introState.readyAt > 3500) {
          goal = snapPoint(m, goal)
          pos = goal
          beginIntro(s, m)
        }
      }
      if (introState.running) {
        introState.t = Math.min(1, introState.t + dt / (INTRO_DURATION[introState.kind] || 1))
        if (introState.t >= 1) {
          introState.running = false
          introState.done = true
        }
        animating = true
      }

      if (mode === "wheel" && now - wheelAt > 150) {
        const snapped = snapPoint(m, goal)
        const travel = goal - wheelFrom
        // A throw too short to reach the next card still goes there: one
        // notch of a mouse wheel is a card.
        if (Math.abs(snapped - wheelFrom) < 1 && Math.abs(travel) > 24) {
          goal = wheelFrom
          step(m, Math.sign(travel))
        } else {
          goal = snapped
          mode = "spring"
        }
      }
      if (!pointer.dragging) {
        const spinning = introState.running && introState.kind === "spin"
        const stiffness = spinning ? 9 : mode === "wheel" ? 80 : 55
        const damping = 2 * Math.sqrt(stiffness)
        const steps = Math.ceil(dt / (1 / 240))
        const h = dt / steps
        for (let i = 0; i < steps; i++) {
          const acc = stiffness * (goal - pos) - damping * vel
          vel += acc * h
          pos += vel * h
        }
        if (Math.abs(goal - pos) < 0.05 && Math.abs(vel) < 0.5) {
          pos = goal
          vel = 0
        } else {
          animating = true
        }
      } else {
        animating = true
      }

      if (Math.abs(pos) > m.loop * 8) {
        const shift = Math.round(pos / m.loop) * m.loop
        pos -= shift
        goal -= shift
        wheelFrom -= shift
        pointer.startPos -= shift
        reported -= shift
        lastPos -= shift
      }
      if (pos !== reported) {
        call.current.onMove?.(pos - reported)
        reported = pos
      }

      const current = nearest(m, pos)
      if (current !== activeIndex) {
        activeIndex = current
        call.current.onChange?.(current)
      }

      const travel = Math.abs(pos - lastPos) / dt
      lastPos = pos
      const energyTarget = reducedMotion ? 0 : Math.min(travel / 2600, 1)
      energy += (energyTarget - energy) * (1 - Math.exp(-dt / (energyTarget > energy ? 0.07 : 0.35)))
      if (energy > 0.001) animating = true
      const push = Math.max(-1, Math.min(1, vel / 2200))
      const deformStiffness = 120
      const deformDamping = 2 * Math.sqrt(deformStiffness) * 0.32
      deformVel += (deformStiffness * (push - deform) - deformDamping * deformVel) * dt
      deform += deformVel * dt
      if (Math.abs(deform) > 0.0005 || Math.abs(deformVel) > 0.005) animating = true

      const focusStiffness = 64
      focus.v += (focusStiffness * (focus.target - focus.t) - 2 * Math.sqrt(focusStiffness) * focus.v) * dt
      focus.t += focus.v * dt
      if (Math.abs(focus.target - focus.t) < 0.0005 && Math.abs(focus.v) < 0.001) {
        focus.t = focus.target
        focus.v = 0
      } else {
        animating = true
      }
      const nextLift = 1 + (focusScaleFor(m) - 1) * easeInOut(clamp01(focus.t))
      if (Math.abs(nextLift - lift) > 0.0005) {
        lift = nextLift
        call.current.onLift?.(lift)
      }

      const homeX = width / 2
      const homeY = height / 2
      const follow = s.followCursor && pointer.over && !pointer.dragging && !pointer.touch && focus.target === 0
      const aimX = follow ? pointer.x : homeX
      const aimY = follow ? pointer.y : homeY
      if (!lens.ready) {
        lens.x = homeX
        lens.y = homeY
        lens.ready = true
      }
      const lensK = 110
      const lensC = 2 * Math.sqrt(lensK) * 0.8
      lens.vx += (lensK * (aimX - lens.x) - lensC * lens.vx) * dt
      lens.vy += (lensK * (aimY - lens.y) - lensC * lens.vy) * dt
      lens.x += lens.vx * dt
      lens.y += lens.vy * dt
      if (Math.abs(aimX - lens.x) + Math.abs(aimY - lens.y) > 0.2 || Math.abs(lens.vx) + Math.abs(lens.vy) > 0.5)
        animating = true

      for (const slot of slots) {
        if (slot.loaded && slot.ready < 1) {
          slot.ready = Math.min(1, slot.ready + dt / 0.45)
          animating = true
        }
      }

      const waiting = !introState.done
      if (dirty || animating || pointer.dragging) draw(s, m)

      let nextHover = ""
      if (pointer.over && !pointer.dragging && introState.done) {
        const hit = instances.find(
          (inst) => pointer.x >= inst.x0 && pointer.x <= inst.x1 && pointer.y >= inst.y0 && pointer.y <= inst.y1,
        )
        if (hit) nextHover = hit.index === activeIndex ? "open" : "side"
      }
      if (nextHover !== hover) {
        hover = nextHover
        if (hover) container.dataset.hover = hover
        else delete container.dataset.hover
      }

      if (!(visible && (animating || waiting || dirty || pointer.down))) stop()
    }

    // Before the starfield on the shared ticker, so the stars follow the row
    // in the same frame. Off whenever nothing moves.
    const start = () => {
      if (stopTick || !visible || !alive || frozen) return
      last = performance.now()
      stopTick = onTick(frame, 0.5)
    }

    const stop = () => {
      stopTick?.()
      stopTick = null
    }

    const localPoint = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      return [e.clientX - rect.left, e.clientY - rect.top]
    }

    const onPointerDown = (e: PointerEvent) => {
      if (frozen || (e.button !== undefined && e.button > 0)) return
      skipIntro()
      call.current.onInteract?.()
      const [x, y] = localPoint(e)
      pointer.down = true
      pointer.id = e.pointerId
      pointer.touch = e.pointerType === "touch"
      pointer.startX = x
      pointer.startY = y
      pointer.x = x
      pointer.y = y
      pointer.startPos = pos
      pointer.dragging = false
      pointer.samples = [{ x, t: performance.now() }]
      if (Math.abs(vel) > 40) {
        goal = pos
        vel = 0
      }
      dirty = true
      start()
    }

    const onPointerMove = (e: PointerEvent) => {
      if (frozen) return
      const [x, y] = localPoint(e)
      pointer.x = x
      pointer.y = y
      pointer.over = true
      if (pointer.down && e.pointerId === pointer.id) {
        const dx = x - pointer.startX
        const dy = y - pointer.startY
        const slop = pointer.touch ? 10 : 5
        if (!pointer.dragging) {
          // A vertical swipe on a touch screen belongs to the page.
          if (pointer.touch && Math.abs(dy) > slop && Math.abs(dy) > Math.abs(dx)) {
            pointer.down = false
            return
          }
          if (Math.abs(dx) > slop) {
            pointer.dragging = true
            pointer.startX = x
            pointer.startPos = pos
            closeFocus()
            try {
              container.setPointerCapture(e.pointerId)
            } catch {
              // Capture is a nicety; the drag still works without it.
            }
            container.dataset.dragging = ""
          }
        }
        if (pointer.dragging) {
          pos = pointer.startPos - (x - pointer.startX)
          goal = pos
          vel = 0
          const now = performance.now()
          pointer.samples.push({ x, t: now })
          while (pointer.samples.length > 2 && now - pointer.samples[0].t > 100) pointer.samples.shift()
        }
      }
      dirty = true
      start()
    }

    const onPointerUp = (e: PointerEvent) => {
      if (!pointer.down || e.pointerId !== pointer.id) return
      pointer.down = false
      delete container.dataset.dragging
      const s = settingsRef.current
      if (!s || frozen) return
      const m = metrics(s)
      if (pointer.dragging) {
        pointer.dragging = false
        const now = performance.now()
        const first = pointer.samples[0]
        const lastSample = pointer.samples[pointer.samples.length - 1]
        let velocity = 0
        if (first && lastSample && lastSample.t > first.t && now - lastSample.t < 70) {
          velocity = -((lastSample.x - first.x) / (lastSample.t - first.t)) * 1000
        }
        vel = velocity
        const landing = snapPoint(m, pos + velocity * 0.32)
        goal = landing
        if (Math.abs(velocity) > 400 && Math.abs(landing - pos) < 1) step(m, velocity > 0 ? 1 : -1)
        mode = "spring"
        start()
        return
      }
      if (closeFocus()) return
      const [x, y] = localPoint(e)
      const hit = instances.find((inst) => x >= inst.x0 && x <= inst.x1 && y >= inst.y0 && y <= inst.y1)
      if (!hit) return
      if (hit.index === activeIndex && Math.abs(goal - pos) < 2) {
        call.current.onSelect?.(hit.index, e)
      } else {
        // A card to the side comes to the middle first.
        const rel = (hit.x0 + hit.x1) / 2 - width / 2
        goal = snapPoint(m, pos + rel)
        mode = "spring"
        start()
      }
    }

    const onPointerLeave = () => {
      pointer.over = false
      dirty = true
      start()
    }

    const onPointerCancel = () => {
      pointer.down = false
      pointer.dragging = false
      delete container.dataset.dragging
      const s = settingsRef.current
      if (!s) return
      goal = snapPoint(metrics(s), pos)
      mode = "spring"
      start()
    }

    const onWheel = (e: WheelEvent) => {
      const s = settingsRef.current
      if (!s || e.ctrlKey) return
      e.preventDefault()
      if (frozen) return
      let dx = e.deltaX
      let dy = e.deltaY
      if (e.shiftKey && Math.abs(dx) < Math.abs(dy)) {
        dx = dy
        dy = 0
      }
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? height : 1
      const horizontal = Math.abs(dx) > Math.abs(dy)
      skipIntro()
      call.current.onInteract?.()
      if (closeFocus()) return
      const m = metrics(s)
      if (mode !== "wheel") wheelFrom = snapPoint(m, goal)
      // Wide cards take a longer throw, so the wheel goes further for them.
      const mean = m.loop / Math.max(1, m.widths.length)
      const delta = Math.max(-120, Math.min(120, (horizontal ? dx : dy) * unit))
      goal += delta * 1.25 * Math.max(1, mean / 640)
      mode = "wheel"
      wheelAt = performance.now()
      start()
    }

    const onVisibility = () => {
      if (!document.hidden) start()
    }

    const onLost = (event: Event) => {
      event.preventDefault()
      call.current.onFail?.()
    }

    container.addEventListener("pointerdown", onPointerDown)
    container.addEventListener("pointermove", onPointerMove)
    container.addEventListener("pointerup", onPointerUp)
    container.addEventListener("pointerleave", onPointerLeave)
    container.addEventListener("pointercancel", onPointerCancel)
    container.addEventListener("wheel", onWheel, { passive: false })
    canvas.addEventListener("webglcontextlost", onLost)
    document.addEventListener("visibilitychange", onVisibility)

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      start()
    })
    intersectionObserver.observe(container)

    engineRef.current = {
      wake: () => {
        dirty = true
        start()
      },
      step: (delta) => {
        const s = settingsRef.current
        if (!s || frozen) return
        skipIntro()
        closeFocus()
        call.current.onInteract?.()
        step(metrics(s), delta)
      },
      goTo: (index) => {
        const s = settingsRef.current
        if (!s || frozen) return
        skipIntro()
        closeFocus()
        call.current.onInteract?.()
        goTo(metrics(s), index)
      },
      open: openFocus,
      hold: (index) => {
        const s = settingsRef.current
        if (!s) return null
        // Where it is right now: the copy of it nearest the middle.
        const offset = (inst: Instance) => Math.abs((inst.x0 + inst.x1) / 2 - width / 2)
        let best: Instance | null = null
        for (const inst of instances) if (inst.index === index && (!best || offset(inst) < offset(best))) best = inst
        held = index
        heldReady = false
        frozen = true
        stop()
        draw(s, metrics(s))
        delete container.dataset.hover
        return best && { x: best.x0, y: best.y0, width: best.x1 - best.x0, height: best.y1 - best.y0 }
      },
      release: () => {
        if (held < 0) return
        held = -1
        const s = settingsRef.current
        if (!s || frozen) return
        draw(s, metrics(s))
        start()
      },
      wheel: onWheel,
    }

    resize()
    setItems(call.current.items)

    return () => {
      alive = false
      visible = false
      engineRef.current = null
      stop()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      container.removeEventListener("pointerdown", onPointerDown)
      container.removeEventListener("pointermove", onPointerMove)
      container.removeEventListener("pointerup", onPointerUp)
      container.removeEventListener("pointerleave", onPointerLeave)
      container.removeEventListener("pointercancel", onPointerCancel)
      container.removeEventListener("wheel", onWheel)
      canvas.removeEventListener("webglcontextlost", onLost)
      document.removeEventListener("visibilitychange", onVisibility)
      slots.forEach((slot) => slot.dispose())
      slots = []
      gl.getExtension("WEBGL_lose_context")?.loseContext()
      canvas.remove()
    }
  }, [])

  // Lenis leaves wheel events inside it alone: the carousel takes them.
  return (
    <div
      ref={containerRef}
      className={`flex-carousel ${className}`.trim()}
      style={style}
      aria-hidden="true"
      data-lenis-prevent=""
    />
  )
})
