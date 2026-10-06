// Draws the Phasm illustration: a quadcopter airframe seen from above as a
// finite-element mesh, shaded by a stand-in stress field that peaks where the
// arms meet the body, as it would under thrust. The mesh is refined there too,
// the way a real one would be. It's an illustration, not a solver result:
// replace it with a screenshot of Phasm when there is one.
//
//   node scripts/build-phasm.mjs && pnpm media
//
// Deterministic: the same file every run.
import path from "node:path"
import sharp from "sharp"

const W = 2400
const H = 1350
const CX = W / 2
const CY = H / 2

// --- Seeded randomness -------------------------------------------------------

function mulberry32(seed) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const random = mulberry32(2025_10_01)

// --- Geometry, as signed distance fields (negative inside) ------------------

const BODY = { hw: 165, hh: 122, r: 48 }
const ARM = { start: 90, length: 520, root: 74, tip: 48 }
const MOTOR = { r: 64, bore: 17 }
const RING = 212
const ANGLES = [45, 135, 225, 315].map((d) => (d * Math.PI) / 180)
const ARMS = ANGLES.map((a) => ({ a, cos: Math.cos(a), sin: Math.sin(a) }))
const MOTORS = ARMS.map((arm) => ({ x: CX + arm.cos * ARM.length, y: CY + arm.sin * ARM.length }))
const SLOTS = [
  { x: CX, y: CY - 58, hw: 70, hh: 16 },
  { x: CX, y: CY + 58, hw: 70, hh: 16 },
]

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const mix = (a, b, t) => a + (b - a) * t
const smoothstep = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

function roundBox(x, y, hw, hh, r) {
  const qx = Math.abs(x) - hw + r
  const qy = Math.abs(y) - hh + r
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r
}

// Position along an arm (u, from the centre) and across it (v).
function local(x, y, arm) {
  const dx = x - CX
  const dy = y - CY
  return { u: dx * arm.cos + dy * arm.sin, v: -dx * arm.sin + dy * arm.cos }
}

const halfWidth = (u) => mix(ARM.root, ARM.tip, clamp(u / ARM.length, 0, 1)) / 2

function armSdf(x, y, arm) {
  const { u, v } = local(x, y, arm)
  const across = Math.abs(v) - halfWidth(u)
  const along = Math.max(ARM.start - u, u - ARM.length)
  return Math.hypot(Math.max(across, 0), Math.max(along, 0)) + Math.min(Math.max(across, along), 0)
}

// Polynomial smooth minimum: fillets where the arms meet the body.
function smin(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k
  return Math.min(a, b) - (h * h * k) / 4
}

function sdf(x, y) {
  let d = roundBox(x - CX, y - CY, BODY.hw, BODY.hh, BODY.r)
  for (const arm of ARMS) d = smin(d, armSdf(x, y, arm), 36)
  for (const m of MOTORS) d = smin(d, Math.hypot(x - m.x, y - m.y) - MOTOR.r, 18)
  // Holes last, so nothing fills them back in.
  for (const slot of SLOTS) d = Math.max(d, -roundBox(x - slot.x, y - slot.y, slot.hw, slot.hh, slot.hh))
  for (const m of MOTORS) d = Math.max(d, MOTOR.bore - Math.hypot(x - m.x, y - m.y))
  return d
}

function gradient(x, y) {
  const e = 0.5
  const gx = sdf(x + e, y) - sdf(x - e, y)
  const gy = sdf(x, y + e) - sdf(x, y - e)
  const len = Math.hypot(gx, gy) || 1
  return [gx / len, gy / len]
}

// --- Stand-in stress: a cantilever under thrust ------------------------------

const ROOT_U = BODY.hw * 0.9
function stress(x, y) {
  let s = 0
  let nearestRoot = Infinity
  for (const arm of ARMS) {
    const { u, v } = local(x, y, arm)
    const hw = halfWidth(u)
    if (u > ROOT_U - 40 && Math.abs(v) < hw + 24) {
      const t = clamp((u - ROOT_U) / (ARM.length - ROOT_U), 0, 1)
      const bending = Math.pow(1 - t, 2.2)
      const edges = 0.78 + 0.22 * Math.pow(clamp(Math.abs(v) / hw, 0, 1), 2)
      s = Math.max(s, bending * edges)
    }
    // Concentration at the fillets on either side of each root.
    for (const side of [-1, 1]) {
      const fx = CX + arm.cos * ROOT_U - arm.sin * side * (ARM.root / 2 + 6)
      const fy = CY + arm.sin * ROOT_U + arm.cos * side * (ARM.root / 2 + 6)
      const d = Math.hypot(x - fx, y - fy)
      s = Math.max(s, Math.exp(-(d * d) / (2 * 34 * 34)))
    }
    nearestRoot = Math.min(nearestRoot, Math.hypot(x - (CX + arm.cos * ROOT_U), y - (CY + arm.sin * ROOT_U)))
  }
  // The plate carries load between the roots; slot ends concentrate it.
  s = Math.max(s, 0.1 + 0.55 * Math.exp(-(nearestRoot * nearestRoot) / (2 * 90 * 90)))
  for (const slot of SLOTS) {
    for (const side of [-1, 1]) {
      const d = Math.hypot(x - (slot.x + side * (slot.hw - slot.hh)), y - slot.y) - slot.hh
      s = Math.max(s, 0.55 * Math.exp(-(d * d) / (2 * 12 * 12)))
    }
  }
  // Motor mounts are stiff; the bore edge picks up a little.
  for (const m of MOTORS) {
    const d = Math.hypot(x - m.x, y - m.y)
    if (d < MOTOR.r + 20) s = Math.max(s, 0.08 + 0.3 * Math.exp(-((d - MOTOR.bore) ** 2) / (2 * 9 * 9)))
  }
  return clamp(s, 0, 1)
}

