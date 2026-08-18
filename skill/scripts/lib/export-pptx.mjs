import fs from "node:fs/promises"
import path from "node:path"
import PptxGenJS from "../vendor/pptxgenjs.mjs"
import { CANVAS, cleanHex } from "./model.mjs"

const X = (value) => value / CANVAS.width * 13.333
const Y = (value) => value / CANVAS.height * 7.5
const color = (value, fallback) => cleanHex(value, fallback)

function imageSource(src, baseDir) {
  if (/^data:/.test(src)) return { data: src }
  if (/^https?:/.test(src)) throw new Error(`Remote image must be localized before PPTX export: ${src}`)
  return { path: path.resolve(baseDir, src) }
}

function addElement(pptx, slide, element, deck, baseDir) {
  const common = { x: X(element.x), y: Y(element.y), w: X(element.w), h: Y(element.h), rotate: element.rotation || 0, transparency: Math.round((1 - (element.opacity ?? 1)) * 100) }
  if (element.type === "text") {
    slide.addText(String(element.text || ""), { ...common, fontFace: /[\u3400-\u9fff]/.test(element.text || "") ? deck.theme.fontFamilyCjk : deck.theme.fontFamily, fontSize: element.fontSize || 24, color: color(element.color, color(deck.theme.text, "111827")), bold: Number(element.fontWeight || 400) >= 600, align: element.align || "left", valign: element.valign === "middle" ? "mid" : element.valign === "bottom" ? "bottom" : "top", margin: element.margin ?? 0, breakLine: false, fit: "shrink" })
    return
  }
  if (element.type === "shape") {
    const shape = element.shape === "ellipse" ? pptx.ShapeType.ellipse : element.shape === "roundRect" ? pptx.ShapeType.roundRect : element.shape === "line" ? pptx.ShapeType.line : pptx.ShapeType.rect
    slide.addShape(shape, { ...common, fill: { color: color(element.fill, color(deck.theme.surface, "FFFFFF")), transparency: element.fillTransparency || 0 }, line: { color: color(element.lineColor, color(element.fill, "FFFFFF")), width: element.lineWidth || 0, transparency: element.lineWidth ? 0 : 100 }, radius: element.radius })
    return
  }
  if (element.type === "image") {
    slide.addImage({ ...common, ...imageSource(element.src, baseDir), altText: element.alt || "" })
    return
  }
  if (element.type === "table") {
    const rows = (element.rows || []).map((row) => row.map((cell) => ({ text: String(cell ?? ""), options: {} })))
    slide.addTable(rows, { ...common, border: { color: color(deck.theme.muted, "94A3B8"), pt: 1 }, color: color(deck.theme.text, "111827"), fill: color(deck.theme.background, "FFFFFF"), fontFace: deck.theme.fontFamily, fontSize: element.fontSize || 16, margin: 0.08, bold: false, rowH: Y(element.rowHeight || 54), colW: element.columnWidths?.map(X), autoFit: false })
    return
  }
  if (element.type === "chart") {
    const chartType = pptx.ChartType[element.chartType] || pptx.ChartType.bar
    const data = (element.series || []).map((series) => ({ name: series.name || "Series", labels: element.categories || [], values: series.values || [] }))
    slide.addChart(chartType, data, { ...common, showLegend: data.length > 1, showTitle: Boolean(element.title), title: element.title || "", catAxisLabelColor: color(deck.theme.muted, "64748B"), valAxisLabelColor: color(deck.theme.muted, "64748B"), chartColors: (element.colors || [deck.theme.accent]).map((c) => color(c, "635BFF")), showValue: element.showValue === true, showCatName: false, showSerName: false })
    return
  }
  if (element.type === "html") {
    slide.addImage({ ...common, ...imageSource(element.fallbackImage, baseDir), altText: element.alt || "Web-specific slide content" })
  }
}

export async function writePptx(deck, outputFile, { baseDir = process.cwd() } = {}) {
  const pptx = new PptxGenJS()
  pptx.layout = "LAYOUT_WIDE"
  pptx.author = "Dokki Slides"
  pptx.subject = `dokki-slides@1 revision ${deck.deckRevision}`
  pptx.title = deck.title
  pptx.company = "Dokki"
  pptx.lang = deck.locale
  pptx.theme = { headFontFace: deck.theme.fontFamily, bodyFontFace: deck.theme.fontFamily, lang: deck.locale }
  for (const authored of deck.slides) {
    const slide = pptx.addSlide()
    slide.background = { color: color(authored.background, color(deck.theme.background, "FFFFFF")) }
    for (const element of [...authored.elements].sort((a, b) => (a.z || 0) - (b.z || 0))) addElement(pptx, slide, element, deck, baseDir)
    if (authored.notes) slide.addNotes(authored.notes)
  }
  await fs.mkdir(path.dirname(outputFile), { recursive: true })
  await pptx.writeFile({ fileName: outputFile, compression: true })
}
