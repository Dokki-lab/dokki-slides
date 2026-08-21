import fs from "node:fs/promises"
import path from "node:path"
import { CANVAS } from "./model.mjs"

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch])
const safeHtml = (value) => String(value || "").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/\son\w+\s*=\s*(["']).*?\1/gi, "")
const cssColor = (value, fallback) => /^#?[0-9a-f]{6}$/i.test(String(value || "")) ? (String(value).startsWith("#") ? String(value) : `#${value}`) : fallback
const box = (element) => `left:${element.x / CANVAS.width * 100}%;top:${element.y / CANVAS.height * 100}%;width:${element.w / CANVAS.width * 100}%;height:${element.h / CANVAS.height * 100}%;z-index:${element.z ?? 1};opacity:${element.opacity ?? 1};transform:rotate(${element.rotation ?? 0}deg)`

function renderElement(element, theme) {
  const identity = `data-element-id="${escapeHtml(element.id)}"`
  if (element.type === "text") {
    const style = [box(element), `font-size:${Number(element.fontSize || 24) * 2}px`, `color:${cssColor(element.color, theme.text)}`, `font-weight:${element.fontWeight || 400}`, `font-style:${element.fontStyle || "normal"}`, `letter-spacing:${element.letterSpacing || 0}px`, `line-height:${element.lineHeight || 1.12}`, `text-align:${element.align || "left"}`, `justify-content:${element.valign === "middle" ? "center" : element.valign === "bottom" ? "flex-end" : "flex-start"}`].join(";")
    return `<div class="el text text-${escapeHtml(element.textRole || "body")}${element.primary ? " primary" : ""}" ${identity} style="${style}">${escapeHtml(element.text).replace(/\n/g, "<br>")}</div>`
  }
  if (element.type === "shape") {
    if (element.shape === "line") return `<div class="el line" ${identity} style="${box(element)};background:${cssColor(element.lineColor || element.fill, theme.line)};height:${Math.max(1, element.lineWidth || element.h)}px"></div>`
    const radius = element.shape === "ellipse" ? "50%" : element.shape === "roundRect" ? "18px" : "0"
    return `<div class="el shape" ${identity} style="${box(element)};background:${cssColor(element.fill, theme.surface)};border:${element.lineWidth || 0}px solid ${cssColor(element.lineColor, "transparent")};border-radius:${radius}"></div>`
  }
  if (element.type === "image") return `<img class="el image" ${identity} src="${escapeHtml(element.src)}" alt="${escapeHtml(element.alt || "")}" style="${box(element)};object-fit:${element.fit || "cover"}">`
  if (element.type === "table") {
    const rows = (element.rows || []).map((row, rowIndex) => `<tr>${row.map((cell) => `<${rowIndex === 0 && element.header !== false ? "th" : "td"}>${escapeHtml(cell)}</${rowIndex === 0 && element.header !== false ? "th" : "td"}>`).join("")}</tr>`).join("")
    return `<div class="el table-wrap" ${identity} style="${box(element)};font-size:${Number(element.fontSize || 18) * 2}px"><table>${rows}</table></div>`
  }
  if (element.type === "chart") {
    const values = element.series?.[0]?.values || []
    const max = Math.max(1, ...values.map(Number))
    const bars = values.map((value, index) => `<div class="bar-item"><strong>${escapeHtml(value)}</strong><div class="bar" style="height:${Math.max(2, Number(value) / max * 78)}%;background:${cssColor(element.colors?.[index] || theme.accent, theme.accent)}"></div><span>${escapeHtml(element.categories?.[index] || "")}</span></div>`).join("")
    return `<div class="el chart" ${identity} style="${box(element)}">${bars}</div>`
  }
  if (element.type === "html") return `<div class="el custom" ${identity} style="${box(element)}">${safeHtml(element.html)}</div>`
  return ""
}

function renderChrome(slide, index, count, theme) {
  if (theme.style !== "dokki-editorial") return ""
  return `<div class="brand-chrome" aria-hidden="true"><span class="brand-word">DOKKI</span><span class="brand-role">/ ${escapeHtml(String(slide.role || "content").toUpperCase())}</span><span class="brand-page">${String(index + 1).padStart(2, "0")} — ${String(count).padStart(2, "0")}</span></div>`
}

export async function renderHtml(deck, { baseDir, exportUrl = "exports/deck.pptx" } = {}) {
  void baseDir
  const theme = { style: deck.theme.style || "custom", background: cssColor(deck.theme.background, "#F7F8F5"), surface: cssColor(deck.theme.surface, "#FFFFFF"), text: cssColor(deck.theme.text, "#1A1A1A"), muted: cssColor(deck.theme.muted, "#666666"), accent: cssColor(deck.theme.accent, "#F50132"), line: cssColor(deck.theme.line, "#D6D7D2"), dark: cssColor(deck.theme.dark, "#050706"), fontFamily: deck.theme.fontFamily || "Aptos", fontFamilyCjk: deck.theme.fontFamilyCjk || "PingFang SC" }
  const slides = deck.slides.map((slide, index) => {
    const elements = [...slide.elements].sort((a, b) => (a.z || 0) - (b.z || 0)).map((element) => renderElement(element, theme)).join("")
    return `<section class="slide layout-${escapeHtml(slide.layout || "custom")} role-${escapeHtml(slide.role || "content")}${index === 0 ? " active" : ""}" data-slide-id="${escapeHtml(slide.id)}" aria-label="Slide ${index + 1} of ${deck.slides.length}" style="background:${cssColor(slide.background, theme.background)}">${renderChrome(slide, index, deck.slides.length, theme)}${elements}<aside class="notes" hidden>${escapeHtml(slide.notes || "")}</aside></section>`
  }).join("")
  const serialized = JSON.stringify(deck).replace(/<\//g, "<\\/")
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${escapeHtml(deck.title)}</title><style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#050706;color:${theme.text};font-family:${theme.fontFamily},${theme.fontFamilyCjk},system-ui,sans-serif}.deck{position:absolute;inset:0;overflow:hidden}.stage{position:absolute;left:50%;top:50%;width:${CANVAS.width}px;height:${CANVAS.height}px;overflow:hidden;background:${theme.background};box-shadow:0 30px 80px #0009;transform-origin:center center;will-change:transform}.slide{display:none;position:absolute;inset:0;overflow:hidden}.slide.active{display:block}.el{position:absolute}.text{display:flex;white-space:pre-wrap;overflow:hidden}.text-display,.text-kpi{letter-spacing:-.035em}.text-title{letter-spacing:-.025em}.text-label,.text-meta{letter-spacing:.06em;text-transform:uppercase}.image{display:block}.table-wrap{overflow:hidden}table{border-collapse:collapse;width:100%;height:100%;font-size:inherit}th,td{border:0;border-bottom:1px solid ${theme.line};padding:14px 18px;text-align:left;vertical-align:middle}th{background:${theme.dark};color:white;font-weight:600;letter-spacing:.04em;text-transform:uppercase}.chart{display:flex;align-items:end;gap:24px;padding:0;border-bottom:1px solid ${theme.line}}.bar-item{height:100%;flex:1;display:flex;flex-direction:column;justify-content:end;align-items:stretch;gap:10px;color:${theme.muted};font-size:28px}.bar-item strong{color:${theme.text};font-size:32px;font-weight:600}.bar{width:100%;min-height:2px}.brand-chrome{position:absolute;z-index:90;left:120px;right:120px;top:48px;height:28px;display:flex;align-items:center;border-top:3px solid ${theme.text};padding-top:11px;font-size:16px;font-weight:600;letter-spacing:.1em}.brand-word{color:${theme.text}}.brand-role{margin-left:8px;color:${theme.muted}}.brand-page{margin-left:auto;color:${theme.muted};font-variant-numeric:tabular-nums}.toolbar{position:fixed;left:50%;bottom:max(18px,env(safe-area-inset-bottom));z-index:100;max-width:calc(100% - 24px);transform:translateX(-50%);display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #ffffff24;border-radius:999px;background:#050706e8;backdrop-filter:blur(12px)}button,.export{min-height:40px;border:0;border-radius:999px;padding:8px 12px;background:#ffffff16;color:white;text-decoration:none;font:inherit;line-height:1.15;cursor:pointer}.export{display:grid;place-items:center;background:${theme.accent}}.counter{min-width:72px;text-align:center;color:#aaa;font-size:13px}@media(max-width:600px){.toolbar{bottom:max(10px,env(safe-area-inset-bottom));gap:4px;padding:6px}.toolbar button,.toolbar .export{min-height:44px;padding:8px 10px}.counter{min-width:48px}}@media print{.toolbar{display:none}.stage{box-shadow:none}}
</style></head><body><main class="deck"><div class="stage" data-canvas-width="${CANVAS.width}" data-canvas-height="${CANVAS.height}">${slides}</div></main><nav class="toolbar" aria-label="Presentation controls"><button id="prev" aria-label="Previous slide">←</button><span class="counter" id="counter"></span><button id="next" aria-label="Next slide">→</button><button id="fullscreen">Full screen</button><a class="export" href="${escapeHtml(exportUrl)}" target="_blank" rel="noopener">Export PPTX</a></nav><script id="dokki-slides-data" type="application/json">${serialized}</script><script>
(()=>{const deck=document.querySelector('.deck');const stage=document.querySelector('.stage');const slides=[...document.querySelectorAll('.slide')];let i=0;const counter=document.getElementById('counter');function fit(){const rect=deck.getBoundingClientRect();const scale=Math.min(rect.width/${CANVAS.width},rect.height/${CANVAS.height});stage.style.transform='translate(-50%,-50%) scale('+Math.max(0,scale)+')'}function show(n){i=(n+slides.length)%slides.length;slides.forEach((s,j)=>s.classList.toggle('active',j===i));counter.textContent=(i+1)+' / '+slides.length;history.replaceState(null,'','#slide-'+(i+1))}prev.onclick=()=>show(i-1);next.onclick=()=>show(i+1);fullscreen.onclick=()=>deck.requestFullscreen?.();addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);new ResizeObserver(fit).observe(deck);fit();addEventListener('keydown',e=>{if(['ArrowRight','PageDown',' '].includes(e.key))show(i+1);if(['ArrowLeft','PageUp'].includes(e.key))show(i-1);if(e.key==='Home')show(0);if(e.key==='End')show(slides.length-1)});const hash=Number(location.hash.replace('#slide-',''));show(Number.isFinite(hash)&&hash>0?hash-1:0)})();
</script></body></html>`
}

export async function writeHtml(deck, outputFile, options = {}) {
  await fs.mkdir(path.dirname(outputFile), { recursive: true })
  await fs.writeFile(outputFile, await renderHtml(deck, options), "utf8")
}
