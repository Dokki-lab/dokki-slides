// dokki-slides-core — built from Dokki-lab/Dokki@5cb88bcad158e6978e4a645acce8240e55ed02b4 (lib/slides). Do not edit; rebuild with scripts/build-slides-core.mjs.

// lib/slides/model.ts
var SLIDE_DECK_SCHEMA_VERSION = 1;
var SLIDE_CANVAS_WIDTH = 1920;
var SLIDE_CANVAS_HEIGHT = 1080;
var SLIDE_MAX_SLIDES = 300;
var SLIDE_MAX_ELEMENTS_PER_SLIDE = 200;
var SLIDE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
var SLIDE_ELEMENT_TYPES = ["text", "shape", "image", "chart", "table", "group"];
var SLIDE_SHAPE_KINDS = [
  "rect",
  "roundRect",
  "ellipse",
  "triangle",
  "rightTriangle",
  "diamond",
  "pentagon",
  "hexagon",
  "star",
  "arrowRight",
  "chevron",
  "line",
  "arrow",
  "path"
];
var SLIDE_CHART_TYPES = [
  "bar",
  "column",
  "line",
  "area",
  "pie",
  "donut",
  "scatter"
];
var DEFAULT_DECK_THEME = {
  colors: {
    background: "#FFFFFF",
    surface: "#F4F4F2",
    text: "#1A1A1A",
    muted: "#6B6B66",
    accent: "#2F6BFF",
    accent2: "#FF7A45",
    accent3: "#12B886"
  },
  fonts: {
    heading: "Inter, 'Noto Sans SC', system-ui, sans-serif",
    body: "Inter, 'Noto Sans SC', system-ui, sans-serif"
  }
};
function createDeckMeta(overrides = {}) {
  return {
    schemaVersion: SLIDE_DECK_SCHEMA_VERSION,
    title: "Untitled slides",
    width: SLIDE_CANVAS_WIDTH,
    height: SLIDE_CANVAS_HEIGHT,
    theme: DEFAULT_DECK_THEME,
    ...overrides
  };
}
var ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
function newSlideId(prefix = "s") {
  let out = prefix;
  for (let i = 0; i < 10; i++) out += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
  return out;
}
function isValidSlideId(value) {
  return typeof value === "string" && SLIDE_ID_PATTERN.test(value);
}
function base(type, id, frame, defaults) {
  return {
    id,
    type,
    x: frame.x ?? 160,
    y: frame.y ?? 160,
    w: frame.w ?? defaults.w,
    h: frame.h ?? defaults.h,
    rotation: 0,
    opacity: 1
  };
}
function createTextElement(id, init = {}) {
  const { x, y, w, h, ...rest } = init;
  return {
    ...base("text", id, { x, y, w, h }, { w: 800, h: 120 }),
    html: "<p>Text</p>",
    fontSize: 40,
    color: "#1A1A1A",
    align: "left",
    valign: "top",
    lineHeight: 1.25,
    padding: 0,
    ...rest
  };
}
function createShapeElement(id, init = {}) {
  const { x, y, w, h, ...rest } = init;
  const shape = rest.shape ?? "rect";
  const isLine = shape === "line" || shape === "arrow";
  return {
    ...base("shape", id, { x, y, w, h }, isLine ? { w: 400, h: 4 } : { w: 320, h: 320 }),
    shape,
    fill: isLine ? { type: "none" } : { type: "solid", color: "#2F6BFF" },
    ...isLine ? {
      stroke: { color: "#1A1A1A", width: 4 },
      points: { x1: 0, y1: 0.5, x2: 1, y2: 0.5 },
      markerEnd: shape === "arrow" ? "arrow" : "none"
    } : {},
    ...shape === "roundRect" ? { radius: 24 } : {},
    ...rest
  };
}
function createImageElement(id, init) {
  const { x, y, w, h, ...rest } = init;
  return {
    ...base("image", id, { x, y, w, h }, { w: 640, h: 480 }),
    fit: "cover",
    ...rest
  };
}
function createChartElement(id, init = {}) {
  const { x, y, w, h, ...rest } = init;
  return {
    ...base("chart", id, { x, y, w, h }, { w: 900, h: 540 }),
    chartType: "column",
    categories: ["Q1", "Q2", "Q3", "Q4"],
    series: [{ name: "Series 1", values: [30, 55, 45, 80] }],
    showLegend: true,
    showValues: false,
    showGrid: true,
    ...rest
  };
}
function createTableElement(id, init = {}) {
  const { x, y, w, h, ...rest } = init;
  return {
    ...base("table", id, { x, y, w, h }, { w: 1200, h: 360 }),
    rows: [
      ["Column A", "Column B", "Column C"],
      ["", "", ""],
      ["", "", ""]
    ],
    fontSize: 24,
    headerRow: true,
    headerFill: "#1A1A1A",
    headerColor: "#FFFFFF",
    textColor: "#1A1A1A",
    borderColor: "#D9D9D4",
    ...rest
  };
}
function createGroupElement(id, childIds, frame) {
  return { ...base("group", id, frame, { w: frame.w, h: frame.h }), childIds };
}
function createSlide(id, init = {}) {
  return { id, ...init };
}
function elementLabel(element) {
  if (element.name) return element.name;
  switch (element.type) {
    case "text": {
      const plain = element.html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
      return plain ? plain.slice(0, 40) : "Text";
    }
    case "shape":
      return element.shape === "line" || element.shape === "arrow" ? "Line" : "Shape";
    case "image":
      return element.alt || "Image";
    case "chart":
      return element.title || "Chart";
    case "table":
      return "Table";
    case "group":
      return "Group";
  }
}
var SlideModelError = class extends Error {
  constructor(message, path) {
    super(message);
    this.path = path;
    this.name = "SlideModelError";
  }
};
var HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
var CSS_COLOR_FN = /^(?:rgba?|hsla?)\([^()]{1,60}\)$/;
function isColor(value) {
  return typeof value === "string" && (value === "transparent" || HEX_COLOR.test(value) || CSS_COLOR_FN.test(value));
}
function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}
function checkFill(fill, path) {
  if (fill === void 0) return;
  if (!fill || typeof fill !== "object") throw new SlideModelError("fill must be an object", path);
  const f = fill;
  switch (f.type) {
    case "none":
      return;
    case "solid":
      if (!isColor(f.color)) throw new SlideModelError("fill.color must be a color", path);
      return;
    case "gradient":
      if (!finite(f.angle)) throw new SlideModelError("fill.angle must be a number", path);
      if (!Array.isArray(f.stops) || f.stops.length < 2 || f.stops.length > 8)
        throw new SlideModelError("fill.stops needs 2\u20138 stops", path);
      for (const stop of f.stops) {
        if (!finite(stop?.offset) || stop.offset < 0 || stop.offset > 1 || !isColor(stop.color))
          throw new SlideModelError("fill.stops entries need offset 0..1 and a color", path);
      }
      return;
    case "image":
      if (typeof f.src !== "string" || !isSafeImageSrc(f.src))
        throw new SlideModelError("fill.src must be an https or data image URL", path);
      return;
    default:
      throw new SlideModelError(`unknown fill type ${f.type}`, path);
  }
}
function checkStroke(stroke, path) {
  if (stroke === void 0) return;
  if (!stroke || typeof stroke !== "object")
    throw new SlideModelError("stroke must be an object", path);
  const s = stroke;
  if (!isColor(s.color)) throw new SlideModelError("stroke.color must be a color", path);
  if (!finite(s.width) || s.width < 0 || s.width > 200)
    throw new SlideModelError("stroke.width must be 0..200", path);
}
function checkShadow(shadow, path) {
  if (shadow === void 0) return;
  if (!shadow || typeof shadow !== "object")
    throw new SlideModelError("shadow must be an object", path);
  const s = shadow;
  if (![s.x, s.y, s.blur].every(finite) || !isColor(s.color))
    throw new SlideModelError("shadow needs x, y, blur and a color", path);
}
function isSafeImageSrc(value) {
  if (/^https:\/\/[^\s"'<>]{1,2000}$/i.test(value)) return true;
  if (/^data:image\/(?:png|jpe?g|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=]{1,4000000}$/i.test(value))
    return true;
  if (/^\/(?:api\/brand-assets|api\/upload|uploads|brand)\/[^\s"'<>]{1,500}$/.test(value))
    return true;
  return false;
}
var RICH_TEXT_MAX = 2e4;
function validateElement(element, path = "element") {
  if (!element || typeof element !== "object" || Array.isArray(element))
    throw new SlideModelError("element must be an object", path);
  const e = element;
  if (!isValidSlideId(e.id)) throw new SlideModelError("element.id is invalid", path);
  if (!SLIDE_ELEMENT_TYPES.includes(e.type))
    throw new SlideModelError(`element.type ${String(e.type)} is unsupported`, path);
  for (const key of ["x", "y", "w", "h", "rotation", "opacity"]) {
    if (!finite(e[key])) throw new SlideModelError(`element.${key} must be a number`, path);
  }
  if (e.w <= 0 || e.h <= 0) throw new SlideModelError("element size must be positive", path);
  if (Math.abs(e.x) > 5e4 || Math.abs(e.y) > 5e4 || e.w > 5e4 || e.h > 5e4)
    throw new SlideModelError("element frame is out of range", path);
  if (e.opacity < 0 || e.opacity > 1)
    throw new SlideModelError("element.opacity must be 0..1", path);
  if (e.name !== void 0 && (typeof e.name !== "string" || e.name.length > 120))
    throw new SlideModelError("element.name must be a short string", path);
  if (e.groupId !== void 0 && !isValidSlideId(e.groupId))
    throw new SlideModelError("element.groupId is invalid", path);
  switch (e.type) {
    case "text":
      if (typeof e.html !== "string" || e.html.length > RICH_TEXT_MAX)
        throw new SlideModelError("text.html must be a string", path);
      if (!finite(e.fontSize) || e.fontSize < 4 || e.fontSize > 600)
        throw new SlideModelError("text.fontSize must be 4..600", path);
      if (!isColor(e.color)) throw new SlideModelError("text.color must be a color", path);
      checkFill(e.fill, path);
      checkStroke(e.stroke, path);
      checkShadow(e.shadow, path);
      break;
    case "shape":
      if (!SLIDE_SHAPE_KINDS.includes(e.shape))
        throw new SlideModelError(`shape.shape ${String(e.shape)} is unsupported`, path);
      checkFill(e.fill, path);
      checkStroke(e.stroke, path);
      checkShadow(e.shadow, path);
      if (e.points !== void 0) {
        const p2 = e.points;
        if (!p2 || ![p2.x1, p2.y1, p2.x2, p2.y2].every(finite))
          throw new SlideModelError("shape.points needs x1,y1,x2,y2", path);
      }
      if (e.path !== void 0 && (typeof e.path !== "string" || !/^[MmLlHhVvCcSsQqTtAaZz0-9 .,-]{1,20000}$/.test(e.path)))
        throw new SlideModelError("shape.path must be SVG path data", path);
      if (e.html !== void 0 && (typeof e.html !== "string" || e.html.length > RICH_TEXT_MAX))
        throw new SlideModelError("shape.html must be a string", path);
      break;
    case "image":
      if (typeof e.src !== "string" || !isSafeImageSrc(e.src))
        throw new SlideModelError("image.src must be an https or data image URL", path);
      if (!["cover", "contain", "fill"].includes(e.fit))
        throw new SlideModelError("image.fit must be cover, contain or fill", path);
      if (e.crop !== void 0) {
        const c = e.crop;
        if (!c || ![c.x, c.y, c.w, c.h].every(finite) || c.w <= 0 || c.h <= 0)
          throw new SlideModelError("image.crop needs positive x,y,w,h fractions", path);
      }
      checkStroke(e.stroke, path);
      checkShadow(e.shadow, path);
      break;
    case "chart":
      if (!SLIDE_CHART_TYPES.includes(e.chartType))
        throw new SlideModelError(`chart.chartType ${String(e.chartType)} is unsupported`, path);
      if (!Array.isArray(e.categories) || e.categories.length > 500)
        throw new SlideModelError("chart.categories must be an array", path);
      if (!Array.isArray(e.series) || e.series.length === 0 || e.series.length > 24)
        throw new SlideModelError("chart.series needs 1..24 series", path);
      for (const series of e.series) {
        if (!series || typeof series.name !== "string" || !Array.isArray(series.values))
          throw new SlideModelError("chart.series entries need name and values", path);
        if (series.values.length > 500 || !series.values.every(finite))
          throw new SlideModelError("chart.series values must be finite numbers", path);
        if (series.color !== void 0 && !isColor(series.color))
          throw new SlideModelError("chart.series color must be a color", path);
      }
      break;
    case "table":
      if (!Array.isArray(e.rows) || e.rows.length === 0 || e.rows.length > 200)
        throw new SlideModelError("table.rows needs 1..200 rows", path);
      for (const row of e.rows) {
        if (!Array.isArray(row) || row.length === 0 || row.length > 40)
          throw new SlideModelError("table rows need 1..40 cells", path);
        if (!row.every((cell) => typeof cell === "string" && cell.length <= 2e3))
          throw new SlideModelError("table cells must be strings", path);
      }
      if (e.colWidths !== void 0) {
        if (!Array.isArray(e.colWidths) || !e.colWidths.every((w) => finite(w) && w > 0))
          throw new SlideModelError("table.colWidths must be positive numbers", path);
      }
      if (!finite(e.fontSize) || e.fontSize < 4 || e.fontSize > 200)
        throw new SlideModelError("table.fontSize must be 4..200", path);
      break;
    case "group":
      if (!Array.isArray(e.childIds) || e.childIds.length < 1 || !e.childIds.every(isValidSlideId))
        throw new SlideModelError("group.childIds must list element ids", path);
      break;
  }
  return e;
}
function validateSlide(slide, path = "slide") {
  if (!slide || typeof slide !== "object" || Array.isArray(slide))
    throw new SlideModelError("slide must be an object", path);
  const s = slide;
  if (!isValidSlideId(s.id)) throw new SlideModelError("slide.id is invalid", path);
  if (s.name !== void 0 && (typeof s.name !== "string" || s.name.length > 200))
    throw new SlideModelError("slide.name must be a short string", path);
  if (s.notes !== void 0 && (typeof s.notes !== "string" || s.notes.length > 2e4))
    throw new SlideModelError("slide.notes must be a string", path);
  checkFill(s.background, path);
  return s;
}
function validateTheme(theme, path = "theme") {
  if (!theme || typeof theme !== "object")
    throw new SlideModelError("theme must be an object", path);
  const t = theme;
  if (!t.colors || typeof t.colors !== "object")
    throw new SlideModelError("theme.colors is required", path);
  for (const key of Object.keys(DEFAULT_DECK_THEME.colors)) {
    if (!isColor(t.colors[key]))
      throw new SlideModelError(`theme.colors.${key} must be a color`, path);
  }
  if (!t.fonts || typeof t.fonts.heading !== "string" || typeof t.fonts.body !== "string")
    throw new SlideModelError("theme.fonts needs heading and body", path);
  return t;
}
function validateDeckMeta(meta, path = "meta") {
  if (!meta || typeof meta !== "object") throw new SlideModelError("meta must be an object", path);
  const m = meta;
  if (m.schemaVersion !== SLIDE_DECK_SCHEMA_VERSION)
    throw new SlideModelError(`meta.schemaVersion must be ${SLIDE_DECK_SCHEMA_VERSION}`, path);
  if (typeof m.title !== "string" || m.title.length > 300)
    throw new SlideModelError("meta.title must be a string", path);
  if (!finite(m.width) || !finite(m.height) || m.width < 320 || m.height < 180)
    throw new SlideModelError("meta.width/height are out of range", path);
  validateTheme(m.theme, `${path}.theme`);
  return m;
}
function validateDeckSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") throw new SlideModelError("deck must be an object");
  const d = snapshot;
  validateDeckMeta(d.meta);
  if (!Array.isArray(d.slides) || d.slides.length === 0)
    throw new SlideModelError("deck.slides needs at least one slide");
  if (d.slides.length > SLIDE_MAX_SLIDES)
    throw new SlideModelError(`deck.slides exceeds ${SLIDE_MAX_SLIDES}`);
  if (!d.elements || typeof d.elements !== "object")
    throw new SlideModelError("deck.elements must map slide ids to arrays");
  const slideIds = /* @__PURE__ */ new Set();
  for (const [index, slide] of d.slides.entries()) {
    validateSlide(slide, `slides[${index}]`);
    if (slideIds.has(slide.id)) throw new SlideModelError(`duplicate slide id ${slide.id}`);
    slideIds.add(slide.id);
    const elements = d.elements[slide.id] ?? [];
    if (!Array.isArray(elements))
      throw new SlideModelError(`elements[${slide.id}] must be an array`);
    if (elements.length > SLIDE_MAX_ELEMENTS_PER_SLIDE)
      throw new SlideModelError(
        `slide ${slide.id} exceeds ${SLIDE_MAX_ELEMENTS_PER_SLIDE} elements`
      );
    const ids = /* @__PURE__ */ new Set();
    for (const [i, element] of elements.entries()) {
      validateElement(element, `elements[${slide.id}][${i}]`);
      if (ids.has(element.id)) throw new SlideModelError(`duplicate element id ${element.id}`);
      ids.add(element.id);
    }
    for (const element of elements) {
      if (element.type === "group") {
        for (const childId of element.childIds) {
          const child = elements.find((c) => c.id === childId);
          if (!child) throw new SlideModelError(`group ${element.id} references missing ${childId}`);
          if (child.groupId !== element.id)
            throw new SlideModelError(
              `element ${childId} is not marked as a child of ${element.id}`
            );
        }
      } else if (element.groupId) {
        const group = elements.find((g) => g.id === element.groupId);
        if (!group || group.type !== "group" || !group.childIds.includes(element.id))
          throw new SlideModelError(`element ${element.id} points at a group that does not own it`);
      }
    }
  }
  for (const key of Object.keys(d.elements)) {
    if (!slideIds.has(key)) throw new SlideModelError(`elements[${key}] has no slide`);
  }
  return d;
}
var DECK_OP_NAMES = [
  "deck.update",
  "slide.add",
  "slide.remove",
  "slide.move",
  "slide.update",
  "element.add",
  "element.update",
  "element.remove",
  "element.reorder",
  "element.group",
  "element.ungroup"
];
function patchElement(element, patch) {
  const next = { ...element };
  for (const [key, value] of Object.entries(patch)) {
    if (key === "id" || key === "type") continue;
    if (value === void 0 || value === null) delete next[key];
    else next[key] = value;
  }
  return validateElement(next, `element ${element.id}`);
}
function resolveZIndex(current, count, to) {
  const last = count - 1;
  switch (to) {
    case "front":
      return last;
    case "back":
      return 0;
    case "forward":
      return Math.min(last, current + 1);
    case "backward":
      return Math.max(0, current - 1);
    default:
      return Math.max(0, Math.min(last, Math.floor(to)));
  }
}
function duplicateSlideOps(snapshot, slideId, makeId = newSlideId) {
  const index = snapshot.slides.findIndex((s) => s.id === slideId);
  if (index < 0) throw new SlideModelError(`slide ${slideId} not found`);
  const source = snapshot.slides[index];
  const newSlideIdValue = makeId("s");
  const idMap = /* @__PURE__ */ new Map();
  const elements = snapshot.elements[slideId] ?? [];
  for (const element of elements) idMap.set(element.id, makeId("e"));
  const cloned = elements.map((element) => {
    const copy = JSON.parse(JSON.stringify(element));
    copy.id = idMap.get(element.id);
    if (copy.groupId) copy.groupId = idMap.get(copy.groupId) ?? copy.groupId;
    if (copy.type === "group") copy.childIds = copy.childIds.map((c) => idMap.get(c) ?? c);
    return copy;
  });
  return [
    {
      op: "slide.add",
      slide: {
        ...source,
        id: newSlideIdValue,
        name: source.name ? `${source.name} copy` : void 0
      },
      index: index + 1,
      elements: cloned
    }
  ];
}
function selectionClosure(elements, ids) {
  const byId = new Map(elements.map((e) => [e.id, e]));
  const out = /* @__PURE__ */ new Set();
  const visit = (id) => {
    const element = byId.get(id);
    if (!element || out.has(id)) return;
    out.add(id);
    if (element.type === "group") for (const child of element.childIds) visit(child);
  };
  for (const id of ids) {
    let element = byId.get(id);
    while (element?.groupId && byId.has(element.groupId)) element = byId.get(element.groupId);
    if (element) visit(element.id);
  }
  return elements.filter((e) => out.has(e.id)).map((e) => e.id);
}

// lib/slides/geometry.ts
function elementRect(element) {
  return { x: element.x, y: element.y, w: element.w, h: element.h };
}
function rectCenter(rect) {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}
function rotatedCorners(rect, rotationDeg) {
  const c = rectCenter(rect);
  const rad = rotationDeg * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const corners = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.w, y: rect.y },
    { x: rect.x + rect.w, y: rect.y + rect.h },
    { x: rect.x, y: rect.y + rect.h }
  ];
  return corners.map((p2) => {
    const dx = p2.x - c.x;
    const dy = p2.y - c.y;
    return { x: c.x + dx * cos - dy * sin, y: c.y + dx * sin + dy * cos };
  });
}
function elementBounds(element) {
  if (!element.rotation) return elementRect(element);
  return pointsBounds(rotatedCorners(elementRect(element), element.rotation));
}
function pointsBounds(points) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const p2 of points) {
    if (p2.x < minX) minX = p2.x;
    if (p2.y < minY) minY = p2.y;
    if (p2.x > maxX) maxX = p2.x;
    if (p2.y > maxY) maxY = p2.y;
  }
  if (!Number.isFinite(minX)) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
