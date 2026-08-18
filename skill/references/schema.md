# `dokki-slides@1` schema

Use `schemas/presentation.schema.json` as the machine-readable contract.

## Deck

- `schemaVersion`: exactly `dokki-slides@1`.
- `deckRevision`: stable revision shared by the HTML and PPTX outputs.
- `title`, `locale`, `theme`, and `slides` are required.
- The v1 canvas is 1920×1080 and exports to PowerPoint wide (13.333×7.5 inches).

## Theme

Define `background`, `surface`, `text`, `muted`, `accent`, `fontFamily`, and `fontFamilyCjk`. Colors are six-digit hex values without `#` in PPTX and may include `#` in authored JSON.

## Slides

Each slide needs a stable `id`, optional `title`, `notes`, `background`, and ordered `elements`. Notes may contain a `[Sources]` block.

Every element has `id`, `type`, `x`, `y`, `w`, `h`, and optional `z`, `opacity`, and `rotation`. Coordinates are design pixels on the 1920×1080 canvas.

Supported types:

- `text`: `text`, font size, color, weight, alignment, vertical alignment, bullets.
- `shape`: rectangle, rounded rectangle, ellipse, line; fill and line styles.
- `image`: local path or data URI plus crop mode and alt text.
- `table`: rows, column widths, header styling.
- `chart`: bar, line, pie, doughnut; categories and named numeric series.
- `html`: sanitized HTML/CSS for web rendering and a required `fallbackImage` for PPTX.

Unknown element types are validation errors. Elements outside the canvas are errors, not warnings.

