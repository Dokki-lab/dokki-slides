# `dokki-slides@1` schema

Use `schemas/presentation.schema.json` as the machine-readable contract.

## Deck

- `schemaVersion`: exactly `dokki-slides@1`.
- `deckRevision`: stable revision shared by the HTML and PPTX outputs.
- `title`, `locale`, `theme`, and `slides` are required.
- The v1 canvas is 1920×1080 and exports to PowerPoint wide (13.333×7.5 inches).

## Theme

Define `background`, `surface`, `text`, `muted`, `accent`, `fontFamily`, and `fontFamilyCjk`. Colors are six-digit hex values without `#` in PPTX and may include `#` in authored JSON.

New Dokki decks use `style: "dokki-editorial"` and also define `line`, `dark`, and `accentOn` with the exact role tokens in `design.md`. Use `style: "custom"` only when a user explicitly supplies another visual identity.

## Slides

Each slide needs a stable `id`, optional `title`, `notes`, `background`, and ordered `elements`. In Dokki editorial mode, it also needs a named `layout`, narrative `role`, and one-sentence `intent`. Notes may contain a `[Sources]` block.

Every element has `id`, `type`, `x`, `y`, `w`, `h`, and optional `z`, `opacity`, and `rotation`. Coordinates are design pixels on the 1920×1080 canvas. `fontSize` is always points: the HTML renderer maps one point to two design pixels, while PPTX uses the authored point value directly.

Supported types:

- `text`: `text`, `textRole`, font size, color, weight, style, tracking, line height, alignment, and vertical alignment. Mark exactly one element on every editorial slide as `primary: true`.
- `shape`: rectangle, rounded rectangle, ellipse, line; fill and line styles.
- `image`: local path or data URI plus crop mode and alt text.
- `table`: rows, column widths, header styling.
- `chart`: bar, line, pie, doughnut; categories and named numeric series.
- `html`: sanitized HTML/CSS for web rendering and a required `fallbackImage` for PPTX.

Unknown element types are validation errors. Elements outside the canvas are errors, not warnings.
