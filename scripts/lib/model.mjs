import fs from "node:fs/promises"
import { statSync } from "node:fs"
import path from "node:path"
import crypto from "node:crypto"

export const CANVAS = { width: 1920, height: 1080 }
export const ELEMENT_TYPES = new Set(["text", "shape", "image", "table", "chart", "html"])
export const DOKKI_THEME = Object.freeze({
  background: "F7F8F5",
  surface: "FFFFFF",
  text: "1A1A1A",
  muted: "666666",
  accent: "F50132",
  line: "D6D7D2",
  dark: "050706",
  accentOn: "FFFFFF",
})
export const DOKKI_LAYOUTS = new Set([
  "cover-signal", "statement", "section", "split", "data-hero", "comparison",
  "timeline", "process", "architecture", "chart-ledger", "image-hero", "matrix", "closing-split",
])
export const SLIDE_ROLES = new Set(["cover", "section", "statement", "content", "data", "closing"])
export const TEXT_ROLES = new Set(["display", "title", "subtitle", "lead", "body", "label", "meta", "kpi", "caption", "footnote"])
const TEXT_MINIMUMS = { display: 50, title: 35, subtitle: 24, lead: 24, body: 18, label: 16, meta: 14, kpi: 48, caption: 16, footnote: 14 }

export async function readDeck(file) {
  const absolute = path.resolve(file)
  const raw = await fs.readFile(absolute, "utf8")
  return { deck: JSON.parse(raw), file: absolute, baseDir: path.dirname(absolute) }
}

export function slugify(value) {
  return String(value || "slides")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "slides"
}

