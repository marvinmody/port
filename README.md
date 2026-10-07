# marvinmody.me

Portfolio of Marvin Mody. Minimal by design: a black ground, one typeface to
read and title in, nothing drawn, everything on one grid, and motion that only
ever explains where you're going.

Next.js 15 (static export) · Tailwind CSS v4 · Lenis · ogl (WebGL2).

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

- **Home**: the name alone in the stars, and three facts along the bottom
  edge: what I'm doing now, where I study, and the time in New York.
- **Work**: every project in one looping row, seen through a pane of glass
  that's never drawn (`components/work-carousel.tsx`). Scroll, drag, swipe or
  use the arrow keys to move along it; the row bends where it meets the
  glass's edge, and the stars drift with it. Under the middle card, its title
  and one line of facts; along the bottom edge, the count. Clicking the middle
  card (or its title, or Enter) parts the row around it, and its image and
  title carry onto the project page. Without WebGL2 or script, the projects
  are a plain list.
- **Project** (`/work/<slug>/`): everything on one screen, nothing to
  scroll. The title, one sentence and one line of facts beside the image (on
  an upright tablet, above it), the story beneath with a column per
  paragraph, and the next project. The image takes exactly the room the
  screen leaves. Any scroll steps back out to Work: the image returns to the
  middle of the row and the rest fades in around it
  (`components/back-out.tsx`, `lib/recent.ts`). ← and → go to the previous and
  next project.
- **About**: an opening line, then Experience, Leadership, Education,
  Recognition and Capabilities, drawn from the résumé.
- **Contact**: a line, email (click to copy), elsewhere, availability.

About and Contact are rails: their sections sit side by side, a third of the
screen each, and scrolling carries you sideways through them (see Motion).

Logos live in `components/logo.tsx`: Phasm's mark inline as SVG, Zebra's
lockup as `public/logos/zebra.png`, both white on transparent. Attach one to
a project or About entry with `logo: "phasm" | "zebra"`. A logo that spells
its own name stands in for the name rather than repeating it.

Every fact appears once. Nothing is restated as a highlight or a callout,
and a project's details live on its own page (About links to it).

## Editing content

Everything you'd normally change lives in `content/`; components never need
touching for copy.

| File | What it holds |
| --- | --- |
| `content/site.ts` | Name, the home page's facts, email, location, availability, socials, an optional booking link and résumé link |
| `content/projects.ts` | The projects, in display order: year, role, links, summary, story and image |
| `content/about.ts` | Opening line, experience, leadership, education, recognition, capabilities |

**Before publishing**, search the repo for `PLACEHOLDER`. Those values are
educated guesses (years, roles, team sizes, the availability month, the booking
link) and need confirming.

The résumé PDF is not published, because it carries a phone number. To add a
link on the Contact page, put a copy without it in `public/` and set
`site.resume` to its path. "Book a call" appears there too once `site.booking`
holds a scheduling link.

## Images

1. Drop the source file in `media-src/`. Its file name (without extension)
   becomes its id, e.g. `media-src/rover.jpg` → `"rover"`.
2. Run `pnpm media`. It writes AVIF and WebP at several widths to
   `public/media/` and records sizes in `content/media.json`. Commit both, so
   the deploy never needs sharp. Images with transparency keep it.
3. Reference the id from `content/projects.ts` as a project's `hero`. Every
   image needs real `alt` text.

The Work row draws these same files (the list on that page loads them), so
an image is already cached when it carries over to its project page. Every
other page fetches them quietly once it has settled
(`components/warm-work.tsx`; never on a data-saving or slow connection), so
Work is ready the moment it opens. The row resizes each image to the size its
card is drawn at before it reaches the GPU.

## The system

- **Colour.** Black `#000`, ink `#ECECEC`, grey `#808080` (5.3:1, the lowest
  contrast used for text). The only line on the site is the one under a link.
- **Type.** Instrument Sans for reading (15px on phones, 13–14px from
  768px), for opening statements
  (`lead`) and, larger and drawn in a little, for titles (`display`,
  `title`): one voice raised, not a second one. Fragment Mono, Helvetica cut
  to a grid, in small capitals for labels, navigation and dates (`label`).
  Instrument Serif appears once, for the name on the home page (`name`).
  There are no other sizes.
- **Layout.** One 12-column grid under everything. The navigation sits on
  its thirds, and so does the rest: the home page's facts, a project's intro
  beside its image, the paragraphs of its story, and the sections of a rail
  (`components/panel.tsx`, `span` columns wide, a third by default), which
  land back on the grid whenever the arrow keys step through them. Air
  rather than rules between things.

## Phones

Everything works by touch: swipe the Work row, tap the middle card or its
title to open it, and inline links have a finger-sized target. Rails and
project pages stack and scroll as usual, top spacing shrinks on a phone held
sideways so nothing starts below the fold, and the Work row's glass grows on
narrow screens so the card in the middle stays flat. Hints say "Tap" and
"Swipe" where there's no pointer.

## Motion

All of it stops for `prefers-reduced-motion`: no smoothing, no transitions,
the stars hold still, and the Work row moves only when you move it, without
the liquid, fading in rather than rising.

- **Starfield** (`components/starfield.tsx`): one WebGL point cloud behind
  every page. Stars drift, scrolling moves the camera (sideways on a rail) so
  near stars pass faster than far ones, the pointer leans it, and each page
  change carries you a little way forward. On the home page the pointer bends
  the starlight around it like a lens. Full brightness there, quieter behind
  reading.
- **The name** (`components/name.tsx`): resolves letter by letter from the
  middle, then each letter hangs at its own depth and drifts against the
  pointer by its own amount.
- **The Work row** (`components/flex-carousel.tsx`, adapted from React Bits'
  FlexCarousel): the cards are drawn with WebGL2 into a texture, then through
  an invisible pane of glass that bends the row and splits the light where
  the row crosses its edge. Moving fast, the glass stretches like a liquid
  and the cards draw in; at rest it holds still. The row hands its motion to
  the stars. Cards rise in on arrival. A card being carried to or from its
  page is held back while a plain `<img>` stands in at exactly its place,
  which is what the page transition moves, so the hand-over can't be seen.
  The glass is tuned in `GLASS` in `components/work-carousel.tsx`.
- **Rails** (`components/rail.tsx`): the page scrolls down as usual while
  the rail pins to the screen and slides its sections left by the same
  distance, so the wheel, trackpad (either direction), keys and scrollbar all
  move you sideways. Sections ease back the further they are from the reading
  line, the arrow keys step between sections, and tabbing into one brings it
  on screen. On phones, short screens and with reduced motion, sections stack
  instead.
- **Scrolling**: Lenis smooths the wheel; touch keeps its native feel.
- **Page changes** (`components/transitions.tsx`): the View Transitions API.
  The old page dissolves forward while the new one rises in. Elements marked
  `data-morph="title" | "hero"` with a `data-slug` carry over between the
  Work page and the project page, both ways. Use the exported `Link` for
  internal links so they go through the transition.
- **Entrances**: `.reveal` for what's on screen when a page arrives (pure
  CSS, staggered with `--i`); `.in-view` for sections that come into view
  later, from the right on a rail.

## Credits

The Work row began as [FlexCarousel](https://reactbits.dev) from React Bits
(MIT), rewritten here in TypeScript to fit the site.

## Deploying

Pushing to `main` builds and deploys to GitHub Pages through
`.github/workflows/deploy.yml` (pnpm). "Updated" in the footer is the date of
the commit being built.
