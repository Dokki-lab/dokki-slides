# Dokki publishing contract

Dokki Slides uses existing resources; it does not create a new presentation resource type.

1. Package the deck locally and record its `deckRevision`.
2. Upload `exports/<slug>.pptx` as a Dokki File with metadata containing `kind=dokki-slides-export`, `protocol=dokki-slides@1`, `sourceSkill=github.com/Dokki-lab/dokki-slides`, `sourceRevision=<immutable Skill commit>`, and the same `deckRevision`. Pass the complete non-empty metadata object in the upload call; do not send `{}` as a placeholder.
3. Obtain the stable File resource route, not a short-lived signed download URL. Prefer the platform-native `resource://<resource-id>` route for the Artifact export target when Dokki returns only a resource id. Never invent, normalize, or replace the current host (for example, never turn a Staging resource into a `dokki.one` URL).
4. Package again with that route as `--export-url`.
5. Call `sandbox_push_artifact` with the absolute `index.html` path and a complete metadata object containing `kind=dokki-slides`, `protocol`, `sourceSkill`, `sourceRevision`, `deckRevision`, and the companion File resource id. This transfers the complete source server-side. Do not call `sandbox_read_file` to move HTML through model context, upload `index.html` as a File, pass a placeholder such as `THE_ACTUAL_HTML_SOURCE`, or retry `create_artifact` with unchanged arguments. If `sandbox_push_artifact` is unavailable, report that the Artifact publication step is unsupported by this Dokki runtime rather than claiming success.
6. Read both resources back. The revisions must match before returning success.

Return only exact links supplied by the Dokki tools or the current app. If a tool returns only a resource id, return the id with a clear label rather than constructing an HTTPS URL. Keep progress updates to the four delivery phases; aggregate recoverable local validation corrections and do not expose each internal sandbox retry as a separate user-facing error.

When updating, never replace only one side. If one write fails, report the partial state and retry safely using the same revision rather than inventing a newer revision. Stop after one failed metadata retry: the HTML and PPTX remain usable, but the run must report metadata verification as incomplete instead of looping. Never repeat a tool call with an unchanged argument object.
