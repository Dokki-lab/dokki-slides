#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"
import { deckDigest, readDeck, slugify, validateDeckWithAssets } from "./lib/model.mjs"
import { writeHtml } from "./lib/render-html.mjs"
import { writePptx } from "./lib/export-pptx.mjs"

function usage() {
  console.log(`dokki-slides

Usage:
  dokki-slides validate <presentation.json>
  dokki-slides build <presentation.json> --out <index.html> [--export-url <url>]
  dokki-slides export <presentation.json> --out <deck.pptx>
  dokki-slides package <presentation.json> --out-dir <directory> [--export-url <url>]
`)
}

function option(args, name, fallback) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : fallback
}

async function main() {
  const [, , command, file, ...args] = process.argv
  if (!command || command === "help" || command === "--help") return usage()
  if (!file) throw new Error("presentation.json path is required")
  const { deck, baseDir } = await readDeck(file)
  const report = validateDeckWithAssets ? await validateDeckWithAssets(deck, baseDir) : { errors: [], warnings: [] }
  if (command === "validate") {
    console.log(JSON.stringify({ ok: report.errors.length === 0, ...report }, null, 2))
    if (report.errors.length) process.exitCode = 1
    return
  }
  if (report.errors.length) throw new Error(`Validation failed:\n- ${report.errors.join("\n- ")}`)
  if (command === "build") {
    const out = option(args, "--out")
    if (!out) throw new Error("--out is required")
    await writeHtml(deck, path.resolve(out), { baseDir, exportUrl: option(args, "--export-url", `exports/${slugify(deck.title)}.pptx`) })
    console.log(path.resolve(out))
    return
  }
  if (command === "export") {
    const out = option(args, "--out")
    if (!out) throw new Error("--out is required")
    await writePptx(deck, path.resolve(out), { baseDir })
    console.log(path.resolve(out))
    return
  }
  if (command === "package") {
    const outDir = path.resolve(option(args, "--out-dir") || "dist")
    const slug = slugify(deck.title)
    const pptxFile = path.join(outDir, "exports", `${slug}.pptx`)
    const htmlFile = path.join(outDir, "index.html")
    await fs.mkdir(outDir, { recursive: true })
    await fs.copyFile(path.resolve(file), path.join(outDir, "presentation.json"))
    await writePptx(deck, pptxFile, { baseDir })
    await writeHtml(deck, htmlFile, { baseDir, exportUrl: option(args, "--export-url", `exports/${slug}.pptx`) })
    const quality = { protocol: "dokki-slides@1", deckRevision: deck.deckRevision, digest: deckDigest(deck), slideCount: deck.slides.length, warnings: report.warnings, outputs: { html: "index.html", pptx: `exports/${slug}.pptx` } }
    await fs.writeFile(path.join(outDir, "quality-report.json"), JSON.stringify(quality, null, 2) + "\n")
    console.log(JSON.stringify({ ok: true, outDir, ...quality }, null, 2))
    return
  }
  throw new Error(`Unknown command: ${command}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})

