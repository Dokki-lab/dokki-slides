import fs from "node:fs/promises"
import { statSync } from "node:fs"
import path from "node:path"
import crypto from "node:crypto"

export const CANVAS = { width: 1920, height: 1080 }
export const ELEMENT_TYPES = new Set(["text", "shape", "image", "table", "chart", "html"])

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
  const slideIds = new Set()
  for (const [slideIndex, slide] of (deck.slides || []).entries()) {
    const prefix = `slides[${slideIndex}]`
    if (!slide?.id) errors.push(`${prefix}.id is required`)
    else if (slideIds.has(slide.id)) errors.push(`${prefix}.id is duplicated: ${slide.id}`)
    else slideIds.add(slide.id)
    if (!Array.isArray(slide?.elements)) errors.push(`${prefix}.elements must be an array`)
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
          try { requireFile(assetPath) } catch { errors.push(`${at} asset not found: ${asset}`) }
        } else if (/^https?:/.test(asset)) warnings.push(`${at} uses a remote asset; localize it before publishing`)
      }
      if (element?.type === "text" && Number(element.fontSize || 0) < 16) warnings.push(`${at} uses text smaller than 16pt`)
    }
    const elements = slide?.elements || []
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
  return { errors, warnings }
}

function requireFile(file) {
  const stat = statSync(file)
  if (!stat.isFile()) throw new Error("not a file")
}

export async function validateDeckWithAssets(deck, baseDir = process.cwd()) {
  return validateDeck(deck, baseDir)
}
