# VANGUARD

Fullscreen hero landing page for a fictional creative agency. React + TypeScript +
Tailwind CSS, built with Vite. Single viewport-height section with a looping
background video and all content overlaid.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check, then bundle to dist/
npm run preview  # serve the production build
```

## Structure

- `src/App.tsx` -- the whole page. One component, `useState` for the mobile menu.
- `src/index.css` -- Tailwind layers, the `fade-up` / `fade-in` / `scale-in`
  keyframes, and the staggered `animate-*` utilities.
- `tailwind.config.js` -- registers `fontFamily.podium` and `fontFamily.inter`.
- `index.html` -- loads Inter from Google Fonts and PODIUM Sharp from
  onlinewebfonts.

## Notes

- The background video is an external CloudFront URL. It needs outbound network
  access to play; there is no local fallback asset.
- The legibility scrim is a single `div` in `App.tsx` marked with a comment.
  Delete it to show the raw video.
- Entrance animations are disabled under `prefers-reduced-motion: reduce`.
