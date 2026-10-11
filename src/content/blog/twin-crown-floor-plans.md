Twin Crown is a residential project, and buyers want to see a flat before it exists. For its sales site at [twincrown.co](https://twincrown.co) I built a floor-plan section that shows every unit layout three ways: the published drawing, a furnished plan from above, and a live 3D model you can turn and explore. This post covers how the eleven models were built and how the page stays fast with a WebGL scene on it.

## Eleven layouts, four blocks

The project has four blocks with eleven distinct layouts between them, covering all six configurations on the price list:

| Block | Units | Configuration | Super area, sq ft |
| --- | --- | --- | --- |
| C | 03, 04 | 4 BHK | 2,110 |
| C | 01, 02 | 3 BHK | 1,670 |
| D | 01, 03, 04, 06 | 3 BHK | 1,670 |
| D | 02, 05 | 2 BHK | 1,200 |
| E | 01, 06, 07 | 2 BHK | 1,200 |
| E | 02 | 2 BHK with study | 1,310 |
| E | 03, 04, 05 | 3 BHK | 1,670 |
| F | 01, 05 | 2 BHK | 1,200 |
| F | 02 | 2 BHK with pooja room | 1,245 |
| F | 03 | 3 BHK with store and mandir | 1,750 |
| F | 04 | 3 BHK | 1,670 |

A unit test holds every priced layout to exactly one model, so a new price-list entry without a model fails the build.

## Three views of each block

- **Master plan.** The block drawing from the project's published plans, in a sheet you can zoom and scroll.
- **2D plan.** A still image of the chosen layout's furnished model, seen from above.
- **3D model.** The same model, live. It turns slowly on its own. A room schedule down the side flies the camera to any room, and a switch shows room labels, off by default on phones.

## Ported, not embedded

The layouts were first modelled as standalone three.js pages. Dropping those pages into an iframe would have been quicker, but they would never have matched the site. Instead I ported them into a TypeScript engine inside the site:

- **Plan data** lives in one generated file: walls, doors, windows, room polygons with the drawing's own labels, and furniture, keyed by unit.
- **The engine** handles procedural textures, materials, furniture, openings, lighting and camera framing.
- **A small imperative viewer** ties them together, and React drives it. React owns everything around the canvas, including the room schedule, the label switch and the labels themselves, which the viewer only positions each frame.

I kept the model in plain three.js and did not rewrite it in react-three-fiber. It was a port of finished pages, and rebuilding them as a component tree would have been a second project.

## The canvas is transparent

My first version drew the dark background inside WebGL. It came out grey, because the background went through the same tone mapping as the scene. Now the canvas is transparent and the dark ground under it is plain CSS using the site's colour tokens, so the model sits on exactly the same colour as the rest of the section.

## 2D plans from the same engine

The 2D plan images are not drawn separately. A script opens a preview route in headless Chrome through Puppeteer, renders each furnished model from above at 3200 by 2000 pixels and saves it as WebP. The preview route returns 404 in production builds.

Because the stills and the live models come from the same code, they cannot drift apart. Changing a wall, a material or a label means re-running one script.

## Keeping the page fast

The floor-plan section is the only client island on the page. Every other section renders on the server and ships no JavaScript, so the three.js bundle loads only where the 3D model lives.

## The rest of the site

- **A sales chat** that answers in text or voice and streams replies over server-sent events.
- **A lead pipeline** that validates enquiries with Zod and writes them to MongoDB and Google Sheets. A Cloudflare Worker cron runs every 5 minutes to follow up on abandoned chats, because the Vercel Hobby plan only allows daily crons.
- **Design tokens** for every colour, type step and width in Tailwind 4, plus a custom `on-dark` variant so a component can set its own colour on dark sections.
- **104 Vitest test files**, including tests for the no-WebGL path, since the test environment has no WebGL context.

## What I learned

- **Port, do not embed, when the result must feel native.** It took longer and made everything else easier.
- **Render static assets from the live engine.** One source of truth for plans and models saved hours of manual re-exports.
- **Keep WebGL out of colour you care about.** Let CSS draw the background.
- **Ship JavaScript only where it earns its place.** One client island kept the rest of the page light.
