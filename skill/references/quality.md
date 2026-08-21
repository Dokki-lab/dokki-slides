# Rendered quality review

Validation is necessary but not visual proof. Review the generated HTML and rendered PPTX page by page.

## P0 — must fix

- Any element outside the canvas, clipped text, accidental overlap, or unreadable contrast.
- A missing image, stretched image, broken chart, displaced rail, or export button that does not resolve.
- Different content, order, or revision between HTML and PPTX.
- Body text below 18 pt, captions below 16 pt, or metadata below 14 pt.
- A slide with no obvious primary message.
- A generic card dashboard, decorative chart, or unsupported claim presented as fact.

## P1 — polish before delivery

- Grid drift, inconsistent margins, weak vertical rhythm, or an anchor that does not land on the intended column.
- Competing red accents or excessive black mass.
- Three adjacent slides with the same silhouette.
- A title that describes a topic instead of making a claim.
- A crowded slide that should be split, or a thin slide padded with decoration.
- CJK line breaks, tracking, or weights that look accidental.
- A source, caption, or footnote detached from the evidence it qualifies.

## Required review loop

1. Run `validate` and resolve every error.
2. Run `package` and open the HTML at 16:9 desktop size.
3. Inspect every slide at a narrow portrait viewport; the complete 16:9 stage must scale as one unit.
4. Render or open the PPTX and inspect every page, not only the first.
5. Compare HTML and PPTX for content, hierarchy, editability, and `deckRevision`.
6. Make at least one deliberate visual-review pass after the first successful render.

The quality report records structural checks. Delivery language must distinguish automated validation from human visual inspection.
