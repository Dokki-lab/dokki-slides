# Dokki publishing contract

Dokki Slides uses existing resources; it does not create a new presentation resource type.

1. Package the deck locally and record its `deckRevision`.
2. Upload `exports/<slug>.pptx` as a Dokki File with metadata containing `kind=dokki-slides-export`, `protocol=dokki-slides@1`, and the same revision.
3. Obtain the stable File resource route, not a short-lived signed download URL.
4. Package again with that route as `--export-url`.
5. Create or update a normal HTML Artifact from `index.html`, with metadata containing `kind=dokki-slides`, `protocol`, `deckRevision`, and the companion File resource id.
6. Read both resources back. The revisions must match before returning success.

When updating, never replace only one side. If one write fails, report the partial state and retry safely using the same revision rather than inventing a newer revision.

