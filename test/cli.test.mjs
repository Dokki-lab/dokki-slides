import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"

const cli = new URL("../dokki-slides/scripts/dokki-slides.mjs", import.meta.url).pathname
const run = (...args) => JSON.parse(execFileSync("node", [cli, ...args], { encoding: "utf8" }))

test("init → layout → svg → package produces a lint-clean deck and derived html", () => {
  const dir = mkdtempSync(join(tmpdir(), "dokki-slides-"))
  const init = run("init", dir, "--title", "CLI deck")
  assert.equal(init.ok, true)
  assert.ok(existsSync(join(dir, "deck.json")))
  assert.ok(existsSync(join(dir, "design_spec.md")))
  writeFileSync(join(dir, "c.json"), JSON.stringify({ kicker: "why now", title: "A claim", body: ["one", "two"], body2: ["aside"], footer: "Deck", page: "02" }))
  const added = run("layout", join(dir, "deck.json"), "split", "--content", join(dir, "c.json"), "--name", "Claim")
  assert.equal(added.ok, true)
  assert.equal(added.index, 1)
  writeFileSync(
    join(dir, "s.svg"),
    '<svg viewBox="0 0 1920 1080"><rect x="0" y="0" width="1920" height="1080" fill="#F7F8F5"/><text x="120" y="300" font-size="80" fill="#1A1A1A" data-box="120 220 1600 120">Drawn</text><circle cx="1500" cy="700" r="160" fill="#F50132"/></svg>',
  )
  const drawn = run("svg", join(dir, "deck.json"), join(dir, "s.svg"), "--name", "Free")
  assert.equal(drawn.ok, true)
  assert.equal(drawn.elements, 3)
  const packaged = run("package", join(dir, "deck.json"), "--out-dir", join(dir, "dist"))
  assert.equal(packaged.ok, true)
  assert.equal(packaged.slideCount, 3)
  assert.equal(packaged.lint.hard, 0)
  assert.equal(packaged.receipt.length, 3)
  const html = readFileSync(join(dir, "dist", "index.html"), "utf8")
  assert.match(html, /<!-- dokki-slide-canvas@1 -->/)
  assert.match(html, /"dokki-slide-deck"/)
  assert.ok(existsSync(join(dir, "dist", "previews", "01-cover.html")))
  const report = JSON.parse(readFileSync(join(dir, "dist", "quality-report.json"), "utf8"))
  assert.equal(report.protocol, "dokki-slides@2")
  assert.match(report.core, /^[0-9a-f]{12,}$/)
})

test("check fails on hard findings", () => {
  const dir = mkdtempSync(join(tmpdir(), "dokki-slides-"))
  run("init", dir, "--title", "Bad deck")
  const deck = JSON.parse(readFileSync(join(dir, "deck.json"), "utf8"))
  deck.elements.cover[1].x = 1800 // push the title off the canvas
  writeFileSync(join(dir, "deck.json"), JSON.stringify(deck))
  assert.throws(() => run("check", join(dir, "deck.json")), /H1|Command failed/)
})
