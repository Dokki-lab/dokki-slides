# Dokki Slides

Open-source presentation skill for Dokki, Claude Code, Codex and any agent that runs Node 18+. It designs and builds **native Dokki decks**: a layered, editable scene graph — text, shapes, SVG paths, images, charts, tables, groups — on a 1920×1080 canvas, published as a Dokki Slide that opens in the canvas editor and exports editable PPTX from there.

## What changed in v2

- The deck is a scene graph (`deck.json`), not an HTML string; `index.html` is derived from it.
- Fourteen named silhouettes of the Dokki Editorial Grid ship as real layouts: give them content, they place it on the grid, lint-clean.
- Free design: author any slide as SVG under a closed contract and every shape, path, text and image becomes its own editable layer.
- A deterministic lint (bounds, overflow, overlap, WCAG contrast, size floors, card grids, rhythm) runs locally and inside Dokki's `slides_update`.
- The same core runs everywhere: `dokki-slides/scripts/vendor/dokki-slides-core.mjs` is built from Dokki's `lib/slides`.

## Install

```bash
npx skills add Dokki-lab/dokki-slides --skill dokki-slides
```

## Try it

```bash
node dokki-slides/scripts/dokki-slides.mjs init /tmp/deck --title "Hello"
node dokki-slides/scripts/dokki-slides.mjs layouts
node dokki-slides/scripts/dokki-slides.mjs package /tmp/deck/deck.json --out-dir /tmp/deck/dist
open /tmp/deck/dist/index.html
```

See `examples/angel-round/` for a full deck built with the workflow in `dokki-slides/SKILL.md`.

## Update the vendored core

From a Dokki checkout: `node scripts/build-slides-core.mjs path/to/dokki-slides/dokki-slides/scripts/vendor/dokki-slides-core.mjs`. The bundle header records the Dokki revision; `quality-report.json` repeats it as `core`.

## Layout

- `dokki-slides/` — the skill: `SKILL.md`, `references/`, `scripts/dokki-slides.mjs`, `scripts/vendor/`
- `examples/` — decks built with the skill
- `test/` — CLI tests (`pnpm test`)

MIT.
