import fs from "node:fs/promises"
import path from "node:path"
import { CANVAS } from "./model.mjs"

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch])
const safeHtml = (value) => String(value || "").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/\son\w+\s*=\s*(["']).*?\1/gi, "")
const cssColor = (value, fallback) => /^#?[0-9a-f]{6}$/i.test(String(value || "")) ? (String(value).startsWith("#") ? String(value) : `#${value}`) : fallback
const box = (e) => `left:${e.x / CANVAS.width * 100}%;top:${e.y / CANVAS.height * 100}%;width:${e.w / CANVAS.width * 100}%;height:${e.h / CANVAS.height * 100}%;z-index:${e.z ?? 1};opacity:${e.opacity ?? 1};transform:rotate(${e.rotation ?? 0}deg)`

function renderElement(element, theme) {
  if (element.type === "text") {
    return `<div class="el text" data-element-id="${escapeHtml(element.id)}" style="${box(element)};font-size:${element.fontSize || 24}px;color:${cssColor(element.color, theme.text)};font-weight:${element.fontWeight || 400};text-align:${element.align || "left"};justify-content:${element.valign === "middle" ? "center" : element.valign === "bottom" ? "flex-end" : "flex-start"}">${escapeHtml(element.text).replace(/\n/g, "<br>")}</div>`
  }
  if (element.type === "shape") {
    const radius = element.shape === "ellipse" ? "50%" : element.shape === "roundRect" ? "24px" : "0"
    return `<div class="el" data-element-id="${escapeHtml(element.id)}" style="${box(element)};background:${cssColor(element.fill, theme.surface)};border:${element.lineWidth || 0}px solid ${cssColor(element.lineColor, "transparent")};border-radius:${radius}"></div>`
  }
  if (element.type === "image") return `<img class="el image" data-element-id="${escapeHtml(element.id)}" src="${escapeHtml(element.src)}" alt="${escapeHtml(element.alt || "")}" style="${box(element)};object-fit:${element.fit || "cover"}">`
  if (element.type === "table") {
    const rows = (element.rows || []).map((row, rowIndex) => `<tr>${row.map((cell) => `<${rowIndex === 0 && element.header !== false ? "th" : "td"}>${escapeHtml(cell)}</${rowIndex === 0 && element.header !== false ? "th" : "td"}>`).join("")}</tr>`).join("")
    return `<div class="el table-wrap" data-element-id="${escapeHtml(element.id)}" style="${box(element)}"><table>${rows}</table></div>`
  }
  if (element.type === "chart") {
    const values = element.series?.[0]?.values || []
    const max = Math.max(1, ...values)
    const bars = values.map((value, index) => `<div class="bar-item"><div class="bar" style="height:${Math.max(2, Number(value) / max * 82)}%;background:${cssColor(element.colors?.[index] || theme.accent, theme.accent)}"></div><span>${escapeHtml(element.categories?.[index] || "")}</span></div>`).join("")
    return `<div class="el chart" data-element-id="${escapeHtml(element.id)}" style="${box(element)}">${bars}</div>`
  }
  if (element.type === "html") return `<div class="el custom" data-element-id="${escapeHtml(element.id)}" style="${box(element)}">${safeHtml(element.html)}</div>`
  return ""
}

export async function renderHtml(deck, { baseDir, exportUrl = "exports/deck.pptx" } = {}) {
  const theme = {
    background: cssColor(deck.theme.background, "#0b1020"), surface: cssColor(deck.theme.surface, "#151c32"), text: cssColor(deck.theme.text, "#f8fafc"), muted: cssColor(deck.theme.muted, "#94a3b8"), accent: cssColor(deck.theme.accent, "#635bff"), fontFamily: deck.theme.fontFamily || "Inter", fontFamilyCjk: deck.theme.fontFamilyCjk || "Noto Sans SC",
  }
  const slides = deck.slides.map((slide, index) => `<section class="slide${index === 0 ? " active" : ""}" data-slide-id="${escapeHtml(slide.id)}" aria-label="Slide ${index + 1} of ${deck.slides.length}" style="background:${cssColor(slide.background, theme.background)}">${slide.elements.map((e) => renderElement(e, theme)).join("")}<aside class="notes" hidden>${escapeHtml(slide.notes || "")}</aside></section>`).join("")
  const serialized = JSON.stringify(deck).replace(/<\//g, "<\\/")
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(deck.title)}</title><style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#070a12;color:${theme.text};font-family:${theme.fontFamily},${theme.fontFamilyCjk},system-ui,sans-serif}.deck{position:absolute;inset:0;display:grid;place-items:center}.stage{position:relative;width:min(100vw,calc(100vh * 16/9));aspect-ratio:16/9;overflow:hidden;background:${theme.background};box-shadow:0 30px 80px #0008}.slide{display:none;position:absolute;inset:0;overflow:hidden}.slide.active{display:block}.el{position:absolute}.text{display:flex;white-space:pre-wrap;line-height:1.18}.image{display:block}.table-wrap{overflow:hidden}table{border-collapse:collapse;width:100%;height:100%;font-size:22px}th,td{border:1px solid ${theme.muted}66;padding:10px;text-align:left}th{background:${theme.surface};color:${theme.text}}.chart{display:flex;align-items:end;gap:18px;padding:20px}.bar-item{height:100%;flex:1;display:flex;flex-direction:column;justify-content:end;align-items:center;gap:8px;color:${theme.muted};font-size:18px}.bar{width:70%;border-radius:8px 8px 0 0}.toolbar{position:fixed;left:50%;bottom:18px;z-index:100;transform:translateX(-50%);display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #ffffff24;border-radius:999px;background:#0b1020dd;backdrop-filter:blur(12px)}button,.export{border:0;border-radius:999px;padding:8px 12px;background:#ffffff16;color:white;text-decoration:none;font:inherit;cursor:pointer}.export{background:${theme.accent}}.counter{min-width:72px;text-align:center;color:${theme.muted};font-size:13px}@media print{.toolbar{display:none}.stage{box-shadow:none}}
</style></head><body><main class="deck"><div class="stage">${slides}</div></main><nav class="toolbar" aria-label="Presentation controls"><button id="prev" aria-label="Previous slide">←</button><span class="counter" id="counter"></span><button id="next" aria-label="Next slide">→</button><button id="fullscreen">Full screen</button><a class="export" href="${escapeHtml(exportUrl)}" target="_blank" rel="noopener">Export PPTX</a></nav><script id="dokki-slides-data" type="application/json">${serialized}</script><script>
(()=>{const slides=[...document.querySelectorAll('.slide')];let i=0;const counter=document.getElementById('counter');function show(n){i=(n+slides.length)%slides.length;slides.forEach((s,j)=>s.classList.toggle('active',j===i));counter.textContent=(i+1)+' / '+slides.length;history.replaceState(null,'','#slide-'+(i+1))}prev.onclick=()=>show(i-1);next.onclick=()=>show(i+1);fullscreen.onclick=()=>document.querySelector('.stage').requestFullscreen?.();addEventListener('keydown',e=>{if(['ArrowRight','PageDown',' '].includes(e.key))show(i+1);if(['ArrowLeft','PageUp'].includes(e.key))show(i-1);if(e.key==='Home')show(0);if(e.key==='End')show(slides.length-1)});const hash=Number(location.hash.replace('#slide-',''));show(Number.isFinite(hash)&&hash>0?hash-1:0)})();
</script></body></html>`
}

export async function writeHtml(deck, outputFile, options = {}) {
  await fs.mkdir(path.dirname(outputFile), { recursive: true })
  await fs.writeFile(outputFile, await renderHtml(deck, options), "utf8")
}

