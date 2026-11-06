This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Cursor swarm

On the home page a swarm of 16 multiplayer-style cursors (8 on mobile) builds
the site live: they type the text, drag out the cards, drop in the images and
pop in the tags, one screen at a time as you scroll.

- Wrap any element in `<Build>` from `src/components/Swarm/Build.tsx` to hand it
  to the swarm. Pass `as` for the tag and `kind` for how it is built: `text`,
  `block`, `image` or `pop`. The markup stays exactly the same.
- The engine is `src/components/Swarm/engine.ts`; the cursors, wireframe and
  progress pill are drawn by `SwarmOverlay.tsx`.
- Visitors who prefer reduced motion, crawlers and every page except `/` get
  the normal site. `?swarm=0` turns the swarm off and `?swarm=1` forces it on.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
