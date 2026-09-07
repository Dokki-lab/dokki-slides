# Dokki publishing contract

Dokki Slides publishes the web deck through Dokki's first-class Slide mode. A Slide is an Artifact variant with `artifact_variant: "slide"`, a stable `/slide/<resource-id>` route, and the Slide-specific workspace identity. It is not a generic Artifact and must not be published at `/artifact/<resource-id>`.

1. Package the deck locally and record its `deckRevision`.
2. Upload `exports/<slug>.pptx` as a Dokki File with metadata containing `kind=dokki-slides-export`, `protocol=dokki-slides@1`, `sourceSkill=github.com/Dokki-lab/dokki-slides`, `sourceRevision=<immutable Skill commit>`, and the same `deckRevision`. Pass the complete non-empty metadata object in the upload call; do not send `{}` as a placeholder.
3. Obtain the stable File resource route, not a short-lived signed download URL. Prefer the platform-native `resource://<resource-id>` route for the Slide export target when Dokki returns only a resource id. Never invent, normalize, or replace the current host (for example, never turn a Staging resource into a `dokki.one` URL).
4. Package again with that route as `--export-url`.
5. Call `sandbox_push_artifact` with the absolute `index.html` path, `artifact_variant: "slide"`, and a complete metadata object containing `kind=dokki-slides`, `protocol`, `sourceSkill`, `sourceRevision`, `deckRevision`, and the companion File resource id. This transfers the complete source server-side while preserving first-class Slide identity. Do not call `sandbox_read_file` to move HTML through model context, upload `index.html` as a File, pass a placeholder such as `THE_ACTUAL_HTML_SOURCE`, or retry `create_artifact` with unchanged arguments.
6. Verify the creation response reports `resource.artifact_variant = "slide"`. Read the Slide back and require its canonical route to be `/slide/<resource-id>`. Treat a generic `/artifact/<resource-id>` route as a failed publication even when the HTML renders.
7. Read the companion File back. The Slide and File revisions must match before returning success.

If `sandbox_push_artifact` is unavailable or its schema does not accept `artifact_variant`, report that Slide-mode publication is unsupported by this Dokki runtime. Do not fall back to a generic Artifact: that would hide a platform compatibility defect and make the result invisible to Slide-specific navigation and behavior.

Return only exact links supplied by the Dokki tools or the current app. If a tool returns only a resource id, return the id with a clear label rather than constructing an HTTPS URL. Keep progress updates to the four delivery phases; aggregate recoverable local validation corrections and do not expose each internal sandbox retry as a separate user-facing error.

When updating, never replace only one side. If one write fails, report the partial state and retry safely using the same revision rather than inventing a newer revision. Stop after one failed metadata retry: the HTML and PPTX remain usable, but the run must report metadata verification as incomplete instead of looping. Never repeat a tool call with an unchanged argument object.
