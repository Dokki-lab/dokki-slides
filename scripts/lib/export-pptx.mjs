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
    slide.addText(String(element.text || ""), { ...common, fontFace: /[\u3400-\u9fff]/.test(element.text || "") ? deck.theme.fontFamilyCjk : deck.theme.fontFamily, fontSize: element.fontSize || 24, color: color(element.color, color(deck.theme.text, "111827")), bold: Number(element.fontWeight || 400) >= 600, italic: element.fontStyle === "italic", charSpacing: element.letterSpacing || 0, breakLine: false, fit: "shrink", align: element.align || "left", valign: element.valign === "middle" ? "mid" : element.valign === "bottom" ? "bottom" : "top", margin: element.margin ?? 0 })
    return
  }
  if (element.type === "shape") {
    const shape = element.shape === "ellipse" ? pptx.ShapeType.ellipse : element.shape === "roundRect" ? pptx.ShapeType.roundRect : element.shape === "line" ? pptx.ShapeType.line : pptx.ShapeType.rect
    const isLine = element.shape === "line"
    slide.addShape(shape, { ...common, fill: isLine ? { color: color(element.lineColor || element.fill, color(deck.theme.line, "D6D7D2")), transparency: 100 } : { color: color(element.fill, color(deck.theme.surface, "FFFFFF")), transparency: element.fillTransparency || 0 }, line: { color: color(element.lineColor || element.fill, color(deck.theme.line, "D6D7D2")), width: element.lineWidth || (isLine ? 1 : 0), transparency: element.lineWidth || isLine ? 0 : 100 } })
    return
  }
  if (element.type === "image") {
    slide.addImage({ ...common, ...imageSource(element.src, baseDir), altText: element.alt || "" })
    return
  }
  if (element.type === "table") {
    const rows = (element.rows || []).map((row) => row.map((cell) => ({ text: String(cell ?? ""), options: {} })))
    slide.addTable(rows, { ...common, border: { type: "solid", color: color(deck.theme.line, "D6D7D2"), pt: 0.6 }, color: color(deck.theme.text, "1A1A1A"), fill: color(deck.theme.background, "F7F8F5"), fontFace: deck.theme.fontFamily, fontSize: element.fontSize || 16, margin: 0.08, bold: false, rowH: Y(element.rowHeight || 54), colW: element.columnWidths?.map(X), autoFit: false })
    return
  }
  if (element.type === "chart") {
    const chartType = pptx.ChartType[element.chartType] || pptx.ChartType.bar
    const data = (element.series || []).map((series) => ({ name: series.name || "Series", labels: element.categories || [], values: series.values || [] }))
    slide.addChart(chartType, data, { ...common, showLegend: data.length > 1, showTitle: Boolean(element.title), title: element.title || "", showCatName: false, showSerName: false, showValue: element.showValue === true, showValAxisTitle: false, showCatAxisTitle: false, showBorder: false, catAxisLabelColor: color(deck.theme.muted, "666666"), valAxisLabelColor: color(deck.theme.muted, "666666"), catAxisLineColor: color(deck.theme.line, "D6D7D2"), valAxisLineColor: color(deck.theme.line, "D6D7D2"), chartColors: (element.colors || [deck.theme.accent]).map((entry) => color(entry, "F50132")), showLegendKey: false })
    return
  }
  if (element.type === "html") {
    slide.addImage({ ...common, ...imageSource(element.fallbackImage, baseDir), altText: element.alt || "Web-specific slide content" })
  }
}

function addBrandChrome(pptx, slide, authored, index, count, deck) {
  if (deck.theme.style !== "dokki-editorial") return
  const ink = color(deck.theme.text, "1A1A1A")
  const muted = color(deck.theme.muted, "666666")
  slide.addShape(pptx.ShapeType.line, { x: X(120), y: Y(48), w: X(1680), h: 0, line: { color: ink, width: 1.5 } })
  slide.addText("DOKKI", { x: X(120), y: Y(62), w: X(90), h: Y(26), margin: 0, fontFace: deck.theme.fontFamily, fontSize: 8, bold: true, charSpacing: 1.2, color: ink })
  slide.addText(`/ ${String(authored.role || "content").toUpperCase()}`, { x: X(218), y: Y(62), w: X(240), h: Y(26), margin: 0, fontFace: deck.theme.fontFamily, fontSize: 8, bold: true, charSpacing: 1, color: muted })
  slide.addText(`${String(index + 1).padStart(2, "0")} — ${String(count).padStart(2, "0")}`, { x: X(1650), y: Y(62), w: X(150), h: Y(26), margin: 0, fontFace: deck.theme.fontFamily, fontSize: 8, bold: true, charSpacing: 1, align: "right", color: muted })
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
  for (const [index, authored] of deck.slides.entries()) {
    const slide = pptx.addSlide()
    slide.background = { color: color(authored.background, color(deck.theme.background, "FFFFFF")) }
    addBrandChrome(pptx, slide, authored, index, deck.slides.length, deck)
    for (const element of [...authored.elements].sort((a, b) => (a.z || 0) - (b.z || 0))) addElement(pptx, slide, element, deck, baseDir)
    if (authored.notes) slide.addNotes(authored.notes)
  }
  await fs.mkdir(path.dirname(outputFile), { recursive: true })
  await pptx.writeFile({ fileName: outputFile, compression: true })
}
