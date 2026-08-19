import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { validateDeck } from "../skill/scripts/lib/model.mjs"
import { renderHtml } from "../skill/scripts/lib/render-html.mjs"

const exec = promisify(execFile)
const root = path.resolve(import.meta.dirname, "..")
const cli = path.join(root, "skill", "scripts", "dokki-slides.mjs")
const example = path.join(root, "examples", "product-launch", "presentation.json")

test("validates the example deck", async () => {
  const { stdout } = await exec(process.execPath, [cli, "validate", example])
  const result = JSON.parse(stdout)
  assert.equal(result.ok, true)
  assert.deepEqual(result.errors, [])
})

test("packages matching HTML and PPTX outputs", async () => {
  const out = await fs.mkdtemp(path.join(os.tmpdir(), "dokki-slides-"))
  const { stdout } = await exec(process.execPath, [cli, "package", example, "--out-dir", out])
  const result = JSON.parse(stdout)
  assert.equal(result.slideCount, 3)
  const html = await fs.readFile(path.join(out, "index.html"), "utf8")
  assert.match(html, /dokki-slides-data/)
  assert.match(html, /example-product-launch-v1/)
  const pptx = await fs.stat(path.join(out, "exports", "product-launch-brief.pptx"))
  assert.ok(pptx.size > 10000)
  const report = JSON.parse(await fs.readFile(path.join(out, "quality-report.json"), "utf8"))
  assert.equal(report.deckRevision, "example-product-launch-v1")
})

test("rejects web-only elements without a PPTX fallback", () => {
  const result = validateDeck({ schemaVersion: "dokki-slides@1", deckRevision: "r1", title: "Deck", locale: "en-US", theme: {}, slides: [{ id: "one", elements: [{ id: "custom", type: "html", x: 0, y: 0, w: 100, h: 100, html: "<b>Hi</b>" }] }] })
  assert.ok(result.errors.some((error) => error.includes("fallbackImage")))
})

test("keeps one fixed logical canvas and scales the complete stage on narrow viewports", async () => {
  const deck = JSON.parse(await fs.readFile(example, "utf8"))
  const html = await renderHtml(deck)

  assert.match(html, /\.stage\{[^}]*width:1920px;height:1080px/)
  assert.match(html, /data-canvas-width="1920" data-canvas-height="1080"/)
  assert.match(html, /Math\.min\(rect\.width\/1920,rect\.height\/1080\)/)
  assert.match(html, /stage\.style\.transform='translate\(-50%,-50%\) scale\('/)
  assert.match(html, /new ResizeObserver\(fit\)\.observe\(deck\)/)
  assert.doesNotMatch(html, /width:min\(100vw,calc\(100vh \* 16\/9\)\)/)
})