export function cleanHex(value, fallback = "000000") {
  const clean = String(value || fallback).replace(/^#/, "").toUpperCase()
  return /^[0-9A-F]{6}$/.test(clean) ? clean : fallback
}

export function deckDigest(deck) {
  return crypto.createHash("sha256").update(JSON.stringify(deck)).digest("hex")
}

function estimatedTextHeight(element) {
  const size = Number(element.fontSize || 0)
  if (!size || !element.w) return 0
  const cjk = /[\u3000-\u9fff]/.test(String(element.text || ""))
  const averageGlyphWidth = size * 2 * (cjk ? 1 : 0.43)
  const lines = String(element.text || "").split("\n").reduce((total, line) => total + Math.max(1, Math.ceil(line.length * averageGlyphWidth / element.w)), 0)
  return lines * size * 2 * Number(element.lineHeight || 1.12)
}

export function validateDeck(deck, baseDir = process.cwd()) {
  const errors = []
  const warnings = []
  if (!deck || typeof deck !== "object" || Array.isArray(deck)) return { errors: ["Deck must be a JSON object"], warnings }
  if (deck.schemaVersion !== "dokki-slides@1") errors.push("schemaVersion must equal dokki-slides@1")
  for (const field of ["deckRevision", "title", "locale"]) {
    if (typeof deck[field] !== "string" || !deck[field].trim()) errors.push(`${field} is required`)
  }
  if (!deck.theme || typeof deck.theme !== "object") errors.push("theme is required")
  if (!Array.isArray(deck.slides) || deck.slides.length === 0) errors.push("slides must contain at least one slide")
  const editorial = deck.theme?.style === "dokki-editorial"
  if (editorial) {
    for (const [key, expected] of Object.entries(DOKKI_THEME)) {
      if (cleanHex(deck.theme?.[key], "") !== expected) errors.push(`theme.${key} must use the Dokki ${expected} token in dokki-editorial mode`)
    }
  }
  const slideIds = new Set()
  const layouts = []
  for (const [slideIndex, slide] of (deck.slides || []).entries()) {
    const prefix = `slides[${slideIndex}]`
    if (!slide?.id) errors.push(`${prefix}.id is required`)
    else if (slideIds.has(slide.id)) errors.push(`${prefix}.id is duplicated: ${slide.id}`)
    else slideIds.add(slide.id)
    if (!Array.isArray(slide?.elements)) errors.push(`${prefix}.elements must be an array`)
    if (editorial) {
      if (!DOKKI_LAYOUTS.has(slide?.layout)) errors.push(`${prefix}.layout must be a named Dokki layout`)
      else layouts.push(slide.layout)
      if (!SLIDE_ROLES.has(slide?.role)) errors.push(`${prefix}.role must describe the slide's narrative role`)
      if (typeof slide?.intent !== "string" || !slide.intent.trim()) errors.push(`${prefix}.intent must state one communication job`)
    }
    const elementIds = new Set()
    for (const [elementIndex, element] of (slide?.elements || []).entries()) {
      const at = `${prefix}.elements[${elementIndex}]`
      if (!element?.id) errors.push(`${at}.id is required`)
      else if (elementIds.has(element.id)) errors.push(`${at}.id is duplicated: ${element.id}`)
      else elementIds.add(element.id)
      if (!ELEMENT_TYPES.has(element?.type)) errors.push(`${at}.type is unsupported: ${element?.type}`)
      for (const key of ["x", "y", "w", "h"]) if (!Number.isFinite(element?.[key])) errors.push(`${at}.${key} must be a number`)
      if (Number.isFinite(element?.x) && Number.isFinite(element?.w) && (element.x < 0 || element.w <= 0 || element.x + element.w > CANVAS.width)) errors.push(`${at} exceeds the horizontal canvas`)
      if (Number.isFinite(element?.y) && Number.isFinite(element?.h) && (element.y < 0 || element.h <= 0 || element.y + element.h > CANVAS.height)) errors.push(`${at} exceeds the vertical canvas`)
      if (element?.type === "html" && !element.fallbackImage) errors.push(`${at}.fallbackImage is required for editable PPTX export`)
      if (element?.type === "image" || (element?.type === "html" && element?.fallbackImage)) {
        const asset = element.type === "image" ? element.src : element.fallbackImage
        if (typeof asset !== "string" || !asset) errors.push(`${at} asset path is required`)
        else if (!/^(data:|https?:)/.test(asset)) {
          const assetPath = path.resolve(baseDir, asset)
          const relative = path.relative(baseDir, assetPath)
          if (path.isAbsolute(asset) || relative.startsWith("..") || path.isAbsolute(relative)) errors.push(`${at} asset must be a relative path inside the deck directory`)
          else try { requireFile(assetPath) } catch { errors.push(`${at} asset not found: ${asset}`) }
        } else if (/^https?:/.test(asset)) warnings.push(`${at} uses a remote asset; localize it before publishing`)
      }
      if (element?.type === "text") {
        const size = Number(element.fontSize || 0)
        if (!editorial && size < 16) warnings.push(`${at} uses text smaller than 16pt`)
        if (editorial) {
          if (!TEXT_ROLES.has(element.textRole)) errors.push(`${at}.textRole is required in dokki-editorial mode`)
          const minimum = TEXT_MINIMUMS[element.textRole]
          if (minimum && size < minimum) errors.push(`${at}.fontSize must be at least ${minimum} for ${element.textRole} text`)
          if (["display", "kpi"].includes(element.textRole) && Number(element.fontWeight || 400) > 400) errors.push(`${at} large ${element.textRole} text must use weight 400 or lighter`)
          if (["label", "meta"].includes(element.textRole) && Number(element.fontWeight || 400) < 500) errors.push(`${at} small ${element.textRole} text must use weight 500 or heavier`)
          const estimatedHeight = estimatedTextHeight(element)
          if (estimatedHeight > Number(element.h || 0) * 1.08) errors.push(`${at} is likely to clip in HTML; needs about ${Math.ceil(estimatedHeight)}px of height`)
        }
      }
    }
    const elements = slide?.elements || []
    if (editorial) {
      const primary = elements.filter((element) => element?.primary === true)
      if (primary.length !== 1) errors.push(`${prefix} must contain exactly one primary element; found ${primary.length}`)
      const roundedCards = elements.filter((element) => element?.type === "shape" && element?.shape === "roundRect" && !element.decorative)
      if (roundedCards.length > 2) errors.push(`${prefix} uses ${roundedCards.length} rounded cards; Dokki editorial slides are not card dashboards`)
    }
    for (let left = 0; left < elements.length; left++) {
      for (let right = left + 1; right < elements.length; right++) {
        const a = elements[left]
        const b = elements[right]
        if (!a || !b || a.decorative || b.decorative) continue
        if (a.overlapGroup && a.overlapGroup === b.overlapGroup) continue
        if ([a.x, a.y, a.w, a.h, b.x, b.y, b.w, b.h].some((value) => !Number.isFinite(value))) continue
        const intersects = a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
        if (intersects) warnings.push(`${prefix} elements overlap without an overlapGroup: ${a.id} and ${b.id}`)
      }
    }
  }
  if (editorial && deck.slides?.length) {
    const first = deck.slides[0]
    const last = deck.slides.at(-1)
    if (first.role !== "cover" || first.layout !== "cover-signal") errors.push("The first dokki-editorial slide must use role cover and layout cover-signal")
    if (last.role !== "closing" || last.layout !== "closing-split") errors.push("The last dokki-editorial slide must use role closing and layout closing-split")
    for (let index = 2; index < layouts.length; index++) {
      if (layouts[index] === layouts[index - 1] && layouts[index] === layouts[index - 2]) errors.push(`slides[${index}] repeats layout ${layouts[index]} three times in a row`)
    }
    if (deck.slides.length >= 5 && new Set(layouts).size < Math.ceil(deck.slides.length * 0.6)) errors.push(`dokki-editorial decks need at least ${Math.ceil(deck.slides.length * 0.6)} distinct layouts for ${deck.slides.length} slides`)
  }
  return { errors, warnings }
}

function requireFile(file) {
  const stat = statSync(file)
  if (!stat.isFile()) throw new Error("not a file")
}

export async function validateDeckWithAssets(deck, baseDir = process.cwd()) {
  return validateDeck(deck, baseDir)
}
