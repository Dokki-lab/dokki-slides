# Design contract — the Dokki Editorial Grid

Editorial narratives, not miniature dashboards: quiet paper, decisive ink, one signal red, visible structure, generous whitespace. The canvas is 1920×1080 px; 1 px here is 0.5 pt in PowerPoint.

## 1. Communication contract

Six fields, confirmed before any visual decision (blanks are honest; never invent):

| Field | Question |
|---|---|
| Audience | Who decides or acts after this? |
| Intent | inform · align · persuade · decide · teach |
| Outcome | What should they believe or do next? |
| Core message | One sentence the deck exists to land |
| Delivery context | Presented live (large room / screen share) or read alone; that sets density and type size |
| Language | BCP-47; CJK decks use the CJK font stack and shorter lines |

Then one **direction**: narrative angle, layout behaviour, image strategy, tone. Offer alternatives only when asked.

## 2. Semantic types — how binding is each instruction

| Type | Meaning | Example |
|---|---|---|
| **Literal** | reproduce exactly | a quoted number, a brand name, a legal line |
| **Semantic** | keep the meaning, wording may change | "explain why now" |
| **Reference** | free to replace with no justification | "something like a timeline" |
| **(binding)** | suffix that turns any field Literal | "title (binding)" |

Default is Semantic. Write the type next to anything that is not.

## 3. Roster rules

- Every slide has an **audience move**; none, then merge or cut.
- **Rhythm** per slide: `anchor` (cover, section, statement, closing), `dense` (evidence), `breathing` (one idea, lots of air). Never three `dense` in a row; follow evidence with air.
- **Relationships** name the information structure before geometry: `order` (steps, time), `link` (A affects B), `parent` (system and parts), `membership` (categories), `contrast` (before/after, us/them), `overlap` (shared ground). The relationship picks the silhouette (see layouts.md), and it is what the carrier receipt is reconciled against.
- Claim titles, not topic labels. Sources and talk track go to speaker notes.

## 4. Palette by role (theme `dokki-editorial`)

| Role | Hex | Use |
|---|---|---|
| Canvas (`background`) | `#F7F8F5` | slide background |
| Paper (`surface`) | `#FFFFFF` | inset planes, tables |
| Ink (`text`) | `#1A1A1A` | primary type, structure, dark fields |
| Muted | `#666666` | secondary copy, metadata |
| Signal (`accent`) | `#F50132` | one focal point or state change per slide |
| Dark (`accent2`) | `#050706` | high-contrast fields |
| Line (`accent3`) | `#D6D7D2` | hairlines, quiet separation |

Body contrast ≥ 4.5:1; large text (≥ 36 px, or ≥ 28 px at weight 600) ≥ 3:1 — the lint enforces this against the real backdrop. No gradients, glow, glass or drop shadows in this theme; no purple or blue. Signal red on at most one object per slide; never on body text.

## 5. Typography anchors (px on the 1920 canvas)

| Role | Size | Weight | Notes |
|---|---|---|---|
| Display (cover, statement) | 96–112 | 300–500 | leading 1.05–1.15, tracking −1 |
| Title | 64–80 | 500 | leading 1.1 |
| Lead / subtitle | 48 | 400 | muted |
| Body | 36 | 400 | leading 1.3–1.45; ≥ 24 px is the floor for anything that must be read from a distance |
| Label / kicker | 28–32 | 600 | kicker is uppercase with +2 tracking |
| Meta / footnote | 24–28 | 400 | muted; never below 18 px |

A new size is allowed twice deck-wide before it becomes a named role. Never shrink copy to rescue a crowded slide: restructure, shorten, split, or reflow first.

## 6. Grid and chrome

12 columns, 120 px margins, 24 px gutters. Column left edges:

`120 262 404 546 688 830 972 1114 1256 1398 1540 1682` (span of n columns = n·142 − 24)

Content field y = 168 … 940; kicker at y = 72; footer line at y = 992 (deck name left, page number right). Add a running footer only when it carries identity or navigation.

## 7. Composition defaults

- Establish the usable field first, divide it into few macro-regions by information weight; unequal regions for unequal information.
- Alignment carries hierarchy: related things share an axis, unrelated things do not; break an axis only to perform direction or tension.
- Boundaries from weakest to strongest: spacing → hairline → tint field → outline → filled plane → dark field. Peers share one strength.
- Prefer hairlines, planes and one strong scale contrast over rounded cards. Three or more identical rounded cards on a slide is a defect (lint S14).
- Images are evidence, atmosphere or spatial anchors — decide which before sourcing; keep aspect ratio; give overlaid type a scrim or a plane.
- Charts express real quantitative structure; never invent a metric to fill a data layout. Prefer the fewest series that make the claim.
- Density: about 60 words per text box at most (lint S11), ~18 elements per slide (S12); split before you shrink.

## 8. Forbidden

Repeating symmetric card grids without a page job · equal columns chosen for convenience · prose converted into bullets to fit · "Thank you" closing slides · decorative charts · inventing a topology from node count · signal red spread across objects · text smaller than 18 px anywhere.
