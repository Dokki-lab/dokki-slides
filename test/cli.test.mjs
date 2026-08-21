import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { validateDeck } from "../scripts/lib/model.mjs"
import { renderHtml } from "../scripts/lib/render-html.mjs"

const exec = promisify(execFile)
const root = path.resolve(import.meta.dirname, "..")
const cli = path.join(root, "scripts", "dokki-slides.mjs")
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
  assert.equal(result.slideCount, 8)
  const html = await fs.readFile(path.join(out, "index.html"), "utf8")
  assert.match(html, /dokki-slides-data/)
  assert.match(html, /dokki-editorial-example-v1/)
  assert.match(html, /class="brand-chrome"/)
  assert.match(html, /layout-cover-signal role-cover active/)
  assert.match(html, /background:#F50132/)
  const pptx = await fs.stat(path.join(out, "exports", "dokki-agent-os.pptx"))
  assert.ok(pptx.size > 10000)
  const report = JSON.parse(await fs.readFile(path.join(out, "quality-report.json"), "utf8"))
  assert.equal(report.deckRevision, "dokki-editorial-example-v1")
  assert.equal(report.designSystem, "dokki-editorial")
  assert.equal(new Set(report.layouts).size, 8)
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

test("rejects editorial decks that collapse into rounded-card dashboards", async () => {
  const deck = JSON.parse(await fs.readFile(example, "utf8"))
  deck.slides[2].elements.push(
    { id: "card-a", type: "shape", shape: "roundRect", x: 10, y: 900, w: 100, h: 100 },
    { id: "card-b", type: "shape", shape: "roundRect", x: 120, y: 900, w: 100, h: 100 },
    { id: "card-c", type: "shape", shape: "roundRect", x: 230, y: 900, w: 100, h: 100 },
  )
  const result = validateDeck(deck)
  assert.ok(result.errors.some((error) => error.includes("not card dashboards")))
})

test("requires one primary message and a varied named layout rhythm", async () => {
  const deck = JSON.parse(await fs.readFile(example, "utf8"))
  delete deck.slides[1].elements.find((element) => element.primary).primary
  for (const slide of deck.slides.slice(1, 7)) slide.layout = "split"
  const result = validateDeck(deck)
  assert.ok(result.errors.some((error) => error.includes("exactly one primary element")))
  assert.ok(result.errors.some((error) => error.includes("distinct layouts")))
  assert.ok(result.errors.some((error) => error.includes("three times in a row")))
})

test("keeps custom dokki-slides@1 decks backward compatible", () => {
  const deck = { schemaVersion: "dokki-slides@1", deckRevision: "legacy", title: "Legacy", locale: "en-US", theme: { background: "FFFFFF", surface: "FFFFFF", text: "111111", muted: "666666", accent: "FF0000", fontFamily: "Aptos", fontFamilyCjk: "Arial" }, slides: [{ id: "one", elements: [{ id: "title", type: "text", x: 100, y: 100, w: 800, h: 100, text: "Legacy deck", fontSize: 40 }] }] }
  assert.deepEqual(validateDeck(deck).errors, [])
})

test("rejects editorial text boxes that are likely to clip in HTML", async () => {
  const deck = JSON.parse(await fs.readFile(example, "utf8"))
  deck.slides[1].elements.find((element) => element.primary).h = 40
  const result = validateDeck(deck)
  assert.ok(result.errors.some((error) => error.includes("likely to clip in HTML")))
})

test("keeps package, Dokki, and Claude marketplace versions aligned", async () => {
  const packageJson = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"))
  const dokkiManifest = JSON.parse(await fs.readFile(path.join(root, "dokki.skill.json"), "utf8"))
  const claudePlugin = JSON.parse(await fs.readFile(path.join(root, ".claude-plugin", "plugin.json"), "utf8"))
  const claudeMarketplace = JSON.parse(await fs.readFile(path.join(root, ".claude-plugin", "marketplace.json"), "utf8"))
  const skill = await fs.readFile(path.join(root, "SKILL.md"), "utf8")
  assert.equal(dokkiManifest.version, packageJson.version)
  assert.equal(claudePlugin.version, packageJson.version)
  assert.equal(claudeMarketplace.version, packageJson.version)
  assert.equal(claudeMarketplace.plugins[0].version, packageJson.version)
  assert.match(skill, new RegExp(`version: "${packageJson.version.replaceAll(".", "\\.")}"`))
})

test("packages local assets and rejects paths outside the deck directory", async () => {
  const source = await fs.mkdtemp(path.join(os.tmpdir(), "dokki-slides-assets-"))
  await fs.mkdir(path.join(source, "assets"))
  await fs.writeFile(path.join(source, "assets", "pixel.png"), Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgQIAZ8xZ0QAAAABJRU5ErkJggg==", "base64"))
  const deck = { schemaVersion: "dokki-slides@1", deckRevision: "assets", title: "Assets", locale: "en-US", theme: { background: "FFFFFF", surface: "FFFFFF", text: "111111", muted: "666666", accent: "FF0000", fontFamily: "Aptos", fontFamilyCjk: "Arial" }, slides: [{ id: "one", elements: [{ id: "image", type: "image", x: 100, y: 100, w: 100, h: 100, src: "assets/pixel.png" }] }] }
  const file = path.join(source, "presentation.json")
  await fs.writeFile(file, JSON.stringify(deck))
  const out = path.join(source, "out")
  await exec(process.execPath, [cli, "package", file, "--out-dir", out])
  assert.equal((await fs.stat(path.join(out, "assets", "pixel.png"))).isFile(), true)
  deck.slides[0].elements[0].src = "../pixel.png"
  assert.ok(validateDeck(deck, source).errors.some((error) => error.includes("inside the deck directory")))
})
