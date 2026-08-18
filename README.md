# Dokki Slides

Open-source AI presentation skill for Dokki, Claude Code, Codex and OpenClaw. Create interactive web slides and export editable PPTX files from one structured deck.

## Why Dokki Slides

- **Artifact-first:** publish an interactive HTML presentation instead of treating PowerPoint as the source of truth.
- **Editable export:** text, shapes, images, tables, charts and speaker notes remain native PowerPoint objects.
- **Agent Skills compatible:** one `SKILL.md` package for Codex, Claude Code, Vercel's skills CLI, OpenClaw and ClawHub.
- **Deterministic:** validation, HTML rendering and PPTX export run through checked-in scripts.

## Install

```bash
npx skills add Dokki-lab/dokki-slides --skill dokki-slides
```

Claude Code marketplace:

```text
/plugin marketplace add Dokki-lab/dokki-slides
/plugin install dokki-slides@dokki-skills
```

## Build the example

```bash
pnpm install --frozen-lockfile
pnpm build:vendor
pnpm build:example
```

The generated folder contains `presentation.json`, `index.html`, `exports/product-launch-brief.pptx`, and `quality-report.json`.

## License

MIT-0. PptxGenJS is MIT licensed and remains subject to its own copyright notice.
