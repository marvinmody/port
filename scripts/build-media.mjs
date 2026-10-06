// Builds responsive AVIF and WebP variants for every image in media-src/ and
// writes content/media.json, which the <Img> component reads for srcset,
// intrinsic size and a solid placeholder colour.
//
//   pnpm media
//
// Outputs are committed, so the deploy never needs sharp. To add an image,
// drop it in media-src/ (the file name becomes its id) and run the script.
import { mkdir, readdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const ROOT = process.cwd()
const SRC_DIR = path.join(ROOT, "media-src")
const OUT_DIR = path.join(ROOT, "public", "media")
const MANIFEST = path.join(ROOT, "content", "media.json")
const WIDTHS = [480, 800, 1200, 1600, 2400]
const INPUT = /\.(png|jpe?g|webp|avif|tiff?)$/i

const hex = ({ r, g, b }) => "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")

async function build(file) {
  const id = path.parse(file).name
  const input = path.join(SRC_DIR, file)
  const image = sharp(input)
  const { width, height, hasAlpha } = await image.metadata()
  const { dominant, isOpaque } = await image.stats()

  // Never upscale; keep at least one variant for small sources.
  const widths = WIDTHS.filter((w) => w < width)
  if (widths.length === 0 || widths[widths.length - 1] < width) widths.push(width)

  const sources = { avif: [], webp: [] }
  for (const w of widths) {
    const resized = sharp(input).resize({ width: w, withoutEnlargement: true })
    const base = `${id}-${w}`
    await resized
      .clone()
      .avif({ quality: 58, effort: 5, chromaSubsampling: "4:4:4" })
      .toFile(path.join(OUT_DIR, `${base}.avif`))
    await resized
      .clone()
      .webp({ quality: 80, effort: 5 })
      .toFile(path.join(OUT_DIR, `${base}.webp`))
    sources.avif.push([w, `/media/${base}.avif`])
    sources.webp.push([w, `/media/${base}.webp`])
  }

  // A see-through image gets no placeholder colour: whatever is behind it shows.
  const color = hasAlpha && !isOpaque ? "transparent" : hex(dominant)
  return [id, { width, height, color, sources }]
}

const files = (await readdir(SRC_DIR)).filter((f) => INPUT.test(f)).sort()
await rm(OUT_DIR, { recursive: true, force: true })
await mkdir(OUT_DIR, { recursive: true })

const entries = []
for (const file of files) {
  const entry = await build(file)
  entries.push(entry)
  console.log(`  ${entry[0].padEnd(24)} ${entry[1].width}×${entry[1].height}  ${entry[1].sources.avif.length} sizes`)
}

await writeFile(MANIFEST, JSON.stringify(Object.fromEntries(entries), null, 2) + "\n")
console.log(`\n${entries.length} images → public/media, manifest → content/media.json`)
