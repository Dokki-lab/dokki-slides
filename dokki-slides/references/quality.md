# Quality — lint, review, receipt

## Lint (deterministic, `check` / `package`, and `slides_update` in Dokki)

Hard — fix every hit:

| Rule | Trigger |
|---|---|
| H1 | element beyond the canvas (full-bleed backgrounds excepted) |
| H2 | text needs more height than its box (estimated from glyph widths) |
| H3 | two text boxes overlap by more than 8 px |
| H4 | contrast < 4.5:1 (small) / < 3:1 (large: ≥ 36 px, or ≥ 28 px at weight 600) against the real backdrop; text directly on an image with no plane |
| H5 | text below 18 px |
| H8 | image source not https / data / brand path |
| H9 | chart with no data |

Soft — act only when clearly bad; under-fixing beats oscillation:

| Rule | Trigger |
|---|---|
| S0 | body-length copy below 24 px |
| S4 | left edges 1–12 px apart (grid drift) |
| S11 | more than 60 words in one text box |
| S12 | more than 18 elements on a slide |
| S13 | empty slide |
| S14 | three or more identical rounded cards |
| S15 | content stranded in a quarter of the slide |
| S16 | the same layout three times in a row |

Gate cadence: run `check` after the first five slides and at the end, then one consolidated repair pass. Two same-direction findings mean the rule you are applying is wrong (a type anchor, a column width) — fix the rule and re-derive, not the instance.

## Don't-touch while repairing

Content (no added or removed copy), brand tokens, the roster (order, count, layouts), other slides. Repairs are position, size within the role's band, spacing, alignment, a plane under text. One edit per finding.

## Visual pass (human or agent with a browser)

Open `dist/previews/index.html` at 16:9 and page through; then at a narrow portrait width the whole stage must scale as one unit. Look for: hierarchy readable at thumbnail scale, one primary element per slide, alignment on shared axes, negative space that is organised (gutters, voids between clusters) rather than leftover, images that carry evidence, and rhythm across the deck (dense → breathing).

## Carrier receipt

`quality-report.json` → `receipt` lists, per slide, the counts of text / shapes / lines / paths / gradients / images / charts / tables / groups and the word count. Reconcile it against the roster: a slide whose relationship is `order` or `link` with no line, arrow or group; a `dense` slide with one text box and 120 words; a `data` role with no chart or table — each needs a written reason or a fix. "Text was enough" is not a reason.

Delivery language must distinguish what the lint proved from what a person looked at.
