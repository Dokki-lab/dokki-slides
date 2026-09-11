#!/usr/bin/env node
/**
 * dokki-slides v2 CLI — author a native Dokki deck (scene graph) locally.
 *
 *   init     <dir> [--title T] [--theme dokki-editorial]     scaffold deck.json, design_spec.md, lock.json
 *   check    <deck.json>                                     validate + lint (exit 1 on hard findings)
 *   layout   <deck.json> <layoutId> --content c.json [--index n] [--id s] [--name N] [--notes-file f]
 *   svg      <deck.json> <slide.svg> [--index n] [--id s] [--replace id] [--name N] [--notes-file f]
 *   remove   <deck.json> <slideId>
 *   build    <deck.json> --out index.html                    derived HTML (the Dokki Slide source)
 *   preview  <deck.json> --out-dir previews                  one standalone HTML per slide + index
 *   package  <deck.json> --out-dir dist                      check + build + preview + quality-report.json
 *   layouts                                                  list layout ids and content fields
 *
 * Everything runs on the vendored core (scripts/vendor/dokki-slides-core.mjs),
 * built from Dokki's lib/slides — the same model, renderer, layouts and lint
 * the Dokki editor uses, so what checks out here opens unchanged in Dokki.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import * as core from "./vendor/dokki-slides-core.mjs"

const here = dirname(fileURLToPath(import.meta.url))
const [, , command, ...rest] = process.argv

function opt(name, fallback) {
  const i = rest.indexOf(name)
  return i >= 0 ? rest[i + 1] : fallback
}
function flag(name) {
  return rest.includes(name)
}
function positional(n) {
  const out = []
  for (let i = 0; i < rest.length && out.length < n; i++) {
    if (rest[i].startsWith("--")) {
      i++
      continue
    }
    out.push(rest[i])
  }
  return out
}
function readDeck(file) {
  const abs = resolve(file)
  const deck = core.validateDeckSnapshot(JSON.parse(readFileSync(abs, "utf8")))
  return { deck, abs }
}
function writeDeck(abs, deck) {
  writeFileSync(abs, `${JSON.stringify(deck, null, 2)}\n`)
}
function readNotes() {
  const f = opt("--notes-file")
  return f ? readFileSync(resolve(f), "utf8").trim() : undefined
}
function print(obj) {
  console.log(JSON.stringify(obj, null, 2))
}
function coreRevision() {
  const head = readFileSync(resolve(here, "vendor/dokki-slides-core.mjs"), "utf8").slice(0, 200)
  return /Dokki@([0-9a-f]+)/.exec(head)?.[1] ?? "unknown"
}
function slideIndex(deck, id) {
  return deck.slides.findIndex((s) => s.id === id)
}
function makeIdFor(deck) {
  const used = new Set(Object.values(deck.elements).flat().map((e) => e.id))
  return (prefix) => {
    let id = core.newSlideId(prefix)
    while (used.has(id)) id = core.newSlideId(prefix)
    used.add(id)
    return id
  }
}

const usage = () =>
  console.log(
    readFileSync(fileURLToPath(import.meta.url), "utf8")
      .split("\n")
      .slice(2, 16)
      .map((l) => l.replace(/^ \* ?/, ""))
      .join("\n"),
  )

async function main() {
  switch (command) {
    case undefined:
    case "help":
    case "--help":
      return usage()

    case "layouts":
      return print(
        core.SLIDE_LAYOUTS.map((l) => ({ id: l.id, name: l.name, description: l.description })),
      )

    case "init": {
      const dir = resolve(positional(1)[0] ?? ".")
      mkdirSync(dir, { recursive: true })
      const title = opt("--title", "Untitled slides")
      const themeId = opt("--theme", "dokki-editorial")
      const preset = core.findThemePreset(themeId)
      if (!preset) throw new Error(`unknown theme ${themeId}; one of ${core.DECK_THEME_PRESETS.map((p) => p.id).join(", ")}`)
      const deck = {
        meta: core.createDeckMeta({ title, theme: preset.theme }),
        slides: [core.createSlide("cover", { layout: "cover-signal" })],
        elements: {
          cover: core.buildLayoutElements(
            "cover-signal",
            { title, subtitle: "", kicker: "" },
            { theme: preset.theme, width: 1920, height: 1080 },
            core.newSlideId,
          ),
        },
      }
      writeDeck(resolve(dir, "deck.json"), deck)
      const spec = resolve(dir, "design_spec.md")
      if (!existsSync(spec)) writeFileSync(spec, readFileSync(resolve(here, "../references/templates/design_spec.md"), "utf8"))
      const lock = resolve(dir, "lock.json")
      if (!existsSync(lock))
        writeFileSync(
          lock,
          `${JSON.stringify(
            {
              theme: themeId,
              canvas: { width: 1920, height: 1080 },
              type: { display: 112, title: 80, lead: 48, body: 36, label: 32, meta: 28 },
              rhythm: {},
              forbidden: ["three or more identical rounded cards on one slide", "a 'Thank you' closing slide"],
              chrome: { footer: "", pageNumbers: true },
            },
            null,
            2,
          )}\n`,
        )
      return print({ ok: true, dir, files: ["deck.json", "design_spec.md", "lock.json"], core: coreRevision() })
    }

    case "check": {
      const { deck } = readDeck(positional(1)[0])
      const report = core.lintDeck(deck)
      print({ ok: report.ok, hard: report.hard, soft: report.soft, findings: report.findings, receipt: receipt(deck) })
      if (!report.ok) process.exitCode = 1
      return
    }

    case "layout": {
      const [file, layoutId] = positional(2)
      const { deck, abs } = readDeck(file)
      const layout = core.SLIDE_LAYOUTS.find((l) => l.id === layoutId)
      if (!layout) throw new Error(`unknown layout ${layoutId}; run: dokki-slides layouts`)
      const contentFile = opt("--content")
      const content = contentFile ? JSON.parse(readFileSync(resolve(contentFile), "utf8")) : {}
      const id = opt("--id") ?? core.newSlideId("s")
      const index = opt("--index") !== undefined ? Number(opt("--index")) : undefined
      const notes = readNotes()
      const name = opt("--name")
      const elements = core.buildLayoutElements(layoutId, content, deck.meta, makeIdFor(deck))
      const next = core.applyDeckOpsToSnapshot(deck, [
        { op: "slide.add", slide: core.createSlide(id, { layout: layoutId, ...(notes ? { notes } : {}), ...(name ? { name } : {}) }), index, elements },
      ])
      writeDeck(abs, next)
      const lint = core.lintSlide(next, next.slides.find((s) => s.id === id))
      return print({ ok: !lint.some((f) => f.severity === "hard"), slideId: id, index: slideIndex(next, id), elements: elements.length, lint })
    }

    case "svg": {
      const [file, svgFile] = positional(2)
      const { deck, abs } = readDeck(file)
      const svg = readFileSync(resolve(svgFile), "utf8")
      const imported = core.importSvgSlide(svg, { width: deck.meta.width, height: deck.meta.height, textColor: deck.meta.theme.colors.text, makeId: makeIdFor(deck) })
      const replace = opt("--replace")
      const id = replace ?? opt("--id") ?? core.newSlideId("s")
      const notes = readNotes()
      const name = opt("--name")
      const ops = []
      let index = opt("--index") !== undefined ? Number(opt("--index")) : undefined
      if (replace) {
        const at = slideIndex(deck, replace)
        if (at < 0) throw new Error(`slide ${replace} not found`)
        index = at
        ops.push({ op: "slide.remove", slideId: replace })
      }
      const previous = replace ? deck.slides.find((s) => s.id === replace) : undefined
      ops.push({
        op: "slide.add",
        slide: core.createSlide(id, { layout: "svg", ...(notes ?? previous?.notes ? { notes: notes ?? previous?.notes } : {}), ...(name ?? previous?.name ? { name: name ?? previous?.name } : {}) }),
        index,
        elements: imported.elements,
      })
      // A deck keeps at least one slide: replacing the only slide needs add-then-remove.
      const next = replace && deck.slides.length === 1
        ? core.applyDeckOpsToSnapshot(core.applyDeckOpsToSnapshot(deck, [ops[1]]), [ops[0]])
        : core.applyDeckOpsToSnapshot(deck, ops)
      writeDeck(abs, next)
      const lint = core.lintSlide(next, next.slides.find((s) => s.id === id))
      return print({ ok: !lint.some((f) => f.severity === "hard"), slideId: id, index: slideIndex(next, id), elements: imported.elements.length, warnings: imported.warnings, lint })
    }

    case "remove": {
      const [file, id] = positional(2)
      const { deck, abs } = readDeck(file)
      writeDeck(abs, core.applyDeckOpsToSnapshot(deck, [{ op: "slide.remove", slideId: id }]))
      return print({ ok: true, removed: id })
    }

    case "build": {
      const { deck } = readDeck(positional(1)[0])
      const out = resolve(opt("--out", "index.html"))
      mkdirSync(dirname(out), { recursive: true })
      writeFileSync(out, core.renderDeckHtml(deck))
      return print({ ok: true, out, marker: core.SLIDE_CANVAS_MARKER })
    }

    case "preview": {
      const { deck } = readDeck(positional(1)[0])
      const outDir = resolve(opt("--out-dir", "previews"))
      mkdirSync(outDir, { recursive: true })
      const files = writePreviews(deck, outDir)
      return print({ ok: true, outDir, files })
    }

    case "package": {
      const { deck, abs } = readDeck(positional(1)[0])
      const outDir = resolve(opt("--out-dir", "dist"))
      mkdirSync(outDir, { recursive: true })
      const report = core.lintDeck(deck)
      const html = core.renderDeckHtml(deck)
      writeFileSync(resolve(outDir, "index.html"), html)
      writeFileSync(resolve(outDir, "deck.json"), readFileSync(abs))
      const previews = writePreviews(deck, resolve(outDir, "previews"))
      const quality = {
        protocol: "dokki-slides@2",
        core: coreRevision(),
        title: deck.meta.title,
        slideCount: deck.slides.length,
        lint: { ok: report.ok, hard: report.hard, soft: report.soft, findings: report.findings },
        receipt: receipt(deck),
        outputs: { html: "index.html", deck: "deck.json", previews: previews.length },
      }
      writeFileSync(resolve(outDir, "quality-report.json"), `${JSON.stringify(quality, null, 2)}\n`)
      print({ ok: report.ok, outDir, ...quality })
      if (!report.ok) process.exitCode = 1
      return
    }

    default:
      throw new Error(`unknown command ${command}`)
  }
}

/** One standalone page per slide (for screenshots / eyeballing) plus the deck. */
function writePreviews(deck, outDir) {
  mkdirSync(outDir, { recursive: true })
  const files = []
  deck.slides.forEach((slide, i) => {
    const one = { ...deck, slides: [slide], elements: { [slide.id]: deck.elements[slide.id] ?? [] } }
    const name = `${String(i + 1).padStart(2, "0")}-${slide.id}.html`
    writeFileSync(resolve(outDir, name), core.renderDeckHtml(one, { omitData: true }))
    files.push(name)
  })
  writeFileSync(resolve(outDir, "index.html"), core.renderDeckHtml(deck, { omitData: true }))
  return files
}

/**
 * Carrier receipt: what each slide actually used. The author reconciles it
 * against the page roster — a slide whose relationship is "order" or "link"
 * with no line, arrow or group needs a reason.
 */
function receipt(deck) {
  return deck.slides.map((slide, i) => {
    const els = deck.elements[slide.id] ?? []
    const count = (pred) => els.filter(pred).length
    return {
      index: i + 1,
      id: slide.id,
      layout: slide.layout ?? null,
      text: count((e) => e.type === "text"),
      shapes: count((e) => e.type === "shape" && !["line", "arrow"].includes(e.shape)),
      lines: count((e) => e.type === "shape" && ["line", "arrow"].includes(e.shape)),
      paths: count((e) => e.type === "shape" && e.shape === "path"),
      gradients: count((e) => e.type === "shape" && e.fill?.type === "gradient"),
      images: count((e) => e.type === "image"),
      charts: count((e) => e.type === "chart"),
      tables: count((e) => e.type === "table"),
      groups: count((e) => e.type === "group"),
      words: els
        .filter((e) => e.type === "text")
        .reduce((n, e) => n + core.richTextToPlain(core.parseRichText(e.html)).split(/\s+/).filter(Boolean).length, 0),
    }
  })
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
