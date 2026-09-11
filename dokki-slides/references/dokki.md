# Publishing to Dokki

A native deck is a Dokki **Slide** (`artifact_variant: "slide"`) whose source is the derived `index.html` — it carries the marker `<!-- dokki-slide-canvas@1 -->` and the deck snapshot, so Dokki opens it in the canvas editor and seeds the scene graph from it.

1. `node scripts/dokki-slides.mjs package deck.json --out-dir dist` — stop if `lint.ok` is false.
2. Create the Slide with the `create` facade (`action: "artifact"`, `artifact_variant: "slide"`, `source: <contents of dist/index.html>`, `name`, `workspace_id`, optional `metadata: { producer: "dokki-slides@2", core: <quality-report core> }`). In a sandbox, push `dist/index.html` with `sandbox_push_artifact` and `artifact_variant: "slide"` instead of reading it back through the model.
3. Verify the response reports `artifact_variant: "slide"` and a `/slide/<resource-id>` route. A generic `/artifact/…` route is a defect: stop and report it.
4. Read it back with `slides_read` (facade `read`, `action: "slides"`): it returns the slides, elements, `lint` and `state_hash`. From here on, revise with `slides_update` (`action: "slides.update"`): `ops` for edits, `add_slides:[{layout, content}]` or `add_slides:[{svg}]` for new pages, `validate_only: true` to preflight. Do not `artifact_update` a native deck — the HTML is derived and the write is refused.
5. PPTX: the Slide's Export button (`POST /api/slides/export`) builds it from the live deck; do not ship a separate PPTX file.

Return only the links Dokki gave you. When a write fails, report the partial state and retry with the state hash from a fresh `slides_read`; never repeat a call with unchanged arguments.
