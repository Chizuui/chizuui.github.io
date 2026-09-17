# chizz.ui — editorial portfolio

A static portfolio for GitHub Pages. The homepage uses a progressively enhanced
Three.js poster gallery; the archive and contact section are ordinary HTML.

## Preview locally

1. Run `npm ci`.
2. Run `npm run dev`.
3. Open `http://127.0.0.1:4173/`.

Use HTTP rather than opening `index.html` as a `file://` URL: browsers restrict ES
modules and WebGL textures on local-file origins.

## GitHub Pages

No server, framework, or build step is required on GitHub Pages. Publish this
repository's root with the existing Pages configuration. Keep these files together:

- `index.html`, `style.css`, `script.js`, `gallery.js`, `gallery-scene.js`
- `Assets/` (including `Assets/Preview/`)
- `vendor/three/` (the bundled Three.js module and license)
- `CNAME` for the existing custom domain

All application assets use relative paths. Node, Python, `node_modules`, tests,
QA reports, and development tools are not runtime requirements. Three.js is served
from the same site, not a third-party CDN. Google Fonts is optional; local font
fallbacks keep the site readable if font downloads fail.

## Interaction and fallback

- Drag or swipe the poster gallery; use arrow buttons or keyboard arrows to browse.
- Click the selected poster or “Take a closer look” to open the full-size artwork.
- Home/End jump to the first/last poster. Enter opens the selected work.
- Poster and other-work previews support previous/next and Escape. Dialogs contain
  keyboard focus and return it to the triggering control.
- “Pause motion” stops the floating animation. “Use simple view” releases WebGL.
- The renderer pauses while outside the viewport, behind a dialog, or in a hidden
  tab. Its drawing buffer is capped; animation is limited to 30fps.
- Reduced-motion and data-saving preferences start without downloading Three.js.
  The user can opt into the 3D view. View and motion choices are stored locally
  when storage is available.
- WebGL initialization, texture, or context failures leave the HTML fallback and
  controls available. With JavaScript disabled, navigation and original poster
  links still work.

## Artwork maintenance

The poster archive in `index.html` is the source of truth for image order, alt text,
and original links. `data-preview` points to the smaller texture used by the scene.
Keep original full-resolution artwork in `Assets/Poster/` for the preview dialog.

To regenerate the small textures, install Pillow in your Python environment and
run `python tools/prepare-previews.py`. This creates bounded 640×800 WebP copies and
updates `tools/preview-manifest.json`; original assets are never overwritten.

To change Three.js, update the pinned dependency and lockfile, then run
`npm run vendor`. The script bundles the used exports into `vendor/three/` and
retains the upstream MIT license. Commit the generated vendor output together
with the source when you choose to publish.

## Verification

- `npm run check` — JavaScript syntax checks.
- `npx playwright install chromium` — install the browser for testing.
- `npm test` — desktop/mobile behavior, rendering, accessibility, and resilience.
- `node tools/review.mjs` — capture visual evidence in ignored `qa-output/` while
  the local server is running.

Browser tests use Chromium with a mobile viewport/touch emulation; they are not a
claim of testing on physical iPhones, Android devices, or Safari. Axe checks cover
selected WCAG A/AA rules, not a complete accessibility certification.
