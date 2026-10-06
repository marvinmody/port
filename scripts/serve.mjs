// Serves the static export in out/ the way GitHub Pages does: directory
// index files, trailing slashes, and 404.html for anything missing.
//
//   pnpm build && pnpm preview        →  http://localhost:4173
import { createReadStream } from "node:fs"
import { stat } from "node:fs/promises"
import { createServer } from "node:http"
import path from "node:path"

const ROOT = path.resolve("out")
const PORT = Number(process.env.PORT ?? 4173)
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
}

async function resolve(urlPath) {
  const clean = path.normalize(decodeURIComponent(urlPath.split("?")[0])).replace(/^(\.\.[/\\])+/, "")
  let file = path.join(ROOT, clean)
  if (!file.startsWith(ROOT)) return null
  try {
    const info = await stat(file)
    if (info.isDirectory()) file = path.join(file, "index.html")
    await stat(file)
    return file
  } catch {
    return null
  }
}

createServer(async (req, res) => {
  const file = await resolve(req.url ?? "/")
  const target = file ?? path.join(ROOT, "404.html")
  res.writeHead(file ? 200 : 404, {
    "Content-Type": TYPES[path.extname(target)] ?? "application/octet-stream",
    "Cache-Control": "no-cache",
  })
  createReadStream(target).pipe(res)
}).listen(PORT, () => console.log(`Serving out/ on http://localhost:${PORT}`))
