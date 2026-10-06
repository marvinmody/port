# marvinmody.me

Portfolio of Marvin Mody. Minimal by design: a black ground, three voices,
a 12-column grid, and motion that only ever explains where you're going.

Next.js 15 (static export) · Tailwind CSS v4 · Lenis.

## Commands

```sh
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # static export to out/
pnpm preview    # serve out/ the way GitHub Pages does, on :4173
pnpm media      # rebuild responsive images after changing media-src/
pnpm typecheck
```

## Pages

- **Home**: the name over the starfield, one line, and three facts along the
  bottom edge: what I'm doing now, where I study, and the time in New York.
- **Work**: the projects as an index. Hovering a row wipes its image into the
  preview; choosing one carries its title and image onto the project page.
- **Project** (`/work/<slug>/`): title, summary, facts, the image, then
  Context, Problem, Approach and Outcome with results.
- **About**: an opening statement, four figures, then Experience, Leadership,
  Education, Recognition and Capabilities, drawn from the résumé.
- **Contact**: email (click to copy), elsewhere, location, availability.

## Editing content

Everything you'd normally change lives in `content/`; components never need
touching for copy.

| File | What it holds |
| --- | --- |
| `content/site.ts` | Name, tagline, the home page's "Now" line, email, location, availability, booking link, socials, an optional résumé link |
| `content/projects.ts` | The projects, in display order: facts, copy, results and images |
| `content/about.ts` | Opening statement, figures, experience, leadership, education, recognition, capabilities |

**Before publishing**, search the repo for `PLACEHOLDER`. Those values are
educated guesses (years, roles, team sizes, the availability month, the booking
link) and need confirming.

The résumé PDF is not published, because it carries a phone number. To add a
link on the About and Contact pages, put a copy without it in `public/` and set
`site.resume` to its path.

## Images

1. Drop the source file in `media-src/`. Its file name (without extension)
   becomes its id, e.g. `media-src/rover.jpg` → `"rover"`.
2. Run `pnpm media`. It writes AVIF and WebP at several widths to
   `public/media/` and records sizes in `content/media.json`. Commit both, so
   the deploy never needs sharp. Images with transparency keep it.
3. Reference the id from `content/projects.ts` as a project's `hero`, or under
   `images` to place it after a section. Every image needs real `alt` text.

The Phasm image is generated: `node scripts/build-phasm.mjs` draws the
airframe mesh into `media-src/phasm-airframe.png`, then run `pnpm media`. It's
an illustration; swap in a real screenshot when there is one.

## The system

- **Colour.** Black `#000`, ink `#ECECEC`, grey `#808080` (5.3:1, the lowest
  contrast used for text), hairlines `#1C1C1C`.
- **Type.** Instrument Serif for the name, titles and figures. Geist for
  reading, at 12.5–13.5px. Geist Mono in capitals for labels and numbers
  (`label`). Opening statements use `lead`. There are no other sizes.
- **Grid.** 12 columns (4 on phones). The thirds, columns 1, 5 and 9, anchor
  the navigation and every block: `t1`, `t2`, `t3` place a block on a third,
  `t23` spans the second and third. Content pages are rows: a hairline, the
  label on the first third, the content beside it (`components/row.tsx`).

## Motion

All of it stops for `prefers-reduced-motion`: no smoothing, no transitions,
the stars hold still.

- **Starfield** (`components/starfield.tsx`): one WebGL point cloud behind
  every page. Stars drift, scrolling moves the camera so near stars pass
  faster than far ones, the pointer leans it, and each page change carries
  you a little way forward. Full brightness on the home page, quieter behind
  reading.
- **Scrolling**: Lenis smooths the wheel; touch keeps its native feel.
- **Page changes** (`components/transitions.tsx`): the View Transitions API.
  The old page dissolves forward while the new one rises in. Elements marked
  `data-morph="title" | "hero"` with a `data-slug` carry over between the
  Work list and the project page. Use the exported `Link` for internal links
  so they go through the transition.
- **Entrances**: `.reveal` for what's on screen when a page arrives (pure
  CSS, staggered with `--i`); `.in-view` for blocks that rise in as they
  scroll up into view. Images drift slightly inside their frames (`.drift`).

## Deploying

Pushing to `main` builds and deploys to GitHub Pages through
`.github/workflows/deploy.yml` (pnpm). "Updated" in the footer is the date of
the commit being built.
