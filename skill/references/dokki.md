# Dokki publishing contract

Dokki Slides uses existing resources; it does not create a new presentation resource type.

1. Package the deck locally and record its `deckRevision`.
2. Upload `exports/<slug>.pptx` as a Dokki File with metadata containing `kind=dokki-slides-export`, `protocol=dokki-slides@1`, `sourceSkill=github.com/Dokki-lab/dokki-slides`, `sourceRevision=<immutable Skill commit>`, and the same `deckRevision`. Pass the complete non-empty metadata object in the upload call; do not send `{}` as a placeholder.
3. Obtain the stable File resource route, not a short-lived signed download URL.
4. Package again with that route as `--export-url`.
5. Create or update a normal HTML Artifact from `index.html`, with metadata containing `kind=dokki-slides`, `protocol`, `sourceSkill`, `sourceRevision`, `deckRevision`, and the companion File resource id. Prefer setting it in the create call. If the runtime lacks create-time metadata, call the resource update operation once with the complete object.
6. Read both resources back. The revisions must match before returning success.

When updating, never replace only one side. If one write fails, report the partial state and retry safely using the same revision rather than inventing a newer revision. Stop after one failed metadata retry: the HTML and PPTX remain usable, but the run must report metadata verification as incomplete instead of looping. Never repeat a tool call with an unchanged argument object.