function unionRects(rects) {
  return pointsBounds(
    rects.flatMap((r) => [
      { x: r.x, y: r.y },
      { x: r.x + r.w, y: r.y + r.h }
    ])
  );
}
function rectsIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function rectContains(outer, inner) {
  return inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h;
}
function pointInRect(p2, r) {
  return p2.x >= r.x && p2.x <= r.x + r.w && p2.y >= r.y && p2.y <= r.y + r.h;
}
function alignElements(elements, mode, canvas) {
  if (elements.length === 0) return {};
  const bounds = elements.map((e) => ({ id: e.id, b: elementBounds(e), e }));
  const target = elements.length === 1 ? canvas : unionRects(bounds.map((x) => x.b));
  const out = {};
  for (const { id, b, e } of bounds) {
    const dx = e.x - b.x;
    const dy = e.y - b.y;
    switch (mode) {
      case "left":
        out[id] = { x: target.x + dx };
        break;
      case "centerX":
        out[id] = { x: target.x + (target.w - b.w) / 2 + dx };
        break;
      case "right":
        out[id] = { x: target.x + target.w - b.w + dx };
        break;
      case "top":
        out[id] = { y: target.y + dy };
        break;
      case "centerY":
        out[id] = { y: target.y + (target.h - b.h) / 2 + dy };
        break;
      case "bottom":
        out[id] = { y: target.y + target.h - b.h + dy };
        break;
    }
  }
  return out;
}
function distributeElements(elements, mode) {
  if (elements.length < 3) return {};
  const items = elements.map((e) => ({ e, b: elementBounds(e) })).sort((a, b) => mode === "horizontal" ? a.b.x - b.b.x : a.b.y - b.b.y);
  const first = items[0].b;
  const last = items[items.length - 1].b;
  const span = mode === "horizontal" ? last.x + last.w - first.x : last.y + last.h - first.y;
  const total = items.reduce((sum, { b }) => sum + (mode === "horizontal" ? b.w : b.h), 0);
  const gap = (span - total) / (items.length - 1);
  const out = {};
  let cursor = mode === "horizontal" ? first.x : first.y;
  for (const { e, b } of items) {
    if (mode === "horizontal") {
      out[e.id] = { x: cursor + (e.x - b.x) };
      cursor += b.w + gap;
    } else {
      out[e.id] = { y: cursor + (e.y - b.y) };
      cursor += b.h + gap;
    }
  }
  return out;
}
function snapRect(moving, others, canvas, threshold = 8) {
  const xCandidates = [
    { at: canvas.x, from: canvas.y, to: canvas.y + canvas.h },
    { at: canvas.x + canvas.w / 2, from: canvas.y, to: canvas.y + canvas.h },
    { at: canvas.x + canvas.w, from: canvas.y, to: canvas.y + canvas.h }
  ];
  const yCandidates = [
    { at: canvas.y, from: canvas.x, to: canvas.x + canvas.w },
    { at: canvas.y + canvas.h / 2, from: canvas.x, to: canvas.x + canvas.w },
    { at: canvas.y + canvas.h, from: canvas.x, to: canvas.x + canvas.w }
  ];
  for (const o of others) {
    for (const at of [o.x, o.x + o.w / 2, o.x + o.w])
      xCandidates.push({ at, from: o.y, to: o.y + o.h });
    for (const at of [o.y, o.y + o.h / 2, o.y + o.h])
      yCandidates.push({ at, from: o.x, to: o.x + o.w });
  }
  const movingX = [moving.x, moving.x + moving.w / 2, moving.x + moving.w];
  const movingY = [moving.y, moving.y + moving.h / 2, moving.y + moving.h];
  let bestX = null;
  for (const mx of movingX) {
    for (const c of xCandidates) {
      const delta = c.at - mx;
      if (Math.abs(delta) <= threshold && (!bestX || Math.abs(delta) < Math.abs(bestX.delta))) {
        bestX = {
          delta,
          guide: {
            axis: "x",
            at: c.at,
            from: Math.min(c.from, moving.y),
            to: Math.max(c.to, moving.y + moving.h)
          }
        };
      }
    }
  }
  let bestY = null;
  for (const my of movingY) {
    for (const c of yCandidates) {
      const delta = c.at - my;
      if (Math.abs(delta) <= threshold && (!bestY || Math.abs(delta) < Math.abs(bestY.delta))) {
        bestY = {
          delta,
          guide: {
            axis: "y",
            at: c.at,
            from: Math.min(c.from, moving.x),
            to: Math.max(c.to, moving.x + moving.w)
          }
        };
      }
    }
  }
  const guides = [];
  if (bestX) guides.push(bestX.guide);
  if (bestY) guides.push(bestY.guide);
  return { dx: bestX?.delta ?? 0, dy: bestY?.delta ?? 0, guides };
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function round(value, step = 1) {
  return Math.round(value / step) * step;
}

// lib/slides/ops.ts
function cloneSnapshot(snapshot) {
  return {
    meta: { ...snapshot.meta, theme: { ...snapshot.meta.theme } },
    slides: snapshot.slides.map((s) => ({ ...s })),
    elements: Object.fromEntries(
      Object.entries(snapshot.elements).map(([k, v]) => [k, v.map((e) => ({ ...e }))])
    )
  };
}
function requireSlide(snapshot, slideId) {
  const slide = snapshot.slides.find((s) => s.id === slideId);
  if (!slide) throw new SlideModelError(`slide ${slideId} not found`);
  return slide;
}
function requireElements(snapshot, slideId) {
  requireSlide(snapshot, slideId);
  if (!snapshot.elements[slideId]) snapshot.elements[slideId] = [];
  return snapshot.elements[slideId];
}
function requireElement(elements, elementId) {
  const index = elements.findIndex((e) => e.id === elementId);
  if (index < 0) throw new SlideModelError(`element ${elementId} not found`);
  return index;
}
function removeClosure(elements, elementId) {
  const drop = /* @__PURE__ */ new Set();
  const visit = (id) => {
    const element = elements.find((e) => e.id === id);
    if (!element || drop.has(id)) return;
    drop.add(id);
    if (element.type === "group") for (const child of element.childIds) visit(child);
  };
  visit(elementId);
  const remaining = elements.filter((e) => !drop.has(e.id));
  return remaining.flatMap((e) => {
    if (e.type !== "group") return [e];
    const childIds = e.childIds.filter((c) => !drop.has(c));
    if (childIds.length === 0) return [];
    return [{ ...e, childIds }];
  });
}
function applyDeckOpToSnapshot(snapshot, op) {
  const next = cloneSnapshot(snapshot);
  switch (op.op) {
    case "deck.update": {
      const meta = { ...next.meta, ...op.meta, schemaVersion: next.meta.schemaVersion };
      next.meta = validateDeckMeta(meta);
      return next;
    }
    case "slide.add": {
      const slide = validateSlide(op.slide);
      if (next.slides.some((s) => s.id === slide.id))
        throw new SlideModelError(`slide ${slide.id} already exists`);
      if (next.slides.length >= SLIDE_MAX_SLIDES)
        throw new SlideModelError(`deck already has ${SLIDE_MAX_SLIDES} slides`);
      const elements = (op.elements ?? []).map((e, i) => validateElement(e, `elements[${i}]`));
      if (elements.length > SLIDE_MAX_ELEMENTS_PER_SLIDE)
        throw new SlideModelError(`slide exceeds ${SLIDE_MAX_ELEMENTS_PER_SLIDE} elements`);
      const ids = /* @__PURE__ */ new Set();
      for (const e of elements) {
        if (ids.has(e.id)) throw new SlideModelError(`duplicate element id ${e.id}`);
        ids.add(e.id);
      }
      const index = op.index === void 0 ? next.slides.length : Math.max(0, Math.min(next.slides.length, op.index));
      next.slides.splice(index, 0, slide);
      next.elements[slide.id] = elements;
      return next;
    }
    case "slide.remove": {
      const index = next.slides.findIndex((s) => s.id === op.slideId);
      if (index < 0) throw new SlideModelError(`slide ${op.slideId} not found`);
      if (next.slides.length === 1) throw new SlideModelError("a deck keeps at least one slide");
      next.slides.splice(index, 1);
      delete next.elements[op.slideId];
      return next;
    }
    case "slide.move": {
      const index = next.slides.findIndex((s) => s.id === op.slideId);
      if (index < 0) throw new SlideModelError(`slide ${op.slideId} not found`);
      const [slide] = next.slides.splice(index, 1);
      const to = Math.max(0, Math.min(next.slides.length, Math.floor(op.index)));
      next.slides.splice(to, 0, slide);
      return next;
    }
    case "slide.update": {
      const index = next.slides.findIndex((s) => s.id === op.slideId);
      if (index < 0) throw new SlideModelError(`slide ${op.slideId} not found`);
      const merged = { ...next.slides[index] };
      for (const [key, value] of Object.entries(op.patch)) {
        if (key === "id") continue;
        if (value === void 0 || value === null) delete merged[key];
        else merged[key] = value;
      }
      next.slides[index] = validateSlide(merged);
      return next;
    }
    case "element.add": {
      const elements = requireElements(next, op.slideId);
      const element = validateElement(op.element);
      if (elements.some((e) => e.id === element.id))
        throw new SlideModelError(`element ${element.id} already exists`);
      if (elements.length >= SLIDE_MAX_ELEMENTS_PER_SLIDE)
        throw new SlideModelError(`slide already has ${SLIDE_MAX_ELEMENTS_PER_SLIDE} elements`);
      if (element.type === "group") throw new SlideModelError("use element.group to create groups");
      if (element.groupId) throw new SlideModelError("new elements cannot start inside a group");
      const index = op.index === void 0 ? elements.length : Math.max(0, Math.min(elements.length, op.index));
      elements.splice(index, 0, element);
      return next;
    }
    case "element.update": {
      const elements = requireElements(next, op.slideId);
      const index = requireElement(elements, op.elementId);
      const patch = { ...op.patch };
      delete patch.groupId;
      delete patch.childIds;
      elements[index] = patchElement(elements[index], patch);
      return next;
    }
    case "element.remove": {
      const elements = requireElements(next, op.slideId);
      requireElement(elements, op.elementId);
      next.elements[op.slideId] = removeClosure(elements, op.elementId);
      return next;
    }
    case "element.reorder": {
      const elements = requireElements(next, op.slideId);
      const index = requireElement(elements, op.elementId);
      const element = elements[index];
      const unit = element.type === "group" ? closureIds(elements, element) : [element.id];
      const unitSet = new Set(unit);
      const moving = elements.filter((e) => unitSet.has(e.id));
      const rest = elements.filter((e) => !unitSet.has(e.id));
      const currentTop = elements.findIndex((e) => e.id === element.id);
      const restIndexOf = (id) => rest.findIndex((e) => e.id === id);
      let target;
      if (typeof op.to === "number") target = resolveZIndex(0, rest.length + 1, op.to);
      else if (op.to === "front") target = rest.length;
      else if (op.to === "back") target = 0;
      else if (op.to === "forward") {
        const above = elements.slice(currentTop + 1).find((e) => !unitSet.has(e.id));
        target = above ? restIndexOf(above.id) + 1 : rest.length;
      } else {
        const below = [...elements.slice(0, index)].reverse().find((e) => !unitSet.has(e.id));
        target = below ? restIndexOf(below.id) : 0;
      }
      rest.splice(target, 0, ...moving);
      next.elements[op.slideId] = rest;
      return next;
    }
    case "element.group": {
      const elements = requireElements(next, op.slideId);
      if (!isValidSlideId(op.groupId)) throw new SlideModelError("group id is invalid");
      if (elements.some((e) => e.id === op.groupId))
        throw new SlideModelError(`element ${op.groupId} already exists`);
      const ids = [...new Set(op.elementIds)];
      if (ids.length < 2) throw new SlideModelError("a group needs at least two elements");
      const members = ids.map((id) => elements[requireElement(elements, id)]);
      for (const member of members) {
        if (member.groupId) throw new SlideModelError(`element ${member.id} is already grouped`);
      }
      const memberSet = new Set(ids);
      const closure = new Set(
        members.flatMap((m) => m.type === "group" ? closureIds(elements, m) : [m.id])
      );
      const frame = unionRects(members.map((m) => ({ x: m.x, y: m.y, w: m.w, h: m.h })));
      const group = {
        id: op.groupId,
        type: "group",
        x: frame.x,
        y: frame.y,
        w: Math.max(1, frame.w),
        h: Math.max(1, frame.h),
        rotation: 0,
        opacity: 1,
        childIds: ids
      };
      const topIndex = Math.max(...ids.map((id) => elements.findIndex((e) => e.id === id)));
      const before = elements.slice(0, topIndex + 1).filter((e) => !closure.has(e.id));
      const after = elements.slice(topIndex + 1).filter((e) => !closure.has(e.id));
      const grouped = elements.filter((e) => closure.has(e.id)).map((e) => memberSet.has(e.id) ? { ...e, groupId: op.groupId } : e);
      next.elements[op.slideId] = [...before, ...grouped, group, ...after];
      return next;
    }
    case "element.ungroup": {
      const elements = requireElements(next, op.slideId);
      const index = requireElement(elements, op.groupId);
      const group = elements[index];
      if (group.type !== "group") throw new SlideModelError(`element ${op.groupId} is not a group`);
      const childSet = new Set(group.childIds);
      next.elements[op.slideId] = elements.filter((e) => e.id !== group.id).map((e) => {
        if (!childSet.has(e.id)) return e;
        const { groupId: _dropped, ...rest } = e;
        return group.groupId ? { ...rest, groupId: group.groupId } : rest;
      });
      if (group.groupId) {
        const parentIndex = next.elements[op.slideId].findIndex((e) => e.id === group.groupId);
        const parent = next.elements[op.slideId][parentIndex];
        if (parent?.type === "group") {
          next.elements[op.slideId][parentIndex] = {
            ...parent,
            childIds: parent.childIds.flatMap((c) => c === group.id ? group.childIds : [c])
          };
        }
      }
      return next;
    }
    default:
      throw new SlideModelError(`unknown op ${op.op ?? "?"}`);
  }
}
function closureIds(elements, group) {
  const out = [];
  const visit = (id) => {
    const element = elements.find((e) => e.id === id);
    if (!element) return;
    if (element.type === "group") for (const child of element.childIds) visit(child);
    out.push(id);
  };
  visit(group.id);
  return out;
}
function applyDeckOpsToSnapshot(snapshot, ops) {
  let current = snapshot;
  for (const [index, op] of ops.entries()) {
    try {
      current = applyDeckOpToSnapshot(current, op);
    } catch (error) {
      if (error instanceof SlideModelError)
        throw new SlideModelError(`ops[${index}] (${op.op}): ${error.message}`, error.path);
      throw error;
    }
  }
  return current;
}

// lib/slides/rich-text.ts
var COLOR = /^(?:#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|(?:rgba?|hsla?)\([^()]{1,60}\)|[a-zA-Z]{3,20})$/;
var SAFE_HREF = /^(?:https?:\/\/|mailto:)[^\s"'<>]{1,2000}$/i;
var FONT_FAMILY = /^[A-Za-z0-9 ,'"_-]{1,120}$/;
var ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\xA0"
};
function decodeEntities(value) {
  return value.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, body) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? Number.parseInt(body.slice(2), 16) : Number(body.slice(1));
      return Number.isFinite(code) && code > 0 && code < 1114112 ? String.fromCodePoint(code) : match;
    }
    return ENTITIES[body] ?? match;
  });
}
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function parseStyle(raw) {
  const out = {};
  for (const decl of decodeEntities(raw).split(";")) {
    const idx = decl.indexOf(":");
    if (idx < 0) continue;
    const key = decl.slice(0, idx).trim().toLowerCase();
    const value = decl.slice(idx + 1).trim();
    if (key && value) out[key] = value;
  }
  return out;
}
function parseAttrs(raw) {
  const out = {};
  const re = /([a-zA-Z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let m;
  while (m = re.exec(raw)) out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
  return out;
}
function parseRichText(html) {
  const blocks = [];
  let current = null;
  let listType = null;
  const markStack = [{}];
  const marks = () => markStack[markStack.length - 1];
  const ensureBlock = () => {
    if (!current) {
      current = { type: listType ?? "paragraph", runs: [] };
      blocks.push(current);
    }
    return current;
  };
  const pushText = (text2) => {
    if (!text2) return;
    const block = ensureBlock();
    const m2 = marks();
    const last = block.runs[block.runs.length - 1];
    if (last && sameMarks(last, m2)) last.text += text2;
    else block.runs.push({ text: text2, ...m2 });
  };
  const tokenRe = /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>|([^<]+)/g;
  let m;
  while (m = tokenRe.exec(html)) {
    if (m[0].startsWith("<!--")) continue;
    if (m[3] !== void 0) {
      pushText(decodeEntities(m[3]).replace(/[\r\n\t]+/g, " "));
      continue;
    }
    const closing = m[0][1] === "/";
    const tag = (m[1] ?? "").toLowerCase();
    const attrs = closing ? {} : parseAttrs(m[2] ?? "");
    switch (tag) {
      case "p":
      case "div":
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
        if (closing) {
          if (!listType) current = null;
        } else {
          if (!(current && current.type !== "paragraph" && current.runs.length === 0)) {
            current = { type: listType ?? "paragraph", runs: [] };
            blocks.push(current);
          }
          const style = parseStyle(attrs.style ?? "");
          const align = style["text-align"];
          if (align === "left" || align === "center" || align === "right" || align === "justify")
            current.align = align;
        }
        break;
      case "ul":
        listType = closing ? null : "bullet";
        current = null;
        break;
      case "ol":
        listType = closing ? null : "numbered";
        current = null;
        break;
      case "li":
        if (closing) current = null;
        else {
          current = { type: listType ?? "bullet", runs: [] };
          blocks.push(current);
        }
        break;
      case "br":
        if (!closing) pushText("\n");
        break;
      case "strong":
      case "b":
      case "em":
      case "i":
      case "u":
      case "s":
      case "strike":
      case "span":
      case "a":
      case "mark":
      case "code":
      case "font": {
        if (closing) {
          if (markStack.length > 1) markStack.pop();
          break;
        }
        const next = { ...marks() };
        if (tag === "strong" || tag === "b") next.bold = true;
        if (tag === "em" || tag === "i") next.italic = true;
        if (tag === "u") next.underline = true;
        if (tag === "s" || tag === "strike") next.strike = true;
        if (tag === "a" && attrs.href && SAFE_HREF.test(decodeEntities(attrs.href)))
          next.href = decodeEntities(attrs.href);
        const style = parseStyle(attrs.style ?? "");
        if (style.color && COLOR.test(style.color)) next.color = style.color;
        if (style["font-size"]) {
          const size = Number.parseFloat(style["font-size"]);
          if (Number.isFinite(size) && size >= 4 && size <= 600) next.fontSize = size;
        }
        if (style["font-family"] && FONT_FAMILY.test(style["font-family"]))
          next.fontFamily = style["font-family"].replace(/["]/g, "'");
        if (style["font-weight"] && /^(bold|[6-9]00)$/.test(style["font-weight"])) next.bold = true;
        if (style["font-style"] === "italic") next.italic = true;
        if (style["text-decoration"]?.includes("underline")) next.underline = true;
        if (style["text-decoration"]?.includes("line-through")) next.strike = true;
        markStack.push(next);
        break;
      }
      default:
        break;
    }
  }
  if (blocks.length === 0) blocks.push({ type: "paragraph", runs: [] });
  return { blocks };
}
function sameMarks(a, b) {
  return !!a.bold === !!b.bold && !!a.italic === !!b.italic && !!a.underline === !!b.underline && !!a.strike === !!b.strike && a.color === b.color && a.fontSize === b.fontSize && a.fontFamily === b.fontFamily && a.href === b.href;
}
function runToHtml(run) {
  let text2 = escapeHtml(run.text).replace(/\n/g, "<br>");
  const style = [];
  if (run.color) style.push(`color:${run.color}`);
  if (run.fontSize) style.push(`font-size:${run.fontSize}px`);
  if (run.fontFamily) style.push(`font-family:${run.fontFamily.replace(/"/g, "'")}`);
  if (style.length) text2 = `<span style="${escapeHtml(style.join(";"))}">${text2}</span>`;
  if (run.bold) text2 = `<strong>${text2}</strong>`;
  if (run.italic) text2 = `<em>${text2}</em>`;
  if (run.underline) text2 = `<u>${text2}</u>`;
  if (run.strike) text2 = `<s>${text2}</s>`;
  if (run.href && SAFE_HREF.test(run.href))
    text2 = `<a href="${escapeHtml(run.href)}" target="_blank" rel="noopener noreferrer">${text2}</a>`;
  return text2;
}
function richTextToHtml(doc) {
  const out = [];
  let openList = null;
  const closeList = () => {
    if (openList) out.push(openList === "bullet" ? "</ul>" : "</ol>");
    openList = null;
  };
  for (const block of doc.blocks) {
    const inner = block.runs.map(runToHtml).join("");
    const align = block.align && block.align !== "left" ? ` style="text-align:${block.align}"` : "";
    if (block.type === "paragraph") {
      closeList();
      out.push(`<p${align}>${inner}</p>`);
      continue;
    }
    if (openList !== block.type) {
      closeList();
      out.push(block.type === "bullet" ? "<ul>" : "<ol>");
      openList = block.type;
    }
    out.push(`<li${align}><p>${inner}</p></li>`);
  }
  closeList();
  return out.join("");
}
function richTextToPlain(doc) {
  return doc.blocks.map((b) => b.runs.map((r) => r.text).join("")).join("\n");
}
function sanitizeRichHtml(html) {
  return richTextToHtml(parseRichText(html));
}
function plainTextToRichHtml(text2) {
  return richTextToHtml({
    blocks: text2.split(/\r?\n/).map((line) => ({ type: "paragraph", runs: line ? [{ text: line }] : [] }))
  });
}
function richTextIsEmpty(doc) {
  return doc.blocks.every((b) => b.runs.every((r) => !r.text.trim()));
}

// lib/slides/chart-svg.ts
var CHART_SERIES_PALETTE_KEYS = ["accent", "accent2", "accent3", "muted", "text"];
function chartSeriesColor(index, theme, explicit) {
  if (explicit) return explicit;
  const keys = CHART_SERIES_PALETTE_KEYS;
  const key = keys[index % keys.length];
  const base2 = theme.colors[key];
  const cycle = Math.floor(index / keys.length);
  return cycle === 0 ? base2 : mix(base2, theme.colors.background, Math.min(0.6, cycle * 0.25));
}
function hexToRgb(hex) {
  const m = /^#([0-9a-f]{3,8})$/i.exec(hex);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3 || h.length === 4)
    h = h.split("").map((c) => c + c).join("");
  return [
    Number.parseInt(h.slice(0, 2), 16),
    Number.parseInt(h.slice(2, 4), 16),
    Number.parseInt(h.slice(4, 6), 16)
  ];
}
function mix(a, b, t) {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return a;
  const c = ra.map((v, i) => Math.round(v + (rb[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
function niceTicks(min, max, count = 5) {
  if (max === min) return [min];
  const span = max - min;
  const rough = span / count;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const candidates = [1, 2, 2.5, 5, 10].map((m) => m * pow);
  const step = candidates.find((c) => c >= rough) ?? candidates[candidates.length - 1];
  const start = Math.floor(min / step) * step;
  const ticks = [];
  for (let v = start; v <= max + step * 0.5; v += step) ticks.push(Number(v.toFixed(10)));
  return ticks;
}
function formatValue(value) {
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (Math.abs(value) >= 1e4) return `${(value / 1e3).toFixed(1).replace(/\.0$/, "")}k`;
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
function legend(el, theme, L, y) {
  if (!el.showLegend || el.series.length === 0) return "";
  const items = el.series.map((s, i) => ({
    name: s.name,
    color: chartSeriesColor(i, theme, s.color)
  }));
  const gap = L.fontSize * 0.9;
  const box = L.fontSize * 0.8;
  let x = L.left;
  const parts = [];
  for (const item of items) {
    const width = box + gap * 0.5 + item.name.length * L.fontSize * 0.58;
    if (x + width > L.w - L.right && x > L.left) break;
    parts.push(
      `<rect x="${x}" y="${y - box}" width="${box}" height="${box}" rx="${box * 0.2}" fill="${item.color}"/><text x="${x + box + gap * 0.5}" y="${y - box * 0.12}" font-size="${L.fontSize}" fill="${L.color}">${escapeHtml(item.name)}</text>`
    );
    x += width + gap * 1.5;
  }
  return parts.join("");
}
function pieChart(el, theme, L) {
  const values = el.series[0]?.values ?? [];
  const total = values.reduce((s, v) => s + Math.max(0, v), 0);
  const cx = (L.left + (L.w - L.right)) / 2;
  const cy = (L.top + (L.h - L.bottom)) / 2;
  const r = Math.max(10, Math.min(L.w - L.left - L.right, L.h - L.top - L.bottom) / 2 - L.fontSize);
  const inner = el.chartType === "donut" ? r * 0.58 : 0;
  if (total <= 0) return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${L.grid}"/>`;
  let angle = -Math.PI / 2;
  const parts = [];
  values.forEach((raw, i) => {
    const v = Math.max(0, raw);
    if (v === 0) return;
    const sweep = v / total * Math.PI * 2;
    const a0 = angle;
    const a1 = angle + sweep;
    angle = a1;
    const large = sweep > Math.PI ? 1 : 0;
    const p2 = (a, rad) => `${(cx + Math.cos(a) * rad).toFixed(2)} ${(cy + Math.sin(a) * rad).toFixed(2)}`;
    const d = inner > 0 ? `M ${p2(a0, r)} A ${r} ${r} 0 ${large} 1 ${p2(a1, r)} L ${p2(a1, inner)} A ${inner} ${inner} 0 ${large} 0 ${p2(a0, inner)} Z` : `M ${cx} ${cy} L ${p2(a0, r)} A ${r} ${r} 0 ${large} 1 ${p2(a1, r)} Z`;
    const color = chartSeriesColor(
      i,
      theme,
      el.series[0]?.color && values.length === 1 ? el.series[0].color : void 0
    );
    parts.push(
      `<path d="${d}" fill="${color}" stroke="${theme.colors.background}" stroke-width="2"/>`
    );
    if (el.showValues) {
      const mid = (a0 + a1) / 2;
      const lr = inner > 0 ? (r + inner) / 2 : r * 0.65;
      parts.push(
        `<text x="${(cx + Math.cos(mid) * lr).toFixed(2)}" y="${(cy + Math.sin(mid) * lr).toFixed(2)}" text-anchor="middle" dominant-baseline="middle" font-size="${L.fontSize}" fill="${theme.colors.background}" font-weight="600">${Math.round(v / total * 100)}%</text>`
      );
    }
  });
  if (el.showLegend) {
    const box = L.fontSize * 0.8;
    let y = L.top + box;
    const x = L.w - L.right - L.fontSize * 9;
    el.categories.slice(0, 12).forEach((cat, i) => {
      parts.push(
        `<rect x="${x}" y="${y - box}" width="${box}" height="${box}" rx="${box * 0.2}" fill="${chartSeriesColor(i, theme)}"/><text x="${x + box * 1.4}" y="${y - box * 0.12}" font-size="${L.fontSize}" fill="${L.color}">${escapeHtml(cat)}</text>`
      );
      y += L.fontSize * 1.6;
    });
  }
  return parts.join("");
}
function cartesianChart(el, theme, L) {
  const n = Math.max(el.categories.length, ...el.series.map((s) => s.values.length));
  const horizontal = el.chartType === "bar";
  const stacked = !!el.stacked && (el.chartType === "bar" || el.chartType === "column" || el.chartType === "area");
  const plotX = L.left;
  const plotY = L.top;
  const plotW = Math.max(10, L.w - L.left - L.right);
  const plotH = Math.max(10, L.h - L.top - L.bottom);
  let min = 0;
  let max = 0;
  if (stacked) {
    for (let i = 0; i < n; i++) {
      let pos = 0;
      let neg = 0;
      for (const s of el.series) {
        const v = s.values[i] ?? 0;
        if (v >= 0) pos += v;
        else neg += v;
      }
      max = Math.max(max, pos);
      min = Math.min(min, neg);
    }
  } else {
    for (const s of el.series)
      for (const v of s.values) {
        max = Math.max(max, v);
        min = Math.min(min, v);
      }
  }
  if (el.chartType === "scatter") {
  }
  const ticks = niceTicks(min, max, 5);
  const lo = Math.min(min, ticks[0]);
  const hi = Math.max(max, ticks[ticks.length - 1], lo + 1);
  const scale = (v) => horizontal ? plotX + (v - lo) / (hi - lo) * plotW : plotY + plotH - (v - lo) / (hi - lo) * plotH;
  const band = (horizontal ? plotH : plotW) / Math.max(1, n);
  const parts = [];
  for (const t of ticks) {
    const pos = scale(t);
    if (horizontal) {
      if (el.showGrid !== false)
        parts.push(
          `<line x1="${pos}" y1="${plotY}" x2="${pos}" y2="${plotY + plotH}" stroke="${L.grid}" stroke-width="1"/>`
        );
      parts.push(
        `<text x="${pos}" y="${plotY + plotH + L.fontSize * 1.3}" text-anchor="middle" font-size="${L.fontSize * 0.85}" fill="${theme.colors.muted}">${formatValue(t)}</text>`
      );
    } else {
      if (el.showGrid !== false)
        parts.push(
          `<line x1="${plotX}" y1="${pos}" x2="${plotX + plotW}" y2="${pos}" stroke="${L.grid}" stroke-width="1"/>`
        );
      parts.push(
        `<text x="${plotX - L.fontSize * 0.5}" y="${pos + L.fontSize * 0.35}" text-anchor="end" font-size="${L.fontSize * 0.85}" fill="${theme.colors.muted}">${formatValue(t)}</text>`
      );
    }
  }
  for (let i = 0; i < n; i++) {
    const label = el.categories[i] ?? "";
    if (!label) continue;
    if (horizontal) {
      parts.push(
        `<text x="${plotX - L.fontSize * 0.5}" y="${plotY + band * (i + 0.5) + L.fontSize * 0.35}" text-anchor="end" font-size="${L.fontSize}" fill="${L.color}">${escapeHtml(label)}</text>`
      );
    } else {
      parts.push(
        `<text x="${plotX + band * (i + 0.5)}" y="${plotY + plotH + L.fontSize * 1.3}" text-anchor="middle" font-size="${L.fontSize}" fill="${L.color}">${escapeHtml(label)}</text>`
      );
    }
  }
  const zero = scale(0);
  parts.push(
    horizontal ? `<line x1="${zero}" y1="${plotY}" x2="${zero}" y2="${plotY + plotH}" stroke="${theme.colors.muted}" stroke-width="1.5"/>` : `<line x1="${plotX}" y1="${zero}" x2="${plotX + plotW}" y2="${zero}" stroke="${theme.colors.muted}" stroke-width="1.5"/>`
  );
  if (el.chartType === "bar" || el.chartType === "column") {
    const groups = stacked ? 1 : el.series.length;
    const inner = band * 0.72;
    const barSize = inner / groups;
    const offsets2 = new Array(n).fill(0);
    const negOffsets = new Array(n).fill(0);
    el.series.forEach((s, si) => {
      const color = chartSeriesColor(si, theme, s.color);
      for (let i = 0; i < n; i++) {
        const v = s.values[i] ?? 0;
        let from = 0;
        if (stacked) {
          if (v >= 0) {
            from = offsets2[i];
            offsets2[i] += v;
          } else {
            from = negOffsets[i];
            negOffsets[i] += v;
          }
        }
        const a = scale(from);
        const b = scale(from + v);
        const start = band * i + (band - inner) / 2 + (stacked ? 0 : si * barSize);
        if (horizontal) {
          const x = Math.min(a, b);
          const w = Math.abs(b - a);
          parts.push(
            `<rect x="${x.toFixed(2)}" y="${(plotY + start).toFixed(2)}" width="${w.toFixed(2)}" height="${barSize.toFixed(2)}" rx="${Math.min(4, barSize / 4)}" fill="${color}"/>`
          );
          if (el.showValues && v !== 0)
            parts.push(
              `<text x="${(x + w + L.fontSize * 0.4).toFixed(2)}" y="${(plotY + start + barSize / 2 + L.fontSize * 0.35).toFixed(2)}" font-size="${L.fontSize * 0.85}" fill="${L.color}">${formatValue(v)}</text>`
            );
        } else {
          const y = Math.min(a, b);
          const h = Math.abs(b - a);
          parts.push(
            `<rect x="${(plotX + start).toFixed(2)}" y="${y.toFixed(2)}" width="${barSize.toFixed(2)}" height="${h.toFixed(2)}" rx="${Math.min(4, barSize / 4)}" fill="${color}"/>`
          );
          if (el.showValues && v !== 0)
            parts.push(
              `<text x="${(plotX + start + barSize / 2).toFixed(2)}" y="${(y - L.fontSize * 0.4).toFixed(2)}" text-anchor="middle" font-size="${L.fontSize * 0.85}" fill="${L.color}">${formatValue(v)}</text>`
            );
        }
      }
    });
    return parts.join("");
  }
  const offsets = new Array(n).fill(0);
  const seriesPaths = [];
  const overlays = [];
  el.series.forEach((s, si) => {
    const color = chartSeriesColor(si, theme, s.color);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const raw = s.values[i];
      if (raw === void 0) continue;
      const v = stacked ? offsets[i] + raw : raw;
      if (stacked) offsets[i] = v;
      pts.push([plotX + band * (i + 0.5), scale(v)]);
    }
    if (pts.length === 0) return;
    const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
    if (el.chartType === "area") {
      const base2 = scale(0);
      seriesPaths.push(
        `<path d="${d} L ${pts[pts.length - 1][0].toFixed(2)} ${base2} L ${pts[0][0].toFixed(2)} ${base2} Z" fill="${color}" fill-opacity="0.18"/>`
      );
    }
    if (el.chartType !== "scatter")
      seriesPaths.push(
        `<path d="${d}" fill="none" stroke="${color}" stroke-width="${Math.max(2, L.fontSize * 0.18)}" stroke-linejoin="round" stroke-linecap="round"/>`
      );
    for (const [x, y] of pts) {
      overlays.push(
        `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${Math.max(3, L.fontSize * 0.28)}" fill="${el.chartType === "scatter" ? color : theme.colors.background}" stroke="${color}" stroke-width="${Math.max(2, L.fontSize * 0.14)}"/>`
      );
    }
    if (el.showValues)
      pts.forEach(([x, y], i) => {
        const v = s.values[i];
        if (v === void 0) return;
        overlays.push(
          `<text x="${x.toFixed(2)}" y="${(y - L.fontSize * 0.7).toFixed(2)}" text-anchor="middle" font-size="${L.fontSize * 0.85}" fill="${L.color}">${formatValue(v)}</text>`
        );
      });
  });
  return parts.join("") + seriesPaths.join("") + overlays.join("");
}
function renderChartSvg(el, theme) {
  const w = Math.max(40, el.w);
  const h = Math.max(40, el.h);
  const fontSize = el.fontSize ?? Math.max(12, Math.min(28, Math.round(Math.min(w, h) / 20)));
  const color = el.color ?? theme.colors.text;
  const L = {
    w,
    h,
    fontSize,
    color,
    grid: mix(theme.colors.muted, theme.colors.background, 0.7),
    font: theme.fonts.body,
    top: fontSize * (el.title ? 2.6 : 1) + (el.showLegend && el.chartType !== "pie" && el.chartType !== "donut" ? fontSize * 1.8 : 0),
    left: el.chartType === "bar" ? fontSize * 6 : fontSize * 3.2,
    right: fontSize,
    bottom: fontSize * 2.4
  };
  const parts = [];
  if (el.title)
    parts.push(
      `<text x="${L.left}" y="${fontSize * 1.5}" font-size="${fontSize * 1.25}" font-weight="600" fill="${color}">${escapeHtml(el.title)}</text>`
    );
  const isPie = el.chartType === "pie" || el.chartType === "donut";
  if (!isPie) parts.push(legend(el, theme, L, L.top - fontSize * 0.6));
  parts.push(isPie ? pieChart(el, theme, L) : cartesianChart(el, theme, L));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="none" font-family="${escapeHtml(theme.fonts.body)}" style="display:block">${parts.join("")}</svg>`;
}

// lib/slides/render.ts
var SLIDE_ELEMENT_ATTR = "data-slide-element";
var num = (v) => Number.isFinite(v) ? String(Math.round(v * 100) / 100) : "0";
function fillToCss(fill, fallback = "transparent") {
  if (!fill) return fallback;
  switch (fill.type) {
    case "none":
      return "transparent";
    case "solid":
      return fill.color;
    case "gradient":
      return `linear-gradient(${num(fill.angle)}deg, ${fill.stops.map((s) => `${s.color} ${num(s.offset * 100)}%`).join(", ")})`;
    case "image":
      return `${fill.fit === "contain" ? "center / contain no-repeat" : "center / cover no-repeat"} url("${escapeHtml(fill.src)}")`;
  }
}
function shadowToCss(shadow) {
  if (!shadow) return "none";
  return `${num(shadow.x)}px ${num(shadow.y)}px ${num(shadow.blur)}px ${shadow.color}`;
}
function strokeDash(stroke) {
  if (!stroke || stroke.dash === "solid" || !stroke.dash) return "";
  return stroke.dash === "dashed" ? `${stroke.width * 3} ${stroke.width * 2}` : `${stroke.width} ${stroke.width * 1.5}`;
}
function elementFrameStyle(element) {
  return [
    "position:absolute",
    `left:${num(element.x)}px`,
    `top:${num(element.y)}px`,
    `width:${num(element.w)}px`,
    `height:${num(element.h)}px`,
    `transform:rotate(${num(element.rotation)}deg)`,
    "transform-origin:center center",
    `opacity:${num(element.opacity)}`,
    element.hidden ? "display:none" : ""
  ].filter(Boolean).join(";");
}
function richHtml(html) {
  return richTextToHtml(parseRichText(html));
}
function textBoxStyle(el, theme) {
  const justify = el.valign === "middle" ? "center" : el.valign === "bottom" ? "flex-end" : "flex-start";
  return [
    "display:flex",
    "flex-direction:column",
    `justify-content:${justify}`,
    "width:100%",
    "height:100%",
    "box-sizing:border-box",
    "overflow:hidden",
    "word-wrap:break-word",
    `padding:${num(el.padding ?? 0)}px`,
    `font-size:${num(el.fontSize)}px`,
    `font-family:${(el.fontFamily || theme.fonts.body).replace(/"/g, "'")}`,
    `font-weight:${el.fontWeight ?? 400}`,
    `color:${el.color}`,
    `text-align:${el.align}`,
    `line-height:${num(el.lineHeight ?? 1.25)}`,
    `letter-spacing:${num(el.letterSpacing ?? 0)}px`
  ].join(";");
}
function renderText(el, theme) {
  const box = [
    `background:${fillToCss(el.fill)}`,
    el.stroke && el.stroke.width > 0 ? `border:${num(el.stroke.width)}px ${el.stroke.dash === "dashed" ? "dashed" : el.stroke.dash === "dotted" ? "dotted" : "solid"} ${el.stroke.color}` : "",
    el.radius ? `border-radius:${num(el.radius)}px` : "",
    el.shadow ? `box-shadow:${shadowToCss(el.shadow)}` : ""
  ].filter(Boolean).join(";");
  return `<div class="sl-text" style="${escapeHtml(`${textBoxStyle(el, theme)};${box}`)}"><div class="sl-rich">${richHtml(el.html)}</div></div>`;
}
function shapeUnitPolygon(kind) {
  switch (kind) {
    case "triangle":
      return [
        [0.5, 0],
        [1, 1],
        [0, 1]
      ];
    case "rightTriangle":
      return [
        [0, 0],
        [1, 1],
        [0, 1]
      ];
    case "diamond":
      return [
        [0.5, 0],
        [1, 0.5],
        [0.5, 1],
        [0, 0.5]
      ];
    case "pentagon":
      return [
        [0.5, 0],
        [1, 0.38],
        [0.81, 1],
        [0.19, 1],
        [0, 0.38]
      ];
    case "hexagon":
      return [
        [0.25, 0],
        [0.75, 0],
        [1, 0.5],
        [0.75, 1],
        [0.25, 1],
        [0, 0.5]
      ];
    case "star": {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 0.5 : 0.2;
        const a = -Math.PI / 2 + i * Math.PI / 5;
        pts.push([0.5 + Math.cos(a) * r, 0.5 + Math.sin(a) * r]);
      }
      return pts;
    }
    case "arrowRight":
      return [
        [0, 0.25],
        [0.65, 0.25],
        [0.65, 0],
        [1, 0.5],
        [0.65, 1],
        [0.65, 0.75],
        [0, 0.75]
      ];
    case "chevron":
      return [
        [0, 0],
        [0.75, 0],
        [1, 0.5],
        [0.75, 1],
        [0, 1],
        [0.25, 0.5]
      ];
    default:
      return null;
  }
}
function svgFillAttrs(id, fill, defs) {
  switch (fill.type) {
    case "none":
      return 'fill="none"';
    case "solid":
      return `fill="${escapeHtml(fill.color)}"`;
    case "gradient": {
      const rad = (fill.angle - 90) * Math.PI / 180;
      const x1 = 50 - Math.cos(rad) * 50;
      const y1 = 50 - Math.sin(rad) * 50;
      const x2 = 50 + Math.cos(rad) * 50;
      const y2 = 50 + Math.sin(rad) * 50;
      defs.push(
        `<linearGradient id="${id}-g" x1="${num(x1)}%" y1="${num(y1)}%" x2="${num(x2)}%" y2="${num(y2)}%">${fill.stops.map(
          (s) => `<stop offset="${num(s.offset * 100)}%" stop-color="${escapeHtml(s.color)}"/>`
        ).join("")}</linearGradient>`
      );
      return `fill="url(#${id}-g)"`;
    }
    case "image":
      defs.push(
        `<pattern id="${id}-p" patternUnits="userSpaceOnUse" width="100%" height="100%"><image href="${escapeHtml(fill.src)}" width="100%" height="100%" preserveAspectRatio="${fill.fit === "contain" ? "xMidYMid meet" : "xMidYMid slice"}"/></pattern>`
      );
      return `fill="url(#${id}-p)"`;
  }
}
function renderShape(el, theme) {
  const w = Math.max(1, el.w);
  const h = Math.max(1, el.h);
  const sw = el.stroke?.width ?? 0;
  const strokeAttrs = el.stroke && sw > 0 ? `stroke="${escapeHtml(el.stroke.color)}" stroke-width="${num(sw)}"${strokeDash(el.stroke) ? ` stroke-dasharray="${strokeDash(el.stroke)}"` : ""}` : 'stroke="none"';
  const defs = [];
  const gid = `sl-${el.id}`;
  const fillAttrs = svgFillAttrs(gid, el.fill, defs);
  const shadowStyle = el.shadow ? ` style="filter:drop-shadow(${shadowToCss(el.shadow)})"` : "";
  const inset = sw / 2;
  let body = "";
  switch (el.shape) {
    case "rect":
      body = `<rect x="${num(inset)}" y="${num(inset)}" width="${num(w - sw)}" height="${num(h - sw)}" ${fillAttrs} ${strokeAttrs}/>`;
      break;
    case "roundRect":
      body = `<rect x="${num(inset)}" y="${num(inset)}" width="${num(w - sw)}" height="${num(h - sw)}" rx="${num(el.radius ?? 24)}" ${fillAttrs} ${strokeAttrs}/>`;
      break;
    case "ellipse":
      body = `<ellipse cx="${num(w / 2)}" cy="${num(h / 2)}" rx="${num(w / 2 - inset)}" ry="${num(h / 2 - inset)}" ${fillAttrs} ${strokeAttrs}/>`;
      break;
    case "line":
    case "arrow": {
      const p2 = el.points ?? { x1: 0, y1: 0.5, x2: 1, y2: 0.5 };
      const stroke = el.stroke ?? { color: theme.colors.text, width: 4 };
      const markers = [];
      const size = Math.max(6, stroke.width * 3);
      const mk = (name, kind, end) => {
        if (!kind || kind === "none") return "";
        const mid = `${gid}-${name}`;
        if (kind === "arrow") {
          const d = end ? "M 0 0 L 10 5 L 0 10 z" : "M 10 0 L 0 5 L 10 10 z";
          markers.push(
            `<marker id="${mid}" viewBox="0 0 10 10" refX="${end ? 8 : 2}" refY="5" markerWidth="${num(size / stroke.width)}" markerHeight="${num(size / stroke.width)}" orient="auto" markerUnits="strokeWidth"><path d="${d}" fill="${escapeHtml(stroke.color)}"/></marker>`
          );
        } else {
          markers.push(
            `<marker id="${mid}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="${num(size * 0.7 / stroke.width)}" markerHeight="${num(size * 0.7 / stroke.width)}" markerUnits="strokeWidth"><circle cx="5" cy="5" r="4" fill="${escapeHtml(stroke.color)}"/></marker>`
          );
        }
        return ` marker-${name}="url(#${mid})"`;
      };
      const ms = mk("start", el.markerStart, false);
      const me = mk("end", el.markerEnd ?? (el.shape === "arrow" ? "arrow" : "none"), true);
      body = `${markers.join("")}<line x1="${num(p2.x1 * w)}" y1="${num(p2.y1 * h)}" x2="${num(p2.x2 * w)}" y2="${num(p2.y2 * h)}" stroke="${escapeHtml(stroke.color)}" stroke-width="${num(stroke.width)}" stroke-linecap="round"${strokeDash(stroke) ? ` stroke-dasharray="${strokeDash(stroke)}"` : ""}${ms}${me}/>`;
      break;
    }
    case "path":
      body = `<path d="${escapeHtml(el.path ?? "")}" transform="scale(${num(w)} ${num(h)})" vector-effect="non-scaling-stroke" ${fillAttrs} ${strokeAttrs} stroke-linejoin="round"/>`;
      break;
    default: {
      const poly = shapeUnitPolygon(el.shape) ?? [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1]
      ];
      const pts = poly.map(([x, y]) => `${num(inset + x * (w - sw))},${num(inset + y * (h - sw))}`).join(" ");
      body = `<polygon points="${pts}" ${fillAttrs} ${strokeAttrs} stroke-linejoin="round"/>`;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${num(w)} ${num(h)}" width="100%" height="100%" preserveAspectRatio="none"${shadowStyle} style="display:block;overflow:visible">${defs.length ? `<defs>${defs.join("")}</defs>` : ""}${body}</svg>`;
  if (!el.html) return svg;
  const text2 = renderText(
    {
      id: el.id,
      type: "text",
      x: 0,
      y: 0,
      w,
      h,
      rotation: 0,
      opacity: 1,
      html: el.html,
      fontSize: el.fontSize ?? 32,
      color: el.color ?? theme.colors.background,
      align: el.align ?? "center",
      valign: el.valign ?? "middle",
      padding: Math.min(w, h) * 0.08
    },
    theme
  );
  return `${svg}<div class="sl-shape-text" style="position:absolute;inset:0">${text2}</div>`;
}
function renderImage(el) {
  const radius = el.radius ? `border-radius:${num(el.radius)}px;` : "";
  const border = el.stroke && el.stroke.width > 0 ? `border:${num(el.stroke.width)}px solid ${el.stroke.color};` : "";
  const shadow = el.shadow ? `box-shadow:${shadowToCss(el.shadow)};` : "";
  const fit = el.fit === "fill" ? "fill" : el.fit;
  let img;
  if (el.crop) {
    const c = el.crop;
    const scaleX = 100 / c.w;
    const scaleY = 100 / c.h;
    img = `<img src="${escapeHtml(el.src)}" alt="${escapeHtml(el.alt ?? "")}" draggable="false" style="position:absolute;left:${num(-c.x * scaleX)}%;top:${num(-c.y * scaleY)}%;width:${num(scaleX)}%;height:${num(scaleY)}%;object-fit:fill;user-select:none">`;
  } else {
    img = `<img src="${escapeHtml(el.src)}" alt="${escapeHtml(el.alt ?? "")}" draggable="false" style="display:block;width:100%;height:100%;object-fit:${fit};user-select:none">`;
  }
  return `<div class="sl-image" style="position:relative;width:100%;height:100%;overflow:hidden;box-sizing:border-box;${radius}${border}${shadow}">${img}</div>`;
}
function renderChart(el, theme) {
  return `<div class="sl-chart" style="width:100%;height:100%;overflow:hidden">${renderChartSvg(el, theme)}</div>`;
}
function renderTable(el, theme) {
  const cols = Math.max(1, ...el.rows.map((r) => r.length));
  const widths = el.colWidths && el.colWidths.length === cols ? el.colWidths : new Array(cols).fill(1 / cols);
  const total = widths.reduce((s, w) => s + w, 0) || 1;
  const colgroup = `<colgroup>${widths.map((w) => `<col style="width:${num(w / total * 100)}%">`).join("")}</colgroup>`;
  const cellPad = Math.max(6, el.fontSize * 0.45);
  const rows = el.rows.map((row, ri) => {
    const isHeader = el.headerRow && ri === 0;
    const stripe = !isHeader && el.stripeFill && ri % 2 === (el.headerRow ? 0 : 1) ? el.stripeFill : el.fill ?? "transparent";
    const cells = Array.from({ length: cols }, (_, ci) => {
      const text2 = escapeHtml(row[ci] ?? "").replace(/\n/g, "<br>");
      const tag = isHeader ? "th" : "td";
      const style2 = [
        `padding:${num(cellPad)}px ${num(cellPad * 1.2)}px`,
        `border:1px solid ${el.borderColor}`,
        `text-align:${el.align ?? "left"}`,
        "vertical-align:middle",
        isHeader ? `background:${el.headerFill};color:${el.headerColor};font-weight:600` : `background:${stripe};color:${el.textColor}`
      ].join(";");
      return `<${tag} style="${escapeHtml(style2)}">${text2}</${tag}>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");
  const style = `width:100%;height:100%;border-collapse:collapse;table-layout:fixed;font-size:${num(el.fontSize)}px;font-family:${theme.fonts.body.replace(/"/g, "'")};line-height:1.3`;
  return `<div class="sl-table" style="width:100%;height:100%;overflow:hidden"><table style="${escapeHtml(style)}">${colgroup}<tbody>${rows}</tbody></table></div>`;
}
function renderElementInner(element, theme) {
  switch (element.type) {
    case "text":
      return renderText(element, theme);
    case "shape":
      return renderShape(element, theme);
    case "image":
      return renderImage(element);
    case "chart":
      return renderChart(element, theme);
    case "table":
      return renderTable(element, theme);
    case "group":
      return "";
  }
}
function renderElementHtml(element, theme) {
  if (element.type === "group") return "";
  return `<div ${SLIDE_ELEMENT_ATTR}="${escapeHtml(element.id)}" class="sl-el sl-${element.type}" style="${escapeHtml(elementFrameStyle(element))}">${renderElementInner(element, theme)}</div>`;
}
function slideBackgroundCss(slide, theme) {
  return fillToCss(slide.background, theme.colors.background);
}
function renderSlideInnerHtml(slide, elements, theme) {
  return elements.map((e) => renderElementHtml(e, theme)).join("");
}
var SLIDE_RICH_TEXT_CSS = `
.sl-rich p{margin:0}
.sl-rich p+p{margin-top:0.35em}
.sl-rich ul,.sl-rich ol{margin:0;padding-left:1.2em}
.sl-rich li{margin:0.18em 0}
.sl-rich li p{margin:0}
.sl-rich a{color:inherit;text-decoration:underline}
.sl-el{box-sizing:border-box}
`;

// lib/slides/source.ts
var SLIDE_CANVAS_MARKER = "<!-- dokki-slide-canvas@1 -->";
var SLIDE_CANVAS_DATA_ID = "dokki-slide-deck";
function isSlideCanvasSource(source) {
  return typeof source === "string" && source.slice(0, 4e3).includes(SLIDE_CANVAS_MARKER);
}
var DATA_RE = new RegExp(
  `<script id="${SLIDE_CANVAS_DATA_ID}" type="application/json">([\\s\\S]*?)</script>`
);
function extractDeckFromSource(source) {
  if (!isSlideCanvasSource(source)) return null;
  const match = DATA_RE.exec(source);
  if (!match) return null;
  try {
    const raw = JSON.parse(match[1].replace(/<\\\//g, "</"));
    return validateDeckSnapshot(raw);
  } catch {
    return null;
  }
}
function encodeDeckForSource(snapshot) {
  return JSON.stringify(snapshot).replace(/<\//g, "<\\/");
}

// lib/slides/render-html.ts
function renderDeckHtml(snapshot, options = {}) {
  const { meta } = snapshot;
  const theme = meta.theme;
  const visible = snapshot.slides.filter((s) => !s.hidden);
  const slides = visible.map((slide, index) => {
    const elements = snapshot.elements[slide.id] ?? [];
    return `<section class="slide" data-slide-id="${escapeHtml(slide.id)}" aria-label="Slide ${index + 1} of ${visible.length}" aria-hidden="${index === 0 ? "false" : "true"}" style="background:${escapeHtml(slideBackgroundCss(slide, theme))}">${renderSlideInnerHtml(slide, elements, theme)}${slide.notes ? `<aside class="notes" hidden>${escapeHtml(slide.notes)}</aside>` : ""}</section>`;
  }).join("");
  const data = options.omitData ? "" : `<script id="${SLIDE_CANVAS_DATA_ID}" type="application/json">${encodeDeckForSource(snapshot)}</script>`;
  const start = Math.max(1, Math.min(visible.length, options.start ?? 1));
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
${SLIDE_CANVAS_MARKER}
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="generator" content="dokki-slide-canvas@1">
<title>${escapeHtml(meta.title || "Slides")}</title>
<style>
*{box-sizing:border-box}
html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#0b0c0f;color:${escapeHtml(theme.colors.text)};font-family:${escapeHtml(theme.fonts.body)}}
.deck{position:absolute;inset:0;overflow:hidden}
.stage{position:absolute;left:50%;top:50%;width:${meta.width}px;height:${meta.height}px;transform-origin:center center;overflow:hidden;background:${escapeHtml(theme.colors.background)};box-shadow:0 30px 80px rgba(0,0,0,.5)}
.slide{display:none;position:absolute;inset:0;overflow:hidden}
.slide[aria-hidden="false"]{display:block}
${SLIDE_RICH_TEXT_CSS}
.controls{position:fixed;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:999px;background:rgba(12,13,16,.82);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(12px);opacity:0;transition:opacity .2s;z-index:10}
body:hover .controls,.controls:focus-within{opacity:1}
.controls button{min-width:40px;min-height:36px;border:0;border-radius:999px;background:rgba(255,255,255,.1);color:#fff;font:inherit;font-size:14px;cursor:pointer}
.controls button:hover{background:rgba(255,255,255,.2)}
.counter{min-width:64px;text-align:center;color:rgba(255,255,255,.7);font-size:13px;font-variant-numeric:tabular-nums}
.notes-panel{position:fixed;right:16px;bottom:72px;max-width:min(480px,calc(100% - 32px));max-height:40vh;overflow:auto;padding:12px 14px;border-radius:12px;background:rgba(12,13,16,.92);color:#fff;font-size:14px;line-height:1.5;white-space:pre-wrap;display:none;z-index:10}
.notes-panel.open{display:block}
@media print{.controls,.notes-panel{display:none!important}.deck{position:static}.stage{position:static;transform:none!important;box-shadow:none;page-break-after:always;margin:0 auto}.slide{display:block!important;position:relative;width:${meta.width}px;height:${meta.height}px;page-break-after:always}}
</style>
</head>
<body>
<main class="deck" id="deck"><div class="stage" id="stage">${slides}</div></main>
<nav class="controls" aria-label="Presentation controls">
<button id="prev" type="button" aria-label="Previous slide">\u2039</button>
<span class="counter" id="counter" aria-live="polite"></span>
<button id="next" type="button" aria-label="Next slide">\u203A</button>
<button id="notes" type="button" aria-label="Speaker notes" aria-pressed="false">N</button>
<button id="fullscreen" type="button" aria-label="Full screen">\u2922</button>
</nav>
<aside class="notes-panel" id="notes-panel" aria-label="Speaker notes"></aside>
${data}
<script>
(function(){
var deck=document.getElementById('deck'),stage=document.getElementById('stage');
var slides=Array.prototype.slice.call(document.querySelectorAll('.slide'));
var counter=document.getElementById('counter'),notesPanel=document.getElementById('notes-panel'),notesBtn=document.getElementById('notes');
var W=${meta.width},H=${meta.height},i=0,notesOpen=false;
function fit(){var r=deck.getBoundingClientRect();var s=Math.min(r.width/W,r.height/H);stage.style.transform='translate(-50%,-50%) scale('+Math.max(0.01,s)+')'}
function show(n){if(!slides.length)return;i=(n+slides.length)%slides.length;slides.forEach(function(s,j){s.setAttribute('aria-hidden',j===i?'false':'true')});counter.textContent=(i+1)+' / '+slides.length;var a=slides[i].querySelector('.notes');notesPanel.textContent=a?a.textContent:'';if(history.replaceState)history.replaceState(null,'','#'+(i+1))}
document.getElementById('prev').onclick=function(){show(i-1)};
document.getElementById('next').onclick=function(){show(i+1)};
document.getElementById('fullscreen').onclick=function(){if(deck.requestFullscreen)deck.requestFullscreen()};
notesBtn.onclick=function(){notesOpen=!notesOpen;notesPanel.classList.toggle('open',notesOpen);notesBtn.setAttribute('aria-pressed',String(notesOpen))};
window.addEventListener('resize',fit);if(window.visualViewport)window.visualViewport.addEventListener('resize',fit);
if(window.ResizeObserver)new ResizeObserver(fit).observe(deck);fit();
window.addEventListener('keydown',function(e){if(e.metaKey||e.ctrlKey||e.altKey)return;if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '||e.key==='Enter'){e.preventDefault();show(i+1)}else if(e.key==='ArrowLeft'||e.key==='PageUp'||e.key==='Backspace'){e.preventDefault();show(i-1)}else if(e.key==='Home')show(0);else if(e.key==='End')show(slides.length-1);else if(e.key==='n'||e.key==='N')notesBtn.click();else if(e.key==='f'||e.key==='F')document.getElementById('fullscreen').click()});
deck.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('a'))return;var r=deck.getBoundingClientRect();show(e.clientX-r.left>r.width/2?i+1:i-1)});
var h=parseInt((location.hash||'').replace('#',''),10);show(h>0?h-1:${start - 1});
})();
</script>
</body>
</html>`;
}

// lib/slides/editorial.ts
var DOKKI_EDITORIAL_THEME = {
  colors: {
    background: "#F7F8F5",
    // canvas
    surface: "#FFFFFF",
    // paper
    text: "#1A1A1A",
    // ink
    muted: "#666666",
    accent: "#F50132",
    // signal
    accent2: "#050706",
    // dark field
    accent3: "#D6D7D2"
    // line
  },
  fonts: {
    heading: "Aptos, Inter, 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', system-ui, sans-serif",
    body: "Aptos, Inter, 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', system-ui, sans-serif"
  }
};
var GRID = {
  margin: 120,
  gutter: 24,
  columns: 12,
  /** x of column i (0-based). */
  col: (i) => 120 + i * 142,
  /** width spanning n columns. */
  span: (n) => n * 142 - 24,
  contentTop: 168,
  contentBottom: 940,
  footerY: 992
};
var TYPE = { display: 112, title: 80, lead: 48, body: 36, label: 32, meta: 28 };
var W = 1920;
var H = 1080;
function text(ctx, name, frame, html, style = {}) {
  return createTextElement(ctx.makeId("e"), {
    ...frame,
    name,
    html,
    fontSize: TYPE.body,
    color: ctx.theme.colors.text,
    align: "left",
    valign: "top",
    lineHeight: 1.3,
    ...style
  });
}
function rule(ctx, name, x, y, w, color = ctx.theme.colors.accent3, h = 2) {
  return createShapeElement(ctx.makeId("e"), {
    x,
    y,
    w,
    h,
    name,
    shape: "rect",
    fill: { type: "solid", color },
    locked: true
  });
}
function plane(ctx, name, frame, color) {
  return createShapeElement(ctx.makeId("e"), {
    ...frame,
    name,
    shape: "rect",
    fill: { type: "solid", color },
    locked: true
  });
}
function p(lines, fallback = []) {
  const list = lines && lines.length ? lines : fallback;
  return list.map((l) => plainTextToRichHtml(l)).join("");
}
function bullets(lines, fallback = []) {
  const list = lines && lines.length ? lines : fallback;
  return `<ul>${list.map((l) => `<li>${plainTextToRichHtml(l)}</li>`).join("")}</ul>`;
}
function chrome(ctx, c, options = {}) {
  const ink = options.dark ? ctx.theme.colors.background : ctx.theme.colors.muted;
  const out = [];
  if (c.kicker) {
    out.push(
      text(
        ctx,
        "Kicker",
        { x: GRID.col(0), y: 72, w: GRID.span(8), h: 44 },
        plainTextToRichHtml(c.kicker.toUpperCase()),
        {
          fontSize: TYPE.meta,
          fontWeight: 600,
          color: options.dark ? ctx.theme.colors.background : ctx.theme.colors.accent,
          letterSpacing: 2
        }
      )
    );
  }
  if (c.footer) {
    out.push(
      text(
        ctx,
        "Footer",
        { x: GRID.col(0), y: GRID.footerY, w: GRID.span(9), h: 40 },
        plainTextToRichHtml(c.footer),
        {
          fontSize: TYPE.meta - 4,
          color: ink
        }
      )
    );
  }
  if (c.page) {
    out.push(
      text(
        ctx,
        "Page",
        { x: GRID.col(10), y: GRID.footerY, w: GRID.span(2), h: 40 },
        plainTextToRichHtml(c.page),
        {
          fontSize: TYPE.meta - 4,
          color: ink,
          align: "right"
        }
      )
    );
  }
  return out;
}
function title(ctx, c, frame, size = TYPE.title, color) {
  return text(ctx, "Title", frame, plainTextToRichHtml(c.title ?? "Title"), {
    fontSize: size,
    fontFamily: ctx.theme.fonts.heading,
    fontWeight: size >= TYPE.display ? 300 : 500,
    lineHeight: 1.1,
    letterSpacing: size >= TYPE.title ? -1 : 0,
    ...color ? { color } : {}
  });
}
var steps = (c) => c.steps ?? c.columns ?? [];
var EDITORIAL_LAYOUTS = [
  {
    id: "cover-signal",
    name: "Cover \xB7 signal",
    description: "Large display claim, one signal rule, meta line.",
    build: (c, ctx) => [
      rule(ctx, "Signal", GRID.col(0), 330, 160, ctx.theme.colors.accent, 12),
      // 104 px lets a 15-character CJK claim sit on two lines of the full width.
      title(ctx, c, { x: GRID.col(0), y: 380, w: GRID.span(12), h: 300 }, 104),
      text(
        ctx,
        "Subtitle",
        { x: GRID.col(0), y: 700, w: GRID.span(8), h: 110 },
        plainTextToRichHtml(c.subtitle ?? ""),
        {
          fontSize: TYPE.lead,
          color: ctx.theme.colors.muted,
          lineHeight: 1.25
        }
      ),
      ...chrome(ctx, c)
    ]
  },
  {
    id: "statement",
    name: "Statement",
    description: "One oversized sentence and a small proof line.",
    build: (c, ctx) => [
      title(
        ctx,
        { ...c, title: c.quote ?? c.title },
        { x: GRID.col(0), y: 300, w: GRID.span(11), h: 420 },
        96
      ),
      text(
        ctx,
        "Proof",
        { x: GRID.col(0), y: 760, w: GRID.span(8), h: 90 },
        p(c.body, [c.attribution ?? ""]),
        {
          fontSize: TYPE.body,
          color: ctx.theme.colors.muted
        }
      ),
      ...chrome(ctx, c)
    ]
  },
  {
    id: "section",
    name: "Section",
    description: "Section number, short phrase, broad quiet field.",
    build: (c, ctx) => [
      text(
        ctx,
        "Number",
        { x: GRID.col(0), y: 380, w: GRID.span(3), h: 200 },
        plainTextToRichHtml(c.number ?? "01"),
        {
          fontSize: 160,
          fontWeight: 300,
          color: ctx.theme.colors.accent,
          lineHeight: 1,
          letterSpacing: -4
        }
      ),
      title(ctx, c, { x: GRID.col(4), y: 400, w: GRID.span(8), h: 220 }, TYPE.title),
      text(
        ctx,
        "Subtitle",
        { x: GRID.col(4), y: 640, w: GRID.span(7), h: 100 },
        plainTextToRichHtml(c.subtitle ?? ""),
        {
          fontSize: TYPE.lead - 8,
          color: ctx.theme.colors.muted
        }
      ),
      ...chrome(ctx, c)
    ]
  },
  {
    id: "split",
    name: "Split 7/5",
    description: "Dominant claim and copy left, supporting field right.",
    build: (c, ctx) => [
      ...chrome(ctx, c),
      title(
        ctx,
        c,
        { x: GRID.col(0), y: GRID.contentTop, w: GRID.span(7), h: 200 },
        TYPE.title - 8
      ),
      text(
        ctx,
        "Body",
        { x: GRID.col(0), y: GRID.contentTop + 240, w: GRID.span(6), h: 480 },
        p(c.body, ["Supporting copy."]),
        {
          fontSize: TYPE.body,
          lineHeight: 1.45
        }
      ),
      rule(
        ctx,
        "Divider",
        GRID.col(7) - 24,
        GRID.contentTop,
        2,
        ctx.theme.colors.accent3,
        GRID.contentBottom - GRID.contentTop
      ),
      text(
        ctx,
        "Aside",
        { x: GRID.col(7) + 24, y: GRID.contentTop + 8, w: GRID.span(5) - 24, h: 700 },
        bullets(c.body2, ["Point", "Point"]),
        {
          fontSize: TYPE.label,
          color: ctx.theme.colors.text,
          lineHeight: 1.5
        }
      )
    ]
  },
  {
    id: "data-hero",
    name: "Data hero",
    description: "One number that matters, then its context or a compact chart.",
    build: (c, ctx) => {
      const out = [
        ...chrome(ctx, c),
        text(
          ctx,
          "Number",
          { x: GRID.col(0), y: 300, w: GRID.span(5), h: 260 },
          plainTextToRichHtml(c.number ?? "42%"),
          {
            fontSize: 220,
            fontWeight: 300,
            lineHeight: 1,
            letterSpacing: -8,
            fontFamily: ctx.theme.fonts.heading
          }
        ),
        text(
          ctx,
          "Label",
          { x: GRID.col(0), y: 580, w: GRID.span(5), h: 120 },
          plainTextToRichHtml(c.label ?? c.title ?? ""),
          {
            fontSize: TYPE.lead - 8,
            color: ctx.theme.colors.muted
          }
        )
      ];
      if (c.chart) {
        out.push(
          createChartElement(ctx.makeId("e"), {
            x: GRID.col(6),
            y: GRID.contentTop + 40,
            w: GRID.span(6),
            h: 620,
            name: "Chart",
            showLegend: (c.chart.series?.length ?? 0) > 1,
            showValues: true,
            fontSize: 22,
            ...c.chart
          })
        );
      } else {
        out.push(
          text(
            ctx,
            "Context",
            { x: GRID.col(6), y: 320, w: GRID.span(6), h: 480 },
            p(c.body, ["What this number means."]),
            {
              fontSize: TYPE.body,
              lineHeight: 1.45
            }
          )
        );
      }
      return out;
    }
  },
  {
    id: "comparison",
    name: "Comparison",
    description: "Two aligned fields separated by one vertical rule.",
    build: (c, ctx) => {
      const cols = (c.columns ?? []).slice(0, 2);
      while (cols.length < 2)
        cols.push({ title: cols.length ? "After" : "Before", body: ["Point"] });
      const out = [
        ...chrome(ctx, c),
        title(
          ctx,
          c,
          { x: GRID.col(0), y: GRID.contentTop, w: GRID.span(12), h: 130 },
          TYPE.title - 16
        )
      ];
      const top = GRID.contentTop + 190;
      cols.forEach((col, i) => {
        const x = i === 0 ? GRID.col(0) : GRID.col(6) + 36;
        const w = GRID.span(6) - 36;
        out.push(
          text(
            ctx,
            `Heading ${i + 1}`,
            { x, y: top, w, h: 70 },
            plainTextToRichHtml(col.title ?? ""),
            {
              fontSize: TYPE.lead - 8,
              fontWeight: 600,
              color: i === 1 ? ctx.theme.colors.accent : ctx.theme.colors.text
            }
          ),
          text(
            ctx,
            `Column ${i + 1}`,
            { x, y: top + 100, w, h: GRID.contentBottom - (top + 100) },
            bullets(col.body, ["Point"]),
            { fontSize: TYPE.label, lineHeight: 1.5 }
          )
        );
      });
      out.push(
        rule(
          ctx,
          "Divider",
          GRID.col(6) - 6,
          top,
          2,
          ctx.theme.colors.accent3,
          GRID.contentBottom - top
        )
      );
      return out;
    }
  },
  {
    id: "timeline",
    name: "Timeline",
    description: "Horizontal baseline with 3\u20135 uneven milestones.",
    build: (c, ctx) => {
      const items = steps(c).slice(0, 5);
      while (items.length < 3) items.push({ title: `Milestone ${items.length + 1}`, body: [""] });
      const out = [
        ...chrome(ctx, c),
        title(
          ctx,
          c,
          { x: GRID.col(0), y: GRID.contentTop, w: GRID.span(12), h: 130 },
          TYPE.title - 16
        )
      ];
      const baseY = 560;
      const left = GRID.col(0);
      const right = GRID.col(12) - 24;
      out.push(rule(ctx, "Baseline", left, baseY, right - left, ctx.theme.colors.accent3, 3));
      const weights = items.map((_, i) => 1 + (i % 2 ? 0.35 : 0));
      const total = weights.reduce((a, b) => a + b, 0);
      let acc = 0;
      items.forEach((item, i) => {
        const slot = weights[i] / total * (right - left);
        const x = left + (acc + weights[i] / 2) / total * (right - left);
        acc += weights[i];
        const current = c.current === i;
        const bw = Math.min(300, slot - 24);
        out.push(
          createShapeElement(ctx.makeId("e"), {
            x: x - 14,
            y: baseY - 12,
            w: 28,
            h: 28,
            name: `Dot ${i + 1}`,
            shape: "ellipse",
            fill: {
              type: "solid",
              color: current ? ctx.theme.colors.accent : ctx.theme.colors.text
            }
          }),
          text(
            ctx,
            `Milestone ${i + 1}`,
            { x: x - bw / 2, y: baseY - 130, w: bw, h: 100 },
            plainTextToRichHtml(item.title ?? ""),
            {
              fontSize: TYPE.label,
              fontWeight: 600,
              align: "center",
              valign: "bottom",
              color: current ? ctx.theme.colors.accent : ctx.theme.colors.text
            }
          ),
          text(
            ctx,
            `Note ${i + 1}`,
            { x: x - bw / 2, y: baseY + 40, w: bw, h: 220 },
            p(item.body, [""]),
            {
              fontSize: TYPE.meta,
              align: "center",
              color: ctx.theme.colors.muted
            }
          )
        );
      });
      return out;
    }
  },
  {
    id: "process",
    name: "Process",
    description: "Connected verbs; highlight only the current shift.",
    build: (c, ctx) => {
      const items = steps(c).slice(0, 5);
      while (items.length < 3) items.push({ title: `Step ${items.length + 1}`, body: [""] });
      const out = [
        ...chrome(ctx, c),
        title(
          ctx,
          c,
          { x: GRID.col(0), y: GRID.contentTop, w: GRID.span(12), h: 130 },
          TYPE.title - 16
        )
      ];
      const n = items.length;
      const gap = 48;
      const w = (GRID.span(12) - gap * (n - 1)) / n;
      const top = GRID.contentTop + 220;
      items.forEach((item, i) => {
        const x = GRID.col(0) + i * (w + gap);
        const current = c.current === i;
        out.push(
          rule(
            ctx,
            `Rule ${i + 1}`,
            x,
            top,
            w,
            current ? ctx.theme.colors.accent : ctx.theme.colors.text,
            current ? 6 : 3
          ),
          text(
            ctx,
            `Index ${i + 1}`,
            { x, y: top + 28, w: 120, h: 44 },
            plainTextToRichHtml(String(i + 1).padStart(2, "0")),
            {
              fontSize: TYPE.meta,
              fontWeight: 600,
              color: current ? ctx.theme.colors.accent : ctx.theme.colors.muted
            }
          ),
          text(
            ctx,
            `Step ${i + 1}`,
            { x, y: top + 84, w, h: 120 },
            plainTextToRichHtml(item.title ?? ""),
            {
              fontSize: TYPE.lead - 8,
              fontWeight: 600,
              lineHeight: 1.15
            }
          ),
          text(
            ctx,
            `Detail ${i + 1}`,
            { x, y: top + 220, w, h: GRID.contentBottom - (top + 220) },
            p(item.body, [""]),
            {
              fontSize: TYPE.meta + 2,
              color: ctx.theme.colors.muted,
              lineHeight: 1.45
            }
          )
        );
        if (i < n - 1) {
          out.push(
            createShapeElement(ctx.makeId("e"), {
              x: x + w + 8,
              y: top + 100,
              w: gap - 16,
              h: 4,
              name: `Link ${i + 1}`,
              shape: "arrow",
              fill: { type: "none" },
              stroke: { color: ctx.theme.colors.accent3, width: 3 },
              points: { x1: 0, y1: 0.5, x2: 1, y2: 0.5 },
              markerEnd: "arrow",
              locked: true
            })
          );
        }
      });
      return out;
    }
  },
  {
    id: "architecture",
    name: "Architecture",
    description: "2\u20134 stacked layers with a label and what each one does.",
    build: (c, ctx) => {
      const layers = steps(c).slice(0, 4);
      while (layers.length < 2) layers.push({ title: `Layer ${layers.length + 1}`, body: [""] });
      const out = [
        ...chrome(ctx, c),
        title(
          ctx,
          c,
          { x: GRID.col(0), y: GRID.contentTop, w: GRID.span(12), h: 130 },
          TYPE.title - 16
        )
      ];
      const top = GRID.contentTop + 200;
      const gap = 20;
      const h = (GRID.contentBottom - top - gap * (layers.length - 1)) / layers.length;
      layers.forEach((layer, i) => {
        const y = top + i * (h + gap);
        const current = c.current === i;
        out.push(
          plane(
            ctx,
            `Band ${i + 1}`,
            { x: GRID.col(0), y, w: GRID.span(12), h },
            current ? ctx.theme.colors.text : ctx.theme.colors.surface
          ),
          text(
            ctx,
            `Layer ${i + 1}`,
            { x: GRID.col(0) + 40, y: y + 24, w: GRID.span(4) - 40, h: h - 48 },
            plainTextToRichHtml(layer.title ?? ""),
            {
              fontSize: TYPE.lead - 8,
              fontWeight: 600,
              valign: "middle",
              color: current ? ctx.theme.colors.background : ctx.theme.colors.text
            }
          ),
          text(
            ctx,
            `Role ${i + 1}`,
            { x: GRID.col(4) + 40, y: y + 24, w: GRID.span(8) - 80, h: h - 48 },
            p(layer.body, [""]),
            {
              fontSize: TYPE.label - 2,
              valign: "middle",
              color: current ? ctx.theme.colors.background : ctx.theme.colors.muted,
              lineHeight: 1.4
            }
          )
        );
      });
      return out;
    }
  },
  {
    id: "chart-ledger",
    name: "Chart ledger",
    description: "Claim above a large chart and a source line.",
    build: (c, ctx) => [
      ...chrome(ctx, c),
      title(
        ctx,
        c,
        { x: GRID.col(0), y: GRID.contentTop, w: GRID.span(12), h: 130 },
        TYPE.title - 16
      ),
      createChartElement(ctx.makeId("e"), {
        x: GRID.col(0),
        y: GRID.contentTop + 170,
        w: GRID.span(12),
        h: GRID.contentBottom - GRID.contentTop - 200,
        name: "Chart",
        showLegend: (c.chart?.series?.length ?? 1) > 1,
        showValues: true,
        fontSize: 24,
        ...c.chart ?? {}
      })
    ]
  },
  {
    id: "table-ledger",
    name: "Table ledger",
    description: "Claim above a native table and a source line.",
    build: (c, ctx) => [
      ...chrome(ctx, c),
      title(
        ctx,
        c,
        { x: GRID.col(0), y: GRID.contentTop, w: GRID.span(12), h: 130 },
        TYPE.title - 16
      ),
      createTableElement(ctx.makeId("e"), {
        x: GRID.col(0),
        y: GRID.contentTop + 170,
        w: GRID.span(12),
        h: Math.min(GRID.contentBottom - GRID.contentTop - 200, 56 * (c.table?.length ?? 4) + 24),
        name: "Table",
        rows: c.table ?? [
          ["Column", "Column"],
          ["", ""]
        ],
        fontSize: 26,
        headerRow: true,
        headerFill: ctx.theme.colors.surface,
        headerColor: ctx.theme.colors.text,
        textColor: ctx.theme.colors.text,
        borderColor: ctx.theme.colors.accent3,
        fill: ctx.theme.colors.background
      })
    ]
  },
  {
    id: "image-hero",
    name: "Image hero",
    description: "7/5 image and text; the image is the evidence.",
    build: (c, ctx) => {
      const frame = { x: 0, y: 0, w: 1120, h: H };
      const out = [
        c.imageSrc ? createImageElement(ctx.makeId("e"), {
          ...frame,
          name: "Image",
          src: c.imageSrc,
          alt: c.imageAlt,
          fit: "cover"
        }) : plane(ctx, "Image placeholder", frame, ctx.theme.colors.accent3),
        title(
          ctx,
          c,
          { x: 1200, y: GRID.contentTop, w: W - 1200 - GRID.margin, h: 320 },
          TYPE.title - 16
        ),
        text(
          ctx,
          "Body",
          { x: 1200, y: GRID.contentTop + 360, w: W - 1200 - GRID.margin, h: 380 },
          p(c.body, [""]),
          {
            fontSize: TYPE.label,
            color: ctx.theme.colors.muted,
            lineHeight: 1.45
          }
        )
      ];
      if (c.kicker)
        out.push(
          text(
            ctx,
            "Kicker",
            { x: 1200, y: 72, w: W - 1200 - GRID.margin, h: 44 },
            plainTextToRichHtml(c.kicker.toUpperCase()),
            {
              fontSize: TYPE.meta,
              fontWeight: 600,
              color: ctx.theme.colors.accent,
              letterSpacing: 2
            }
          )
        );
      return out;
    }
  },
  {
    id: "matrix",
    name: "Matrix 2\xD72",
    description: "Two axes, four sparse labels, no cards.",
    build: (c, ctx) => {
      const m = c.matrix ?? { x: "Axis X", y: "Axis Y", cells: ["", "", "", ""] };
      const out = [
        ...chrome(ctx, c),
        title(
          ctx,
          c,
          { x: GRID.col(0), y: GRID.contentTop, w: GRID.span(12), h: 130 },
          TYPE.title - 16
        )
      ];
      const left = GRID.col(2);
      const top = GRID.contentTop + 200;
      const w = GRID.span(9);
      const h = GRID.contentBottom - top - 40;
      out.push(
        rule(ctx, "Axis Y", left + w / 2 - 1, top, 2, ctx.theme.colors.text, h),
        rule(ctx, "Axis X", left, top + h / 2 - 1, w, ctx.theme.colors.text, 2),
        text(
          ctx,
          "Label X",
          { x: left, y: top + h + 8, w, h: 40 },
          plainTextToRichHtml(m.x ?? ""),
          { fontSize: TYPE.meta, align: "right", color: ctx.theme.colors.muted }
        ),
        text(
          ctx,
          "Label Y",
          { x: GRID.col(0), y: top, w: GRID.span(2) - 40, h: 60 },
          plainTextToRichHtml(m.y ?? ""),
          { fontSize: TYPE.meta, color: ctx.theme.colors.muted }
        )
      );
      const cells = m.cells ?? [];
      const pos = [
        [left + 32, top + 32],
        [left + w / 2 + 32, top + 32],
        [left + 32, top + h / 2 + 32],
        [left + w / 2 + 32, top + h / 2 + 32]
      ];
      cells.slice(0, 4).forEach((cell, i) => {
        out.push(
          text(
            ctx,
            `Quadrant ${i + 1}`,
            { x: pos[i][0], y: pos[i][1], w: w / 2 - 64, h: h / 2 - 64 },
            plainTextToRichHtml(cell),
            {
              fontSize: TYPE.label,
              fontWeight: c.current === i ? 600 : 400,
              color: c.current === i ? ctx.theme.colors.accent : ctx.theme.colors.text
            }
          )
        );
      });
      return out;
    }
  },
  {
    id: "closing-split",
    name: "Closing split",
    description: "Dark field with the decision, concrete next actions beside it.",
    build: (c, ctx) => [
      plane(ctx, "Field", { x: 0, y: 0, w: 1120, h: H }, ctx.theme.colors.text),
      rule(ctx, "Signal", GRID.col(0), 330, 120, ctx.theme.colors.accent, 12),
      title(
        ctx,
        c,
        { x: GRID.col(0), y: 380, w: 880, h: 360 },
        TYPE.title,
        ctx.theme.colors.background
      ),
      text(
        ctx,
        "Subtitle",
        { x: GRID.col(0), y: 760, w: 880, h: 120 },
        plainTextToRichHtml(c.subtitle ?? ""),
        {
          fontSize: TYPE.label,
          color: ctx.theme.colors.background,
          opacity: 0.8
        }
      ),
      text(
        ctx,
        "Actions",
        { x: 1200, y: GRID.contentTop + 40, w: W - 1200 - GRID.margin, h: 640 },
        bullets(c.body, ["Next action"]),
        {
          fontSize: TYPE.label,
          lineHeight: 1.55
        }
      ),
      // The footer sits on the dark field, the page number on the canvas.
      ...c.footer ? [
        text(
          ctx,
          "Footer",
          { x: GRID.col(0), y: GRID.footerY, w: 960, h: 40 },
          plainTextToRichHtml(c.footer),
          {
            fontSize: TYPE.meta - 4,
            color: ctx.theme.colors.background,
            opacity: 0.8
          }
        )
      ] : [],
      ...c.page ? [
        text(
          ctx,
          "Page",
          { x: GRID.col(10), y: GRID.footerY, w: GRID.span(2), h: 40 },
          plainTextToRichHtml(c.page),
          {
            fontSize: TYPE.meta - 4,
            color: ctx.theme.colors.muted,
            align: "right"
          }
        )
      ] : []
    ]
  }
];

// lib/slides/layouts.ts
var MARGIN = 120;
function bullets2(lines) {
  if (!lines || lines.length === 0) return "<p></p>";
  return `<ul>${lines.map((line) => `<li>${plainTextToRichHtml(line)}</li>`).join("")}</ul>`;
}
function paragraphs(lines) {
  if (!lines || lines.length === 0) return "<p></p>";
  return lines.map((line) => plainTextToRichHtml(line)).join("");
}
function heading(ctx, text2, frame, size, align = "left") {
  return createTextElement(ctx.makeId("e"), {
    ...frame,
    name: "Title",
    html: plainTextToRichHtml(text2 ?? "Title"),
    fontSize: size,
    fontFamily: ctx.theme.fonts.heading,
    fontWeight: 700,
    color: ctx.theme.colors.text,
    align,
    valign: "top",
    lineHeight: 1.08,
    letterSpacing: -0.5
  });
}
function kicker(ctx, text2, y, align = "left") {
  if (!text2) return [];
  return [
    createTextElement(ctx.makeId("e"), {
      x: MARGIN,
      y,
      w: ctx.width - MARGIN * 2,
      h: 48,
      name: "Kicker",
      html: plainTextToRichHtml(text2.toUpperCase()),
      fontSize: 28,
      fontWeight: 600,
      color: ctx.theme.colors.accent,
      align,
      valign: "top",
      letterSpacing: 2
    })
  ];
}
function pageAccent(ctx) {
  return [
    createShapeElement(ctx.makeId("e"), {
      x: MARGIN,
      y: ctx.height - MARGIN - 6,
      w: 160,
      h: 8,
      name: "Accent",
      shape: "rect",
      fill: { type: "solid", color: ctx.theme.colors.accent },
      locked: true
    })
  ];
}
var GENERIC_LAYOUTS = [
  {
    id: "title",
    name: "Title",
    description: "Deck title with a subtitle.",
    build: (c, ctx) => [
      ...kicker(ctx, c.kicker, ctx.height * 0.3 - 80, "left"),
      heading(
        ctx,
        c.title ?? "Presentation title",
        { x: MARGIN, y: ctx.height * 0.3, w: ctx.width - MARGIN * 2, h: 260 },
        112
      ),
      createTextElement(ctx.makeId("e"), {
        x: MARGIN,
        y: ctx.height * 0.3 + 300,
        w: ctx.width * 0.6,
        h: 120,
        name: "Subtitle",
        html: plainTextToRichHtml(c.subtitle ?? "Subtitle"),
        fontSize: 40,
        color: ctx.theme.colors.muted,
        align: "left",
        valign: "top"
      }),
      ...pageAccent(ctx)
    ]
  },
  {
    id: "section",
    name: "Section",
    description: "A section divider on an accent background.",
    build: (c, ctx) => [
      createShapeElement(ctx.makeId("e"), {
        x: 0,
        y: 0,
        w: ctx.width,
        h: ctx.height,
        name: "Background",
        shape: "rect",
        fill: { type: "solid", color: ctx.theme.colors.accent },
        locked: true
      }),
      ...kicker(ctx, c.kicker, ctx.height * 0.38 - 70).map(
        (e) => ({ ...e, color: ctx.theme.colors.background })
      ),
      {
        ...heading(
          ctx,
          c.title ?? "Section",
          { x: MARGIN, y: ctx.height * 0.38, w: ctx.width - MARGIN * 2, h: 220 },
          96
        ),
        color: ctx.theme.colors.background
      },
      createTextElement(ctx.makeId("e"), {
        x: MARGIN,
        y: ctx.height * 0.38 + 240,
        w: ctx.width * 0.6,
        h: 100,
        name: "Subtitle",
        html: plainTextToRichHtml(c.subtitle ?? ""),
        fontSize: 36,
        color: ctx.theme.colors.background,
        opacity: 0.85,
        align: "left",
        valign: "top"
      })
    ]
  },
  {
    id: "title-body",
    name: "Title and body",
    description: "A claim with supporting bullets.",
    build: (c, ctx) => [
      ...kicker(ctx, c.kicker, MARGIN - 20),
      heading(ctx, c.title, { x: MARGIN, y: MARGIN + 40, w: ctx.width - MARGIN * 2, h: 150 }, 64),
      createTextElement(ctx.makeId("e"), {
        x: MARGIN,
        y: MARGIN + 240,
        w: ctx.width - MARGIN * 2,
        h: ctx.height - MARGIN * 2 - 260,
        name: "Body",
        html: bullets2(c.body ?? ["First point", "Second point", "Third point"]),
        fontSize: 36,
        color: ctx.theme.colors.text,
        align: "left",
        valign: "top",
        lineHeight: 1.45
      }),
      ...pageAccent(ctx)
    ]
  },
  {
    id: "two-column",
    name: "Two columns",
    description: "A title over two text columns.",
    build: (c, ctx) => {
      const colW = (ctx.width - MARGIN * 2 - 80) / 2;
      return [
        ...kicker(ctx, c.kicker, MARGIN - 20),
        heading(ctx, c.title, { x: MARGIN, y: MARGIN + 40, w: ctx.width - MARGIN * 2, h: 150 }, 64),
        createTextElement(ctx.makeId("e"), {
          x: MARGIN,
          y: MARGIN + 240,
          w: colW,
          h: ctx.height - MARGIN * 2 - 260,
          name: "Left column",
          html: bullets2(c.body ?? ["Point", "Point"]),
          fontSize: 32,
          color: ctx.theme.colors.text,
          align: "left",
          valign: "top",
          lineHeight: 1.45
        }),
        createTextElement(ctx.makeId("e"), {
          x: MARGIN + colW + 80,
          y: MARGIN + 240,
          w: colW,
          h: ctx.height - MARGIN * 2 - 260,
          name: "Right column",
          html: bullets2(c.body2 ?? ["Point", "Point"]),
          fontSize: 32,
          color: ctx.theme.colors.text,
          align: "left",
          valign: "top",
          lineHeight: 1.45
        }),
        ...pageAccent(ctx)
      ];
    }
  },
  {
    id: "image-right",
    name: "Text and image",
    description: "Text on the left, a full-height image on the right.",
    build: (c, ctx) => {
      const textW = ctx.width * 0.46 - MARGIN;
      const elements = [
        ...kicker(ctx, c.kicker, MARGIN - 20),
        heading(ctx, c.title, { x: MARGIN, y: MARGIN + 40, w: textW, h: 220 }, 60),
        createTextElement(ctx.makeId("e"), {
          x: MARGIN,
          y: MARGIN + 300,
          w: textW,
          h: ctx.height - MARGIN * 2 - 320,
          name: "Body",
          html: paragraphs(c.body ?? ["Supporting text."]),
          fontSize: 32,
          color: ctx.theme.colors.muted,
          align: "left",
          valign: "top",
          lineHeight: 1.45
        })
      ];
      const imageFrame = { x: ctx.width * 0.5, y: 0, w: ctx.width * 0.5, h: ctx.height };
      elements.push(
        c.imageSrc ? createImageElement(ctx.makeId("e"), {
          ...imageFrame,
          name: "Image",
          src: c.imageSrc,
          alt: c.imageAlt,
          fit: "cover"
        }) : createShapeElement(ctx.makeId("e"), {
          ...imageFrame,
          name: "Image placeholder",
          shape: "rect",
          fill: { type: "solid", color: ctx.theme.colors.surface }
        })
      );
      return elements;
    }
  },
  {
    id: "big-number",
    name: "Big number",
    description: "One metric, large, with a label.",
    build: (c, ctx) => [
      ...kicker(ctx, c.kicker, MARGIN - 20),
      createTextElement(ctx.makeId("e"), {
        x: MARGIN,
        y: ctx.height * 0.28,
        w: ctx.width - MARGIN * 2,
        h: 320,
        name: "Number",
        html: plainTextToRichHtml(c.number ?? "42%"),
        fontSize: 260,
        fontFamily: ctx.theme.fonts.heading,
        fontWeight: 800,
        color: ctx.theme.colors.accent,
        align: "left",
        valign: "top",
        lineHeight: 1,
        letterSpacing: -8
      }),
      createTextElement(ctx.makeId("e"), {
        x: MARGIN,
        y: ctx.height * 0.28 + 340,
        w: ctx.width - MARGIN * 2,
        h: 120,
        name: "Label",
        html: plainTextToRichHtml(c.label ?? c.title ?? "What this number means"),
        fontSize: 44,
        color: ctx.theme.colors.text,
        align: "left",
        valign: "top"
      }),
      ...pageAccent(ctx)
    ]
  },
  {
    id: "quote",
    name: "Quote",
    description: "A pull quote with attribution.",
    build: (c, ctx) => [
      createShapeElement(ctx.makeId("e"), {
        x: MARGIN,
        y: ctx.height * 0.3,
        w: 12,
        h: ctx.height * 0.4,
        name: "Rule",
        shape: "rect",
        fill: { type: "solid", color: ctx.theme.colors.accent },
        locked: true
      }),
      createTextElement(ctx.makeId("e"), {
        x: MARGIN + 60,
        y: ctx.height * 0.3,
        w: ctx.width - MARGIN * 2 - 60,
        h: ctx.height * 0.3,
        name: "Quote",
        html: plainTextToRichHtml(`\u201C${c.quote ?? "Quote"}\u201D`),
        fontSize: 64,
        fontFamily: ctx.theme.fonts.heading,
        fontWeight: 500,
        color: ctx.theme.colors.text,
        align: "left",
        valign: "top",
        lineHeight: 1.25
      }),
      createTextElement(ctx.makeId("e"), {
        x: MARGIN + 60,
        y: ctx.height * 0.62,
        w: ctx.width - MARGIN * 2 - 60,
        h: 80,
        name: "Attribution",
        html: plainTextToRichHtml(c.attribution ? `\u2014 ${c.attribution}` : ""),
        fontSize: 32,
        color: ctx.theme.colors.muted,
        align: "left",
        valign: "top"
      })
    ]
  },
  {
    id: "blank",
    name: "Blank",
    description: "An empty slide.",
    build: () => []
  }
];
var SLIDE_LAYOUTS = [
  ...EDITORIAL_LAYOUTS,
  ...GENERIC_LAYOUTS.filter((l) => l.id !== "blank"),
  ...GENERIC_LAYOUTS.filter((l) => l.id === "blank")
];
function findLayout(id) {
  return SLIDE_LAYOUTS.find((l) => l.id === id) ?? SLIDE_LAYOUTS[SLIDE_LAYOUTS.length - 1];
}
function buildLayoutElements(layoutId, content, meta, makeId) {
  return findLayout(layoutId).build(content, {
    theme: meta.theme,
    width: meta.width || SLIDE_CANVAS_WIDTH,
    height: meta.height || SLIDE_CANVAS_HEIGHT,
    makeId
  });
}

// lib/slides/themes.ts
var DECK_THEME_PRESETS = [
  { id: "dokki-editorial", name: "Dokki Editorial", theme: DOKKI_EDITORIAL_THEME },
  { id: "dokki-light", name: "Dokki Light", theme: DEFAULT_DECK_THEME },
  {
    id: "dokki-dark",
    name: "Dokki Dark",
    theme: {
      colors: {
        background: "#0F1115",
        surface: "#1A1D24",
        text: "#F5F5F2",
        muted: "#9A9CA3",
        accent: "#5B8CFF",
        accent2: "#FF8A5B",
        accent3: "#2ED3A0"
      },
      fonts: DEFAULT_DECK_THEME.fonts
    }
  },
  {
    id: "warm-paper",
    name: "Warm Paper",
    theme: {
      colors: {
        background: "#FBF7F0",
        surface: "#F1EADF",
        text: "#2B2620",
        muted: "#5F574E",
        accent: "#C2410C",
        accent2: "#1D4ED8",
        accent3: "#15803D"
      },
      fonts: {
        heading: "'Fraunces', 'Noto Serif SC', Georgia, serif",
        body: "Inter, 'Noto Sans SC', system-ui, sans-serif"
      }
    }
  },
  {
    id: "mono-ink",
    name: "Mono Ink",
    theme: {
      colors: {
        background: "#FFFFFF",
        surface: "#EFEFEF",
        text: "#111111",
        muted: "#666666",
        accent: "#111111",
        accent2: "#E11D48",
        accent3: "#2563EB"
      },
      fonts: {
        heading: "'JetBrains Mono', 'Noto Sans Mono CJK SC', ui-monospace, monospace",
        body: "'JetBrains Mono', 'Noto Sans Mono CJK SC', ui-monospace, monospace"
      }
    }
  }
];
function findThemePreset(id) {
  return DECK_THEME_PRESETS.find((p2) => p2.id === id);
}

// lib/slides/default-deck.ts
function createDefaultDeck(title2 = "Untitled slides") {
  const meta = createDeckMeta({ title: title2 });
  let n = 0;
  const makeId = (prefix) => `${prefix}${String(++n).padStart(3, "0")}`;
  const cover = buildLayoutElements(
    "title",
    { title: title2, subtitle: "One clear idea per slide.", kicker: "Dokki Slides" },
    meta,
    makeId
  );
  const body = buildLayoutElements(
    "title-body",
    {
      title: "Say the claim, then show the proof",
      body: [
        "Double-click any text to edit it in place",
        "Drag, resize and rotate anything; guides snap to the grid",
        "Layers, groups and arrange live under \u2318G, \u2318] and \u2318["
      ]
    },
    meta,
    makeId
  );
  return {
    meta,
    slides: [
      createSlide("cover", { layout: "title" }),
      createSlide("claim", { layout: "title-body" })
    ],
    elements: { cover, claim: body }
  };
}
var DEFAULT_SLIDE_CANVAS_SOURCE = renderDeckHtml(createDefaultDeck());

// lib/slides/lint.ts
var DEFAULTS = {
  minBodyPx: 24,
  minCaptionPx: 18,
  minContrastSmall: 4.5,
  minContrastLarge: 3,
  maxWordsPerText: 60,
  maxElementsPerSlide: 28
};
function parseColor(value) {
  if (!value) return null;
  const hex = /^#([0-9a-f]{3,8})$/i.exec(value.trim());
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4)
      h = h.split("").map((c) => c + c).join("");
    const r = Number.parseInt(h.slice(0, 2), 16);
    const g = Number.parseInt(h.slice(2, 4), 16);
    const b = Number.parseInt(h.slice(4, 6), 16);
    const a = h.length === 8 ? Number.parseInt(h.slice(6, 8), 16) / 255 : 1;
    return [r, g, b, a];
  }
  const rgb = /^rgba?\(([^)]+)\)$/i.exec(value.trim());
  if (rgb) {
    const parts = rgb[1].split(",").map((p2) => Number.parseFloat(p2));
    if (parts.length >= 3) return [parts[0], parts[1], parts[2], parts[3] ?? 1];
  }
  return null;
}
function luminance([r, g, b]) {
  const f = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrastRatio(fg, bg) {
  const a = parseColor(fg);
  const b = parseColor(bg);
  if (!a || !b) return null;
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
function fillColor(fill) {
  if (!fill) return void 0;
  if (fill.type === "solid") return fill.color;
  if (fill.type === "gradient") return fill.stops[0]?.color;
  return void 0;
}
var CJK = /[　-鿿豈-﫿＀-￯]/;
function lineWidth(text2, fontSize) {
  let w = 0;
  for (const ch of text2)
    w += CJK.test(ch) ? fontSize : ch === " " ? fontSize * 0.28 : fontSize * 0.55;
  return w;
}
function estimateTextHeight(el) {
  const doc = parseRichText(el.html);
  const lineHeight = (el.lineHeight ?? 1.25) * el.fontSize;
  const width = Math.max(1, el.w - (el.padding ?? 0) * 2);
  let lines = 0;
  for (const block of doc.blocks) {
    const text2 = block.runs.map((r) => r.text).join("");
    const size = block.runs[0]?.fontSize ?? el.fontSize;
    for (const para of text2.split("\n")) {
      lines += Math.max(1, Math.ceil(lineWidth(para, size) / width));
    }
    if (block.type !== "paragraph") lines += 0.15;
  }
  return lines * lineHeight + (el.padding ?? 0) * 2 + (doc.blocks.length - 1) * lineHeight * 0.3;
}
function wordCount(el) {
  const plain = richTextToPlain(parseRichText(el.html));
  const cjk = (plain.match(CJK) ?? []).length;
  const latin = plain.replace(CJK, " ").split(/\s+/).filter(Boolean).length;
  return latin + Math.round(cjk / 2);
}
function slideBackground(slide, snapshot) {
  return fillColor(slide.background) ?? snapshot.meta.theme.colors.background;
}
function backdropFor(element, elements, fallback) {
  const index = elements.findIndex((e) => e.id === element.id);
  const box = elementBounds(element);
  for (let i = index - 1; i >= 0; i--) {
    const below = elements[i];
    if (below.hidden) continue;
    if (below.type === "shape" && below.fill.type !== "none" && (below.shape === "rect" || below.shape === "roundRect" || below.shape === "ellipse")) {
      const b = elementBounds(below);
      if (box.x >= b.x && box.y >= b.y && box.x + box.w <= b.x + b.w && box.y + box.h <= b.y + b.h) {
        return fillColor(below.fill) ?? fallback;
      }
    }
    if (below.type === "image") {
      const b = elementBounds(below);
      if (rectsIntersect(box, b)) return "image";
    }
  }
  return fallback;
}
function lintSlide(snapshot, slide, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const out = [];
  const elements = (snapshot.elements[slide.id] ?? []).filter((e) => !e.hidden);
  const canvas = { x: 0, y: 0, w: snapshot.meta.width, h: snapshot.meta.height };
  const bg = slideBackground(slide, snapshot);
  const push = (rule2, severity, message, elementId) => out.push({ rule: rule2, severity, slideId: slide.id, elementId, message });
  const texts = elements.filter((e) => e.type === "text");
  for (const el of elements) {
    if (el.type === "group") continue;
    const b = elementBounds(el);
    if (b.x < -1 || b.y < -1 || b.x + b.w > canvas.w + 1 || b.y + b.h > canvas.h + 1) {
      const isBleed = el.type !== "text" && b.x <= 0 && b.y <= 0 && b.x + b.w >= canvas.w && b.y + b.h >= canvas.h;
      if (!isBleed) push("H1", "hard", "element extends beyond the canvas", el.id);
    }
    if (el.type === "text") {
      const need = estimateTextHeight(el);
      if (need > el.h * 1.15 + 8)
        push(
          "H2",
          "hard",
          `text needs ~${Math.round(need)}px but the box is ${Math.round(el.h)}px tall`,
          el.id
        );
      const backdrop = backdropFor(el, elements, bg);
      if (backdrop === "image") {
        push("H4", "hard", "text sits directly on an image with no scrim", el.id);
      } else {
        const ratio = contrastRatio(el.color, backdrop);
        const large = el.fontSize >= 36 || el.fontSize >= 28 && (el.fontWeight ?? 400) >= 600;
        const floor = large ? o.minContrastLarge : o.minContrastSmall;
        if (ratio !== null && ratio + 0.02 < floor)
          push(
            "H4",
            "hard",
            `contrast ${ratio.toFixed(2)} is below ${floor} against ${backdrop}`,
            el.id
          );
      }
      const plain = richTextToPlain(parseRichText(el.html)).trim();
      if (plain && el.fontSize < o.minCaptionPx)
        push("H5", "hard", `text is ${el.fontSize}px; captions need \u2265 ${o.minCaptionPx}px`, el.id);
      else if (plain && el.fontSize < o.minBodyPx && wordCount(el) > 12)
        push(
          "S0",
          "soft",
          `body-length text at ${el.fontSize}px (< ${o.minBodyPx}px) is hard to read from a distance`,
          el.id
        );
      const words = wordCount(el);
      if (words > o.maxWordsPerText)
        push("S11", "soft", `${words} words in one text box; split the slide or cut`, el.id);
    }
    if (el.type === "image" && !/^(https:|data:|\/)/.test(el.src))
      push("H8", "hard", "image source is not an https URL", el.id);
    if (el.type === "chart" && el.series.every((s) => s.values.length === 0))
      push("H9", "hard", "chart has no data", el.id);
  }
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = elementBounds(texts[i]);
      const b = elementBounds(texts[j]);
      if (rectsIntersect(a, b)) {
        const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ix > 8 && iy > 8) push("H3", "hard", `text overlaps text ${texts[j].id}`, texts[i].id);
      }
    }
  }
  const lefts = texts.map((t) => Math.round(t.x));
  for (let i = 0; i < lefts.length; i++) {
    for (let j = i + 1; j < lefts.length; j++) {
      const d = Math.abs(lefts[i] - lefts[j]);
      if (d > 0 && d <= 12)
        push(
          "S4",
          "soft",
          `left edge ${lefts[i]} vs ${lefts[j]} on ${texts[j].id}; snap to one axis`,
          texts[i].id
        );
    }
  }
  if (elements.length > o.maxElementsPerSlide)
    push("S12", "soft", `${elements.length} elements on one slide`);
  if (elements.length === 0) push("S13", "soft", "slide is empty");
  const cardArea = canvas.w * canvas.h * 0.03;
  const cards = elements.filter(
    (e) => e.type === "shape" && e.shape === "roundRect" && e.w * e.h >= cardArea
  );
  if (cards.length >= 3) {
    const sizes = new Set(cards.map((c) => `${Math.round(c.w / 10)}x${Math.round(c.h / 10)}`));
    if (sizes.size === 1)
      push(
        "S14",
        "soft",
        `${cards.length} identical rounded cards; prefer hairlines, planes, or one strong contrast`
      );
  }
  if (elements.length >= 3) {
    const u = unionRects(
      elements.filter((e) => e.type !== "shape" || e.fill.type !== "none").map(elementBounds)
    );
    if (u.w < canvas.w * 0.45 && u.h < canvas.h * 0.45)
      push("S15", "soft", "content occupies under a quarter of the slide");
  }
  return out;
}
function lintDeck(snapshot, options = {}) {
  const findings = [];
  for (const slide of snapshot.slides) {
    if (slide.hidden) continue;
    findings.push(...lintSlide(snapshot, slide, options));
  }
  const layouts = snapshot.slides.filter((s) => !s.hidden).map((s) => s.layout ?? "");
  for (let i = 2; i < layouts.length; i++) {
    if (layouts[i] && layouts[i] === layouts[i - 1] && layouts[i] === layouts[i - 2])
      findings.push({
        rule: "S16",
        severity: "soft",
        slideId: snapshot.slides[i].id,
        message: `layout "${layouts[i]}" repeats three times in a row`
      });
  }
  const hard = findings.filter((f) => f.severity === "hard").length;
  return { ok: hard === 0, hard, soft: findings.length - hard, findings };
}

// lib/slides/svg-import.ts
function parseAttrs2(raw) {
  const out = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g;
  let m;
  while (m = re.exec(raw)) {
    if (!m[1]) continue;
    out[m[1]] = decodeEntities(m[2] ?? m[3] ?? "");
  }
  return out;
}
function parseXml(source) {
  const root = { tag: "#root", attrs: {}, children: [], text: "" };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<!\[CDATA\[([\s\S]*?)\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<\/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*>|<([a-zA-Z_:][-a-zA-Z0-9_:.]*)((?:\s+[^<>]*?)?)(\/?)>|([^<]+)/g;
  let m;
  while (m = re.exec(source)) {
    const top = stack[stack.length - 1];
    if (m[0].startsWith("<!--") || m[0].startsWith("<?") || m[0].startsWith("<!DOCTYPE")) continue;
    if (m[1] !== void 0) {
      top.text += m[1];
      top.children.push({ tag: "#text", attrs: {}, children: [], text: m[1] });
      continue;
    }
    if (m[2]) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    if (m[3]) {
      const node = { tag: m[3], attrs: parseAttrs2(m[4] ?? ""), children: [], text: "" };
      top.children.push(node);
      if (!m[5]) stack.push(node);
      continue;
    }
    if (m[6] !== void 0) {
      const text2 = decodeEntities(m[6]);
      top.text += text2;
      top.children.push({ tag: "#text", attrs: {}, children: [], text: text2 });
    }
  }
  return root;
}
function findFirst(node, tag) {
  if (node.tag === tag) return node;
  for (const child of node.children) {
    const hit = findFirst(child, tag);
    if (hit) return hit;
  }
  return null;
}
function walk(node, visit) {
  visit(node);
  for (const child of node.children) walk(child, visit);
}
var num2 = (v, fallback = 0) => {
  if (v === void 0) return fallback;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};
function styleOf(node) {
  const out = {};
  for (const decl of (node.attrs.style ?? "").split(";")) {
    const i = decl.indexOf(":");
    if (i > 0) out[decl.slice(0, i).trim()] = decl.slice(i + 1).trim();
  }
  return out;
}
function prop(node, name, inherited) {
  const style = styleOf(node);
  return style[name] ?? node.attrs[name] ?? inherited?.[name];
}
function parseTransform(value) {
  const t = { tx: 0, ty: 0, rotation: 0, sx: 1, sy: 1 };
  if (!value) return t;
  const re = /(translate|rotate|scale)\s*\(([^)]*)\)/g;
  let m;
  while (m = re.exec(value)) {
    const args = m[2].split(/[\s,]+/).filter(Boolean).map(Number);
    if (m[1] === "translate") {
      t.tx += args[0] ?? 0;
      t.ty += args[1] ?? 0;
    } else if (m[1] === "rotate") {
      t.rotation += args[0] ?? 0;
      if (args.length >= 3) {
        t.cx = args[1];
        t.cy = args[2];
      }
    } else if (m[1] === "scale") {
      t.sx *= args[0] ?? 1;
      t.sy *= args[1] ?? args[0] ?? 1;
    }
  }
  return t;
}
function withAlpha(color, opacity) {
  const a = opacity === void 0 ? 1 : Math.max(0, Math.min(1, num2(opacity, 1)));
  if (a >= 1) return color;
  const m = /^#([0-9a-f]{6})$/i.exec(color);
  if (!m) return color;
  return `#${m[1]}${Math.round(a * 255).toString(16).padStart(2, "0")}`;
}
var NAMED = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  blue: "#0000ff",
  green: "#008000",
  gray: "#808080",
  grey: "#808080",
  none: "none",
  transparent: "transparent"
};
function normColor(value) {
  if (!value) return void 0;
  const v = value.trim();
  if (NAMED[v.toLowerCase()]) return NAMED[v.toLowerCase()];
  if (/^#[0-9a-f]{3}$/i.test(v)) return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  if (isColor(v)) return v;
  return void 0;
}
function tokenizePath(d) {
  const out = [];
  const re = /([MmLlHhVvCcSsQqTtAaZz])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/g;
  let m;
  let current = null;
  while (m = re.exec(d)) {
    if (m[1]) {
      current = { c: m[1], a: [] };
      out.push(current);
    } else if (current) current.a.push(Number(m[2]));
  }
  return out;
}
var ARITY = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
function absolutePath(d) {
  const out = [];
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  for (const cmd of tokenizePath(d)) {
    const upper = cmd.c.toUpperCase();
    const rel = cmd.c !== upper;
    const n = ARITY[upper];
    if (n === void 0) continue;
    if (n === 0) {
      out.push({ c: "Z", a: [] });
      x = startX;
      y = startY;
      continue;
    }
    for (let i = 0; i + n <= cmd.a.length || i === 0 && cmd.a.length === 0 && n === 0; i += n) {
      const a = cmd.a.slice(i, i + n);
      if (a.length < n) break;
      let c = upper;
      if (i > 0 && upper === "M") c = "L";
      if (rel) {
        if (c === "H") a[0] += x;
        else if (c === "V") a[0] += y;
        else if (c === "A") {
          a[5] += x;
          a[6] += y;
        } else
          for (let k = 0; k < a.length; k += 2) {
            a[k] += x;
            a[k + 1] += y;
          }
      }
      if (c === "H") {
        x = a[0];
        out.push({ c: "L", a: [x, y] });
      } else if (c === "V") {
        y = a[0];
        out.push({ c: "L", a: [x, y] });
      } else {
        out.push({ c, a });
        x = a[a.length - 2];
        y = a[a.length - 1];
        if (c === "M") {
          startX = x;
          startY = y;
        }
      }
    }
  }
  return out;
}
function pathPoints(cmds) {
  const pts = [];
  for (const cmd of cmds) {
    if (cmd.c === "A") pts.push({ x: cmd.a[5], y: cmd.a[6] });
    else for (let k = 0; k + 1 < cmd.a.length; k += 2) pts.push({ x: cmd.a[k], y: cmd.a[k + 1] });
  }
  return pts;
}
function serializePath(cmds, fx, fy) {
  const f = (n) => String(Math.round(n * 1e4) / 1e4);
  return cmds.map((cmd) => {
    if (cmd.c === "Z") return "Z";
    if (cmd.c === "A") {
      const [rx, ry, rot, large, sweep, x, y] = cmd.a;
      return `A ${f(rx * Math.abs(fx(1) - fx(0)))} ${f(ry * Math.abs(fy(1) - fy(0)))} ${f(rot)} ${large} ${sweep} ${f(fx(x))} ${f(fy(y))}`;
    }
    const parts = [];
    for (let k = 0; k + 1 < cmd.a.length; k += 2)
      parts.push(`${f(fx(cmd.a[k]))} ${f(fy(cmd.a[k + 1]))}`);
    return `${cmd.c} ${parts.join(" ")}`;
  }).join(" ");
}
function importSvgSlide(source, options = {}) {
  const warnings = [];
  const makeId = options.makeId ?? newSlideId;
  const canvasW = options.width ?? SLIDE_CANVAS_WIDTH;
  const canvasH = options.height ?? SLIDE_CANVAS_HEIGHT;
  const root = parseXml(source);
  const svg = findFirst(root, "svg");
  if (!svg) return { elements: [], warnings: ["no <svg> root"] };
  const vb = (svg.attrs.viewBox ?? "").split(/[\s,]+/).map(Number);
  const vbw = vb.length === 4 && vb[2] > 0 ? vb[2] : num2(svg.attrs.width, canvasW) || canvasW;
  const vbh = vb.length === 4 && vb[3] > 0 ? vb[3] : num2(svg.attrs.height, canvasH) || canvasH;
  const vbx = vb.length === 4 ? vb[0] : 0;
  const vby = vb.length === 4 ? vb[1] : 0;
  const scale = Math.min(canvasW / vbw, canvasH / vbh);
  const sx = (x) => (x - vbx) * scale;
  const sy = (y) => (y - vby) * scale;
  const sl = (v) => v * scale;
  const gradients = /* @__PURE__ */ new Map();
  walk(svg, (n) => {
    if (n.tag !== "linearGradient" && n.tag !== "radialGradient") return;
    const id = n.attrs.id;
    if (!id) return;
    const stops = n.children.filter((c) => c.tag === "stop").map((c) => {
      const offsetRaw = prop(c, "offset") ?? "0";
      const offset = offsetRaw.endsWith("%") ? num2(offsetRaw) / 100 : num2(offsetRaw);
      const color = normColor(prop(c, "stop-color")) ?? "#000000";
      return {
        offset: Math.max(0, Math.min(1, offset)),
        color: withAlpha(color, prop(c, "stop-opacity"))
      };
    });
    if (stops.length < 2) return;
    let angle = 180;
    if (n.tag === "linearGradient") {
      const p2 = (v, d) => v === void 0 ? d : v.endsWith("%") ? num2(v) / 100 : num2(v);
      const x1 = p2(n.attrs.x1, 0);
      const y1 = p2(n.attrs.y1, 0);
      const x2 = p2(n.attrs.x2, 1);
      const y2 = p2(n.attrs.y2, 0);
      angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI + 90;
    } else warnings.push(`radialGradient #${id} approximated as linear`);
    gradients.set(id, { type: "gradient", angle: Math.round((angle % 360 + 360) % 360), stops });
  });
  const usedIds = /* @__PURE__ */ new Set();
  const idFor = (n, prefix) => {
    const raw = n.attrs.id;
    if (raw && isValidSlideId(raw) && !usedIds.has(raw)) {
      usedIds.add(raw);
      return raw;
    }
    let id = makeId(prefix);
    while (usedIds.has(id)) id = makeId(prefix);
    usedIds.add(id);
    return id;
  };
  const fillOf = (n, inherited) => {
    const raw = prop(n, "fill", inherited);
    if (raw === void 0) return { type: "solid", color: "#000000" };
    if (raw === "none" || raw === "transparent") return { type: "none" };
    const url = /^url\(#([^)]+)\)$/.exec(raw.trim());
    if (url) {
      const g = gradients.get(url[1]);
      if (g) return g;
      warnings.push(`unknown paint reference ${raw}`);
      return { type: "solid", color: "#888888" };
    }
    const color = normColor(raw);
    if (!color) {
      warnings.push(`unsupported fill "${raw}"`);
      return { type: "solid", color: "#888888" };
    }
    return { type: "solid", color: withAlpha(color, prop(n, "fill-opacity", inherited)) };
  };
  const strokeOf = (n, inherited) => {
    const raw = prop(n, "stroke", inherited);
    if (!raw || raw === "none") return void 0;
    const color = normColor(raw);
    if (!color) return void 0;
    const width = sl(num2(prop(n, "stroke-width", inherited), 1));
    const dash = prop(n, "stroke-dasharray", inherited);
    const dashKind = dash && dash !== "none" ? num2(dash.split(/[\s,]+/)[0]) <= width * 1.5 ? "dotted" : "dashed" : void 0;
    return {
      color: withAlpha(color, prop(n, "stroke-opacity", inherited)),
      width: Math.max(0.5, width),
      ...dashKind ? { dash: dashKind } : {}
    };
  };
  const common = (n, t) => ({
    rotation: Math.round((t.rotation % 360 + 360) % 360 * 100) / 100,
    opacity: Math.max(0, Math.min(1, num2(prop(n, "opacity"), 1))),
    ...n.attrs["data-name"] ? { name: n.attrs["data-name"].slice(0, 120) } : {},
    ...n.attrs["data-locked"] !== void 0 ? { locked: true } : {},
    ...n.attrs["data-hidden"] !== void 0 ? { hidden: true } : {}
  });
  const rotatedFrame = (x, y, w, h, t) => {
    let fx = x + t.tx;
    let fy = y + t.ty;
    if (t.rotation && t.cx !== void 0 && t.cy !== void 0) {
      const rad = t.rotation * Math.PI / 180;
      const c = { x: x + w / 2, y: y + h / 2 };
      const dx = c.x - t.cx;
      const dy = c.y - t.cy;
      const nx = t.cx + dx * Math.cos(rad) - dy * Math.sin(rad);
      const ny = t.cy + dx * Math.sin(rad) + dy * Math.cos(rad);
      fx = nx - w / 2 + t.tx;
      fy = ny - h / 2 + t.ty;
    }
    return { x: sx(fx), y: sy(fy), w: sl(w), h: sl(h) };
  };
  const elements = [];
  const convert = (n, inherited, parentT, into) => {
    if (n.tag === "defs" || n.tag === "style" || n.tag === "title" || n.tag === "desc" || n.tag === "metadata")
      return;
    const t = parseTransform(n.attrs.transform);
    const T = {
      tx: parentT.tx + t.tx,
      ty: parentT.ty + t.ty,
      rotation: parentT.rotation + t.rotation,
      cx: t.cx,
      cy: t.cy,
      sx: parentT.sx * t.sx,
      sy: parentT.sy * t.sy
    };
    const inh = { ...inherited };
    for (const key of [
      "fill",
      "stroke",
      "stroke-width",
      "font-family",
      "font-size",
      "font-weight",
      "fill-opacity"
    ]) {
      const v = prop(n, key);
      if (v !== void 0 && n.tag === "g") inh[key] = v;
    }
    if (T.sx !== 1 || T.sy !== 1) warnings.push(`scale() on <${n.tag}> is ignored`);
    switch (n.tag) {
      case "g": {
        if (n.attrs["data-chart"] !== void 0 || n.attrs["data-table"] !== void 0) {
          into.push(dataElement(n, T));
          return;
        }
        if (n.attrs["data-group"] !== void 0) {
          const children = [];
          for (const c of n.children) convert(c, inh, T, children);
          if (children.length === 0) return;
          const groupId = idFor(n, "g");
          for (const c of children) c.groupId = groupId;
          const frame = unionRects(children.map((c) => ({ x: c.x, y: c.y, w: c.w, h: c.h })));
          const group = {
            id: groupId,
            type: "group",
            x: frame.x,
            y: frame.y,
            w: Math.max(1, frame.w),
            h: Math.max(1, frame.h),
            rotation: 0,
            opacity: 1,
            childIds: children.map((c) => c.id),
            ...n.attrs["data-name"] ? { name: n.attrs["data-name"].slice(0, 120) } : {}
          };
          into.push(...children, group);
          return;
        }
        for (const c of n.children) convert(c, inh, T, into);
        return;
      }
      case "rect": {
        const w = num2(n.attrs.width);
        const h = num2(n.attrs.height);
        if (w <= 0 || h <= 0) return;
        const f = rotatedFrame(num2(n.attrs.x), num2(n.attrs.y), w, h, T);
        const rx = num2(n.attrs.rx ?? n.attrs.ry);
        const el = {
          id: idFor(n, "e"),
          type: "shape",
          shape: rx > 0 ? "roundRect" : "rect",
          ...f,
          ...common(n, T),
          fill: fillOf(n, inherited),
          ...rx > 0 ? { radius: sl(rx) } : {}
        };
        const stroke = strokeOf(n, inherited);
        if (stroke) el.stroke = stroke;
        into.push(el);
        return;
      }
      case "circle":
      case "ellipse": {
        const rx = n.tag === "circle" ? num2(n.attrs.r) : num2(n.attrs.rx);
        const ry = n.tag === "circle" ? num2(n.attrs.r) : num2(n.attrs.ry);
        if (rx <= 0 || ry <= 0) return;
        const f = rotatedFrame(num2(n.attrs.cx) - rx, num2(n.attrs.cy) - ry, rx * 2, ry * 2, T);
        const el = {
          id: idFor(n, "e"),
          type: "shape",
          shape: "ellipse",
          ...f,
          ...common(n, T),
          fill: fillOf(n, inherited)
        };
        const stroke = strokeOf(n, inherited);
        if (stroke) el.stroke = stroke;
        into.push(el);
        return;
      }
      case "line": {
        const x1 = num2(n.attrs.x1);
        const y1 = num2(n.attrs.y1);
        const x2 = num2(n.attrs.x2);
        const y2 = num2(n.attrs.y2);
        const box = pointsBounds([
          { x: x1, y: y1 },
          { x: x2, y: y2 }
        ]);
        const w = Math.max(box.w, 1);
        const h = Math.max(box.h, 1);
        const f = rotatedFrame(box.x, box.y, w, h, T);
        const stroke = strokeOf(n, inherited) ?? { color: "#000000", width: sl(1) };
        const arrowEnd = !!n.attrs["marker-end"] || n.attrs["data-arrow"] === "end" || n.attrs["data-arrow"] === "both";
        const arrowStart = !!n.attrs["marker-start"] || n.attrs["data-arrow"] === "start" || n.attrs["data-arrow"] === "both";
        const el = {
          id: idFor(n, "e"),
          type: "shape",
          shape: arrowEnd || arrowStart ? "arrow" : "line",
          ...f,
          ...common(n, T),
          fill: { type: "none" },
          stroke,
          points: {
            x1: (x1 - box.x) / w,
            y1: (y1 - box.y) / h,
            x2: (x2 - box.x) / w,
            y2: (y2 - box.y) / h
          },
          markerStart: arrowStart ? "arrow" : "none",
          markerEnd: arrowEnd ? "arrow" : "none"
        };
        into.push(el);
        return;
      }
      case "polygon":
      case "polyline":
      case "path": {
        let cmds;
        if (n.tag === "path") cmds = absolutePath(n.attrs.d ?? "");
        else {
          const nums = (n.attrs.points ?? "").split(/[\s,]+/).filter(Boolean).map(Number);
          cmds = [];
          for (let k = 0; k + 1 < nums.length; k += 2)
            cmds.push({ c: k === 0 ? "M" : "L", a: [nums[k], nums[k + 1]] });
          if (n.tag === "polygon" && cmds.length) cmds.push({ c: "Z", a: [] });
        }
        const pts = pathPoints(cmds);
        if (pts.length < 2) return;
        const box = pointsBounds(pts);
        const w = Math.max(box.w, 1);
        const h = Math.max(box.h, 1);
        const f = rotatedFrame(box.x, box.y, w, h, T);
        const preset = n.attrs["data-shape"];
        const el = {
          id: idFor(n, "e"),
          type: "shape",
          shape: "path",
          ...f,
          ...common(n, T),
          fill: n.tag === "polyline" ? { type: "none" } : fillOf(n, inherited),
          path: serializePath(
            cmds,
            (x) => (x - box.x) / w,
            (y) => (y - box.y) / h
          )
        };
        if (preset && [
          "triangle",
          "rightTriangle",
          "diamond",
          "pentagon",
          "hexagon",
          "star",
          "arrowRight",
          "chevron"
        ].includes(preset)) {
          el.shape = preset;
          el.path = void 0;
        }
        const stroke = strokeOf(n, inherited);
        if (stroke) el.stroke = stroke;
        into.push(el);
        return;
      }
      case "image": {
        const href = n.attrs.href ?? n.attrs["xlink:href"] ?? "";
        const w = num2(n.attrs.width);
        const h = num2(n.attrs.height);
        if (w <= 0 || h <= 0) return;
        if (!isSafeImageSrc(href)) {
          warnings.push(`image ${href.slice(0, 60)} skipped: not an https/data/brand source`);
          return;
        }
        const par = n.attrs.preserveAspectRatio ?? "xMidYMid meet";
        const f = rotatedFrame(num2(n.attrs.x), num2(n.attrs.y), w, h, T);
        const el = {
          id: idFor(n, "e"),
          type: "image",
          ...f,
          ...common(n, T),
          src: href,
          fit: par === "none" ? "fill" : par.includes("slice") ? "cover" : "contain",
          ...n.attrs["data-alt"] ? { alt: n.attrs["data-alt"] } : {},
          ...num2(n.attrs.rx) > 0 ? { radius: sl(num2(n.attrs.rx)) } : {}
        };
        into.push(el);
        return;
      }
      case "text": {
        into.push(textElement(n, inh, T));
        return;
      }
      case "foreignObject":
        if (n.attrs["data-chart"] !== void 0 || n.attrs["data-table"] !== void 0) {
          into.push(dataElement(n, T));
          return;
        }
        warnings.push("<foreignObject> without data-chart/data-table is ignored");
        return;
      case "use":
      case "clipPath":
      case "mask":
      case "filter":
      case "pattern":
      case "symbol":
        warnings.push(`<${n.tag}> is not supported and was ignored`);
        return;
      default:
        return;
    }
  };
  const dataElement = (n, T) => {
    const box = (n.attrs["data-box"] ?? `${n.attrs.x ?? 0} ${n.attrs.y ?? 0} ${n.attrs.width ?? 800} ${n.attrs.height ?? 450}`).split(/[\s,]+/).map(Number);
    const f = rotatedFrame(
      box[0] || 0,
      box[1] || 0,
      Math.max(1, box[2] || 800),
      Math.max(1, box[3] || 450),
      T
    );
    let spec = {};
    try {
      spec = JSON.parse(n.attrs["data-chart"] ?? n.attrs["data-table"] ?? "{}");
    } catch {
      warnings.push(
        `data-${n.attrs["data-chart"] !== void 0 ? "chart" : "table"} on ${n.attrs.id ?? n.tag} is not valid JSON`
      );
    }
    if (n.attrs["data-chart"] !== void 0) {
      const chartType = SLIDE_CHART_TYPES.includes(spec.chartType) ? spec.chartType : "column";
      return createChartElement(idFor(n, "e"), {
        ...f,
        ...common(n, T),
        ...spec,
        chartType
      });
    }
    return createTableElement(idFor(n, "e"), {
      ...f,
      ...common(n, T),
      ...spec
    });
  };
  const textElement = (n, inh, T) => {
    const fontSize = sl(num2(prop(n, "font-size", inh), 32));
    const color = normColor(prop(n, "fill", inh)) ?? options.textColor ?? "#1A1A1A";
    const weight = prop(n, "font-weight", inh);
    const fontWeight = weight === "bold" ? 700 : weight ? num2(weight, 400) : 400;
    const anchor = prop(n, "text-anchor", inh) ?? "start";
    const align = anchor === "middle" ? "center" : anchor === "end" ? "right" : "left";
    const family = prop(n, "font-family", inh);
    const lineHeight = num2(n.attrs["data-line-height"], 1.25);
    const blocks = [];
    let current = [];
    const flush = () => {
      blocks.push({ type: "paragraph", runs: current, ...align !== "left" ? { align } : {} });
      current = [];
    };
    const visit = (node, marks) => {
      const collect = (text2) => {
        const clean = text2.replace(/\s+/g, " ");
        if (clean.trim() || current.length) current.push({ text: clean, ...marks });
      };
      for (const child of node.children) {
        if (child.tag === "#text") {
          collect(child.text);
          continue;
        }
        if (child.tag !== "tspan") continue;
        const startsLine = child.attrs.x !== void 0 || child.attrs.dy !== void 0 || child.attrs["data-line"] !== void 0;
        if (startsLine && (current.length || blocks.length)) flush();
        const cw = prop(child, "font-weight");
        const cf = normColor(prop(child, "fill"));
        const csz = prop(child, "font-size");
        const cm = {
          ...marks,
          ...cw === "bold" || cw && num2(cw) >= 600 ? { bold: true } : {},
          ...prop(child, "font-style") === "italic" ? { italic: true } : {},
          ...cf && cf !== color ? { color: cf } : {},
          ...csz && Math.abs(sl(num2(csz)) - fontSize) > 0.5 ? { fontSize: sl(num2(csz)) } : {}
        };
        visit(child, cm);
      }
    };
    visit(n, {});
    if (current.length || blocks.length === 0) flush();
    const html = richTextToHtml({ blocks });
    let frame;
    const box = n.attrs["data-box"]?.split(/[\s,]+/).map(Number);
    if (box && box.length === 4 && box[2] > 0 && box[3] > 0) {
      frame = rotatedFrame(box[0], box[1], box[2], box[3], T);
    } else {
      const lines = blocks.map((b) => b.runs.map((r) => r.text).join(""));
      const est = (line) => {
        let w2 = 0;
        for (const ch of line) w2 += /[　-鿿]/.test(ch) ? 1 : 0.55;
        return w2 * (fontSize / scale);
      };
      const widest = Math.max(1, ...lines.map(est));
      const localFont = fontSize / scale;
      const w = widest * 1.05 + 4;
      const h = Math.max(1, lines.length) * localFont * lineHeight;
      const x0 = num2(n.attrs.x);
      const y0 = num2(n.attrs.y) - localFont * 0.9;
      const x = anchor === "middle" ? x0 - w / 2 : anchor === "end" ? x0 - w : x0;
      frame = rotatedFrame(x, y0, w, h, T);
    }
    return {
      id: idFor(n, "e"),
      type: "text",
      ...frame,
      ...common(n, T),
      html,
      fontSize: Math.max(4, Math.round(fontSize * 100) / 100),
      color,
      align,
      valign: n.attrs["data-valign"] ?? "top",
      lineHeight,
      ...fontWeight !== 400 ? { fontWeight } : {},
      ...family ? { fontFamily: family.replace(/"/g, "'") } : {}
    };
  };
  for (const child of svg.children)
    convert(child, {}, { tx: 0, ty: 0, rotation: 0, sx: 1, sy: 1 }, elements);
  return { elements, warnings };
}

// lib/slides/export-targets.ts
var NATIVE_SHAPES = {
  rect: "rect",
  roundRect: "roundRect",
  ellipse: "ellipse",
  triangle: "triangle",
  rightTriangle: "rtTriangle",
  diamond: "diamond",
  pentagon: "pentagon",
  hexagon: "hexagon",
  star: "star5",
  arrowRight: "rightArrow",
  chevron: "chevron"
};
function rasterTargets(snapshot) {
  const out = [];
  for (const slide of snapshot.slides) {
    if (slide.hidden) continue;
    if (slide.background?.type === "gradient") {
      out.push({
        key: `bg-${slide.id}`,
        element: {
          id: `bg-${slide.id}`,
          type: "shape",
          shape: "rect",
          x: 0,
          y: 0,
          w: snapshot.meta.width,
          h: snapshot.meta.height,
          rotation: 0,
          opacity: 1,
          fill: slide.background
        }
      });
    }
    for (const el of snapshot.elements[slide.id] ?? []) {
      if (el.hidden) continue;
      if (el.type === "shape" && shapeNeedsRaster(el)) out.push({ key: el.id, element: el });
      if (el.type === "chart" && el.chartType === "scatter") out.push({ key: el.id, element: el });
    }
  }
  return out;
}
function shapeNeedsRaster(el) {
  if (el.shape === "line" || el.shape === "arrow") return false;
  return !NATIVE_SHAPES[el.shape] || el.fill.type === "gradient" || el.fill.type === "image" || !!el.shadow;
}
export {
  CHART_SERIES_PALETTE_KEYS,
  DECK_OP_NAMES,
  DECK_THEME_PRESETS,
  DEFAULT_DECK_THEME,
  DEFAULT_SLIDE_CANVAS_SOURCE,
  DOKKI_EDITORIAL_THEME,
  EDITORIAL_LAYOUTS,
  GRID,
  SLIDE_CANVAS_DATA_ID,
  SLIDE_CANVAS_HEIGHT,
  SLIDE_CANVAS_MARKER,
  SLIDE_CANVAS_WIDTH,
  SLIDE_CHART_TYPES,
  SLIDE_DECK_SCHEMA_VERSION,
  SLIDE_ELEMENT_ATTR,
  SLIDE_ELEMENT_TYPES,
  SLIDE_ID_PATTERN,
  SLIDE_LAYOUTS,
  SLIDE_MAX_ELEMENTS_PER_SLIDE,
  SLIDE_MAX_SLIDES,
  SLIDE_RICH_TEXT_CSS,
  SLIDE_SHAPE_KINDS,
  SlideModelError,
  TYPE,
  alignElements,
  applyDeckOpToSnapshot,
  applyDeckOpsToSnapshot,
  buildLayoutElements,
  chartSeriesColor,
  clamp,
  contrastRatio,
  createChartElement,
  createDeckMeta,
  createDefaultDeck,
  createGroupElement,
  createImageElement,
  createShapeElement,
  createSlide,
  createTableElement,
  createTextElement,
  decodeEntities,
  distributeElements,
  duplicateSlideOps,
  elementBounds,
  elementFrameStyle,
  elementLabel,
  elementRect,
  encodeDeckForSource,
  escapeHtml,
  estimateTextHeight,
  extractDeckFromSource,
  fillToCss,
  findLayout,
  findThemePreset,
  importSvgSlide,
  isColor,
  isSafeImageSrc,
  isSlideCanvasSource,
  isValidSlideId,
  lintDeck,
  lintSlide,
  mix,
  newSlideId,
  parseRichText,
  parseXml,
  patchElement,
  plainTextToRichHtml,
  pointInRect,
  pointsBounds,
  rasterTargets,
  rectCenter,
  rectContains,
  rectsIntersect,
  renderChartSvg,
  renderDeckHtml,
  renderElementHtml,
  renderElementInner,
  renderSlideInnerHtml,
  resolveZIndex,
  richTextIsEmpty,
  richTextToHtml,
  richTextToPlain,
  rotatedCorners,
  round,
  sanitizeRichHtml,
  selectionClosure,
  shadowToCss,
  shapeNeedsRaster,
  shapeUnitPolygon,
  slideBackgroundCss,
  snapRect,
  unionRects,
  validateDeckMeta,
  validateDeckSnapshot,
  validateElement,
  validateSlide,
  validateTheme
};