// --- Nodes: graded spacing, finest at the roots ------------------------------

function spacing(x, y) {
  let d = Infinity
  for (const arm of ARMS) d = Math.min(d, Math.hypot(x - (CX + arm.cos * ROOT_U), y - (CY + arm.sin * ROOT_U)))
  let s = mix(9, 22, smoothstep(30, 260, d))
  // Finer around every hole, as a real mesh would be.
  for (const m of MOTORS) {
    s = Math.min(s, mix(5.5, 22, smoothstep(MOTOR.bore, MOTOR.r + 70, Math.hypot(x - m.x, y - m.y))))
  }
  for (const slot of SLOTS) {
    s = Math.min(s, mix(6.5, 22, smoothstep(0, 70, roundBox(x - slot.x, y - slot.y, slot.hw, slot.hh, slot.hh))))
  }
  return s
}

const CELL = 8
const grid = new Map()
const nodes = []
const key = (x, y) => `${Math.floor(x / CELL)},${Math.floor(y / CELL)}`

function tryAdd(x, y, r) {
  const gx = Math.floor(x / CELL)
  const gy = Math.floor(y / CELL)
  const reach = Math.ceil(r / CELL)
  for (let i = gx - reach; i <= gx + reach; i++) {
    for (let j = gy - reach; j <= gy + reach; j++) {
      for (const n of grid.get(`${i},${j}`) ?? []) if (Math.hypot(n[0] - x, n[1] - y) < r) return false
    }
  }
  const node = [x, y]
  nodes.push(node)
  const k = key(x, y)
  if (!grid.has(k)) grid.set(k, [])
  grid.get(k).push(node)
  return true
}

// Boundary first: candidates near the edge, projected onto it.
const boundary = []
for (let y = 0; y < H; y += 3) {
  for (let x = 0; x < W; x += 3) {
    const d = sdf(x, y)
    if (Math.abs(d) > 2) continue
    const [gx, gy] = gradient(x, y)
    boundary.push([x - gx * d, y - gy * d])
  }
}
boundary.sort(() => random() - 0.5)
for (const [x, y] of boundary) tryAdd(x, y, spacing(x, y) * 0.8)

// Then the interior, kept a little clear of the edge to avoid slivers.
const interior = []
for (let y = 0; y < H; y += 4) {
  for (let x = 0; x < W; x += 4) {
    const jx = x + (random() - 0.5) * 4
    const jy = y + (random() - 0.5) * 4
    if (sdf(jx, jy) < -spacing(jx, jy) * 0.5) interior.push([jx, jy])
  }
}
interior.sort(() => random() - 0.5)
for (const [x, y] of interior) tryAdd(x, y, spacing(x, y))

// --- Delaunay triangulation (Bowyer–Watson) ----------------------------------

function triangulate(points) {
  const big = 1e5
  const pts = [...points, [-big, -big], [big * 2, -big], [0, big * 2]]
  const n = points.length
  let triangles = [[n, n + 1, n + 2]]
  const circum = (t) => {
    const [ax, ay] = pts[t[0]]
    const [bx, by] = pts[t[1]]
    const [cx, cy] = pts[t[2]]
    const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))
    const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d
    const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d
    return { x: ux, y: uy, r2: (ax - ux) ** 2 + (ay - uy) ** 2 }
  }
  let circles = triangles.map(circum)
  for (let i = 0; i < n; i++) {
    const [px, py] = pts[i]
    const bad = []
    const keep = []
    const keepCircles = []
    triangles.forEach((t, k) => {
      const c = circles[k]
      if ((px - c.x) ** 2 + (py - c.y) ** 2 < c.r2) bad.push(t)
      else {
        keep.push(t)
        keepCircles.push(c)
      }
    })
    const edges = new Map()
    for (const t of bad) {
      for (const [a, b] of [
        [t[0], t[1]],
        [t[1], t[2]],
        [t[2], t[0]],
      ]) {
        const k = a < b ? `${a},${b}` : `${b},${a}`
        edges.set(k, edges.has(k) ? null : [a, b])
      }
    }
    for (const edge of edges.values()) {
      if (!edge) continue
      const t = [edge[0], edge[1], i]
      keep.push(t)
      keepCircles.push(circum(t))
    }
    triangles = keep
    circles = keepCircles
  }
  return triangles.filter((t) => t[0] < n && t[1] < n && t[2] < n)
}

