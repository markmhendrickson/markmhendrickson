# Responsive archive hero

Use the same retained-record archive and five satellites in two deliberately authored arrangements. The date slip is a date record, not a raw-source document. People inspect records and authorized agents read/write only when pointed at the same configured instance. The user chooses connected tools and sources. The composition makes no automatic-ingestion, universal-access, autonomous-correctness or planned-governance claim.

## Ready assets

Producing repository: https://github.com/markmhendrickson/markmhendrickson. Use `archiveHero.sourceRepository` and each output’s `sourceRepository` with its exact `sourceCommit`; the top-level historical Neotoma donor provenance belongs to the retained older scenes. All paths below are relative to `react-app/`.

- Desktop: `public/images/posts/neotoma-paper/archive-hero-desktop.svg` and `.png` (SVG 900×600; PNG 1200×800).
- Mobile: `public/images/posts/neotoma-paper/archive-hero-mobile.svg` and `.png` (SVG 600×800; PNG 900×1200).
- Square: `public/images/posts/neotoma-paper/archive-hero-square.png` (1200×1200).
- Open Graph: `public/images/og/your-agents-need-a-system-of-record-archive-1200x630.jpg` (1200×630).
- Exact current source commit, hashes and output inventory: `public/images/posts/neotoma-paper/provenance.json`, under `archiveHero`, `outputSources`, `hashes` and `sourceInputsByCommit`.
- Original selected cutout, optimized alpha WebP, accepted prompt/attempt provenance: `src/dev/overhead-record/materials/archive-tray-overhead-v2.{png,webp}` and `src/dev/overhead-record/archive-material.json`.
- Geometry, opaque-border ports and material-native front-folder print window: `src/dev/overhead-record/archive-hero-geometry.json` and `scripts/generate-archive-hero.mjs`.

Standalone SVGs embed their exact materials. For inline use, prefer the corresponding trusted exports at `src/assets/neotoma-paper/published/archive-hero-{desktop,mobile}.svg` plus their content-addressed WebP dependencies under `public/images/posts/neotoma-paper/materials/`. Keep both SVGs as authored; do not crop the desktop banner into mobile. Square and OG use contain framing on the same neutral matte so no satellite or connector is lost.

## Receiving-site integration

Reuse the receiving site's existing trusted paper-SVG renderer and bounded viewport-motion observer. Preserve the exact material hashes and the fixed profiles above. Render both trusted inline variants with a unique instance-and-variant prefix for every declared ID, local URL/href and accessible title reference. Apply complementary CSS before hydration: mobile visible by default, desktop hidden; at min-width 640px, desktop visible and mobile hidden. The inactive wrapper must use `display:none` so it is neither announced nor animated. Do not introduce viewport-detection JavaScript.

The reference implementation is `src/components/PaperArtwork.tsx`, its `[data-paper-responsive-variant]` CSS in `src/index.css`, and `src/lib/paperVisualMotion.ts`. Retain its shared two-scene FIFO budget, actual viewport entry/re-entry, fixed orientation, cancellation on exit/layout switch, reduced-motion/hidden-page handling and complete authored static fallback. Ports are rust, centered on alpha-200 photographic object borders; sage paths occupy the gaps, and ports appear only after the corresponding line finishes drawing. Keep all prints inside their material face windows. Both archive rules share the frontmost cream folder; their safe region is native x245–1000/y980–1075, scaled from the photographic crop.

Suggested English alt: “An overhead archive of retained records connects with a person dossier, task clipboard, conversation, agent and date record.” Suggested caption: “People can inspect retained records while authorized agents read and write against the same configured Neotoma instance. You choose which tools and sources to connect.” Localize these outside the artwork.

The existing detailed graph remains unchanged at `/images/posts/neotoma-paper/hero.svg` and is now an entity-relationships body explainer. The invoice/email/two-observation/current-record scenes and three capability cards are unchanged. Site placement and surrounding homepage copy remain the receiving site's responsibility.

## Reproduction and checks

From `react-app/`, with Node 20 and locked dependencies:

```sh
node scripts/generate-archive-hero.mjs
node scripts/export-paper-artwork.mjs --archive-hero <exact-reachable-source-commit>
python3 scripts/publish_overhead_inline_artwork.py
python3 scripts/publish_overhead_inline_artwork.py --check
node --test scripts/archive-hero.test.mjs scripts/paper-visual-motion.test.mjs scripts/paper-production-motion.test.mjs
SKIP_WEBSITE_CACHE_REGEN=1 npm run build:ci
```

The normal local essay route shows the responsive hero. Its existing dev-only image/OG footer also includes homepage-sized desktop/mobile proof frames; no new public proof route is introduced. Qualify 320/390/wide, first paint without JavaScript, reduced motion, missing WAAPI/IntersectionObserver, re-entry/layout switching, dark/light surrounding UI, all six retained scenes, complete Markdown, and the exact frozen source/outputs before deployment.
