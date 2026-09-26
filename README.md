<p>
  <a href="https://dokki.one">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Dokki-lab/.github/main/assets/dokki-dark.svg">
      <img src="https://raw.githubusercontent.com/Dokki-lab/.github/main/assets/dokki-light.svg" alt="Dokki" width="180">
    </picture>
  </a>
</p>

# Dokki Slides

**You lead. Agents do the work.** [Dokki](https://dokki.one) brings your team, agents and work into one workspace—from the first goal to shared, editable results.

Create presentations you can keep editing. This agent skill builds native Dokki decks with text, shapes, images, charts and tables as individual layers, plus a local HTML preview. Export editable PPTX through Dokki's slide editor.

[Install](#install) · [Run an example](#run-an-example) · [Skill guide](dokki-slides/SKILL.md) · [MIT-0 license](LICENSE)

## What you need

- Node.js 18+ for the local CLI; no runtime dependencies or Dokki account are needed for local previews.
- An agent that supports skills, such as Dokki, Claude Code or Codex, for the guided authoring workflow.
- A Dokki account and workspace connection to publish a native slide and export PPTX through the editor.

## Install

```sh
npx skills add Dokki-lab/dokki-slides --skill dokki-slides
```

Try asking your agent:

> Use dokki-slides to turn my product brief into a five-slide presentation. Keep the content source-backed and give me an editable deck and local preview.

## Run an example

To try the bundled example independently of an agent, clone this repository and run from its root:

```sh
git clone https://github.com/Dokki-lab/dokki-slides.git
cd dokki-slides
node dokki-slides/scripts/dokki-slides.mjs check examples/angel-round/deck.json
node dokki-slides/scripts/dokki-slides.mjs package examples/angel-round/deck.json --out-dir dist/angel-round
```

Open `dist/angel-round/index.html` in your browser. Arrow keys navigate; `N` toggles speaker notes. The source deck remains `examples/angel-round/deck.json`; the output includes a quality report and individual slide previews.

## How it works

- **Editable by design:** `deck.json` is a scene graph on a 1920×1080 canvas; HTML is derived from it.
- **Layouts with structure:** fourteen editorial layouts place content on the grid.
- **Custom visuals:** author SVG within the [SVG contract](dokki-slides/references/svg-contract.md) to create editable layers.
- **Quality checks:** local validation checks bounds, overflow, overlap, contrast, size and layout rhythm.
- **Same core as Dokki:** the vendored core records its source revision in the bundle and quality report.

For a new deck, start with `init`, inspect `layouts`, then follow the [skill workflow](dokki-slides/SKILL.md):

```sh
node dokki-slides/scripts/dokki-slides.mjs init /tmp/my-deck --title "My presentation"
node dokki-slides/scripts/dokki-slides.mjs layouts
```

## Publish and export

Follow the [Dokki delivery guide](dokki-slides/references/dokki.md) to publish the generated HTML as a native Dokki Slide. Open it in the canvas editor to continue editing and export PPTX. The local CLI produces the deck and HTML preview; it does not directly export PPTX.

Faithfully reproducing an uploaded PowerPoint file is outside this skill's scope. Its text can be used as source material for a new deck.

## Development

Run `node --test` from the repository root. Validate and package the example with the commands above before submitting a change.

Maintainers update the vendored core from a Dokki checkout with:

```sh
node scripts/build-slides-core.mjs path/to/dokki-slides/dokki-slides/scripts/vendor/dokki-slides-core.mjs
```

The bundle header and `quality-report.json` identify the source revision.


## Contributing and support

Bug reports, examples and focused improvements are welcome. Read the [contribution guide](https://github.com/Dokki-lab/.github/blob/main/CONTRIBUTING.md), use this repository's Issues for reproducible problems, and follow [private security reporting](https://github.com/Dokki-lab/.github/blob/main/SECURITY.md) for vulnerabilities.

[Dokki](https://dokki.one) · [Documentation](https://dokki.one/pub/docs) · [All projects](https://github.com/Dokki-lab) · [Support](https://github.com/Dokki-lab/.github/blob/main/SUPPORT.md)

## License

[MIT-0](LICENSE).
