# SVG contract — free-design slides that stay editable

One `<svg>` per slide on `viewBox="0 0 1920 1080"`. The importer (`importSvgSlide` in the core, `dokki-slides svg` locally, `add_slides:[{svg}]` in Dokki) turns it into layered, editable elements in **document order = layer order**. It is fail-soft: what the contract names becomes an element; anything else is dropped and reported as a warning, never rasterised.

## Elements

| SVG | Becomes | Notes |
|---|---|---|
| `<rect x y width height [rx]>` | shape `rect` / `roundRect` | `rx` → corner radius |
| `<circle cx cy r>` `<ellipse cx cy rx ry>` | shape `ellipse` | |
| `<line x1 y1 x2 y2>` | shape `line` / `arrow` | `marker-end` / `marker-start` (any value) or `data-arrow="end\|start\|both"` → arrowheads |
| `<polygon points>` `<polyline points>` | shape `path` | `data-shape="triangle\|rightTriangle\|diamond\|pentagon\|hexagon\|star\|arrowRight\|chevron"` → the named preset instead |
| `<path d>` | shape `path` | M L H V C S Q T A Z, absolute or relative; the bbox becomes the element frame |
| `<text x y>` + `<tspan>` | text | see below |
| `<image href x y width height>` | image | `href` must be `https://…`, a `data:image/…` URI or a `/brand/…` path; `preserveAspectRatio` `slice` → cover, `meet` → contain, `none` → stretch; `rx` → corner radius |
| `<g data-chart='{"chartType":"column","categories":[…],"series":[{"name":"…","values":[…]}]}' data-box="x y w h">` | chart | children are ignored (draw a placeholder for your own preview) |
| `<g data-table='{"rows":[["h","h"],["c","c"]],"headerRow":true}' data-box="x y w h">` | table | |
| `<g data-group data-name="…">` … `</g>` | group | children stay individually editable; nests |
| `<defs><linearGradient id="g" x1 y1 x2 y2><stop offset stop-color/>…` + `fill="url(#g)"` | gradient fill | `radialGradient` is approximated as linear |

Per element: `id` (kept when it is `[A-Za-z0-9][A-Za-z0-9._-]{0,63}` and unique), `data-name` (layer name), `data-locked`, `data-hidden`, `opacity`, `fill` / `fill-opacity`, `stroke` / `stroke-width` / `stroke-dasharray` (→ dashed / dotted), `transform="translate(tx ty) rotate(a [cx cy])"`. `scale()` is ignored with a warning — draw at canvas size.

## Text

- One `<text>` per text box. Give it `data-box="x y w h"` so the frame is exact; without it the frame is estimated from the glyph count (fine for one-liners, poor for paragraphs).
- Lines: a `<tspan>` with its own `x` or `dy` (or `data-line`) starts a new paragraph. Runs: `<tspan font-weight="bold|600+" fill="#…" font-size="…" font-style="italic">` inside a line.
- `font-size`, `fill`, `font-weight`, `font-family`, `text-anchor` (`middle` → centered, `end` → right) on `<text>` set the box defaults; `data-valign="middle|bottom"`, `data-line-height="1.3"` are honoured.
- Sizes are canvas px (36 = body). Keep body ≥ 24 px, metadata ≥ 18 px.

## Not supported (dropped with a warning)

`<use>`, `<symbol>`, `<clipPath>`, `<mask>`, `<filter>`, `<pattern>`, `<foreignObject>` without `data-chart`/`data-table`, `<style>`/`class`-based styling, CSS `transform`, `textPath`, animation, scripts. Style with attributes or inline `style="fill:…;stroke:…"`.

## Authoring discipline

- Draw on the grid (columns at 120 + 142·i) with the palette from design.md; the lint runs on the imported elements exactly as on layout slides.
- Name the layers people will touch (`data-name="Customer node"`); group what moves together (`data-group`).
- Prefer a named preset (`data-shape`) over a hand-drawn polygon when the silhouette is standard: presets get real corner handles in the editor.
- Icons: paste path data from an MIT/CC0 set (Tabler, Phosphor) as `<path>` inside a `data-group`, scaled to a 48–96 px box; do not embed raster icons.
- Put explanatory copy in `<text>`, not inside the drawing; the receipt counts words per slide.
