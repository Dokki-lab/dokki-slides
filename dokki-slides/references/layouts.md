# Layout system

Every layout is a named silhouette implemented in the core (`SLIDE_LAYOUTS`); `node scripts/dokki-slides.mjs layouts` lists them. Give a layout a **content JSON** and it returns positioned, lint-clean elements on the grid. Field names are shared across layouts:

```json
{
  "kicker": "WHY NOW", "title": "Claim title", "subtitle": "…", "body": ["…"], "body2": ["…"],
  "number": "42%", "label": "what it means", "quote": "…", "attribution": "…",
  "columns": [{ "title": "A", "body": ["…"] }], "steps": [{ "title": "Verb", "body": ["…"] }], "current": 1,
  "chart": { "chartType": "column|bar|line|area|pie|donut|scatter", "categories": ["Q1"], "series": [{ "name": "S", "values": [1] }] },
  "table": [["h1", "h2"], ["c1", "c2"]], "matrix": { "x": "axis", "y": "axis", "cells": ["q1", "q2", "q3", "q4"] },
  "imageSrc": "https://…", "imageAlt": "…", "footer": "Deck · date", "page": "07"
}
```

`body` lines become paragraphs or bullets depending on the layout; `steps`/`columns` are interchangeable names for named blocks; `current` highlights one step, layer or quadrant.

## Editorial silhouettes

| Layout | Best for | Relationship | Fields used |
|---|---|---|---|
| `cover-signal` | promise and framing | — | title, subtitle, kicker, footer |
| `statement` | one memorable thesis | — | quote (or title), body[0] as proof line |
| `section` | narrative turn | order | number, title, subtitle |
| `split` | claim + explanation with a supporting field | parent, contrast | title, body, body2 (right column bullets) |
| `data-hero` | one number that matters | — | number, label, body or chart |
| `comparison` | before/after, two choices sharing dimensions | contrast | title, columns[2] |
| `timeline` | dated change, milestones | order | title, steps[3–5], current |
| `process` | ordered actions | order | title, steps[3–5], current |
| `architecture` | system and its layers | parent, membership | title, steps[2–4] as layers, current |
| `chart-ledger` | quantitative evidence | — | title, chart, footer (source) |
| `table-ledger` | rows of evidence | membership | title, table, footer (source) |
| `image-hero` | the photograph or diagram is the evidence | — | imageSrc, title, body, kicker |
| `matrix` | two-axis decision | contrast, overlap | title, matrix, current |
| `closing-split` | the decision and next actions | — | title, subtitle, body (actions), footer |

Generic silhouettes (`title`, `title-body`, `two-column`, `image-right`, `big-number`, `quote`, `blank`) exist for other themes; prefer the editorial set for Dokki decks.

## Free design (`svg`)

When the information structure is not one of the above — a system map, a loop, a spatial metaphor, an annotated screenshot — author the slide as SVG under [`svg-contract.md`](svg-contract.md). Still keep the grid, the type anchors and the palette; the lint checks the result the same way.

## Selection router

- A single memorable assertion → `statement`.
- One decisive metric → `data-hero`; several values over categories → `chart-ledger`; rows with labels → `table-ledger`.
- Two options sharing dimensions → `comparison`; independent ideas → `split`.
- Ordered verbs → `process`; dated change → `timeline`; layers of a system → `architecture`; a network, a loop, or a scene → `svg`.
- Axes and quadrants → `matrix`.
- A photograph or diagram is the evidence → `image-hero`.

## Rhythm rules

- For 5+ slides use at least four distinct silhouettes; a 16-page deck normally uses eight or more.
- Never the same silhouette three times in a row (lint S16).
- Follow a `dense` page with a `breathing` one (statement, section, image-hero, or a sparse svg).
- Alternate scale and mass, not identity: palette, type, grid and chrome stay fixed.