const all = triangulate(nodes)
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
const triangles = all.filter((t) => {
  const [a, b, c] = t.map((i) => nodes[i])
  const cx = (a[0] + b[0] + c[0]) / 3
  const cy = (a[1] + b[1] + c[1]) / 3
  if (sdf(cx, cy) > 0) return false
  // Reject triangles that bridge a gap (slot, bore, between arm and body).
  for (const [p, q] of [
    [a, b],
    [b, c],
    [c, a],
  ]) {
    const [mx, my] = mid(p, q)
    if (sdf(mx, my) > 3) return false
    const local = Math.max(spacing(p[0], p[1]), spacing(q[0], q[1]))
    if (Math.hypot(p[0] - q[0], p[1] - q[1]) > local * 3) return false
  }
  return true
})

// Edges used by one triangle only are the outline.
const edgeUse = new Map()
for (const t of triangles) {
  for (const [a, b] of [
    [t[0], t[1]],
    [t[1], t[2]],
    [t[2], t[0]],
  ]) {
    const k = a < b ? `${a},${b}` : `${b},${a}`
    edgeUse.set(k, (edgeUse.get(k) ?? 0) + 1)
  }
}

// --- Drawing -------------------------------------------------------------------

const f = (n) => n.toFixed(1)
const parts = []

// Construction lines and prop discs, very quiet.
parts.push(
  `<g stroke="#fff" stroke-opacity="0.07" stroke-width="1" fill="none" stroke-dasharray="2 10">`,
  `<line x1="${CX}" y1="40" x2="${CX}" y2="${H - 40}"/><line x1="140" y1="${CY}" x2="${W - 140}" y2="${CY}"/>`,
  `</g>`,
)
for (const m of MOTORS) {
  parts.push(
    `<circle cx="${f(m.x)}" cy="${f(m.y)}" r="${RING}" fill="none" stroke="#fff" stroke-opacity="0.16" stroke-width="1.2"/>`,
    `<circle cx="${f(m.x)}" cy="${f(m.y)}" r="${RING - 16}" fill="none" stroke="#fff" stroke-opacity="0.07" stroke-width="1" stroke-dasharray="1 7"/>`,
  )
}

// Elements, shaded by stress.
for (const t of triangles) {
  const [a, b, c] = t.map((i) => nodes[i])
  const s = stress((a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3)
  const fill = 0.02 + 0.62 * Math.pow(s, 1.7)
  const stroke = 0.07 + 0.4 * s
  parts.push(
    `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}L${f(c[0])} ${f(c[1])}Z" fill="#fff" fill-opacity="${fill.toFixed(3)}" stroke="#fff" stroke-opacity="${stroke.toFixed(3)}" stroke-width="0.7" stroke-linejoin="round"/>`,
  )
}

// The outline, crisp.
const outline = []
for (const [k, uses] of edgeUse) {
  if (uses !== 1) continue
  const [a, b] = k.split(",").map((i) => nodes[Number(i)])
  // Only the true edge of the part, never the rim of a gap left in the mesh.
  if (Math.abs(sdf(...mid(a, b))) > 3) continue
  outline.push(`M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`)
}
parts.push(`<path d="${outline.join("")}" fill="none" stroke="#fff" stroke-opacity="0.75" stroke-width="1.4" stroke-linecap="round"/>`)

// Thrust out of the page at each motor.
for (const m of MOTORS) {
  parts.push(
    `<circle cx="${f(m.x)}" cy="${f(m.y)}" r="9" fill="none" stroke="#fff" stroke-opacity="0.85" stroke-width="1.4"/>`,
    `<circle cx="${f(m.x)}" cy="${f(m.y)}" r="2.6" fill="#fff" fill-opacity="0.9"/>`,
  )
}

// A scale bar, bottom left.
parts.push(
  `<g stroke="#fff" stroke-opacity="0.4" stroke-width="1.2">`,
  `<line x1="120" y1="${H - 110}" x2="320" y2="${H - 110}"/>`,
  ...[0, 50, 100, 150, 200].map((x) => `<line x1="${120 + x}" y1="${H - 116}" x2="${120 + x}" y2="${H - (x % 100 === 0 ? 100 : 106)}"/>`),
  `</g>`,
)

// Transparent ground: on the site the stars show through around the airframe.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join("")}</svg>`

const out = path.join(process.cwd(), "media-src", "phasm-airframe.png")
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out)
console.log(`${nodes.length} nodes, ${triangles.length} elements → ${path.relative(process.cwd(), out)}`)
