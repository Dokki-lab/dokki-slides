# Dokki Editorial Grid

Dokki decks are editorial narratives, not miniature dashboards. The house style combines a strict Swiss grid with Dokki Fusion: quiet paper, decisive black type, one signal-red accent, visible structure, and generous whitespace.

## 1. Lock the communication contract

Before composing slides, write a short contract:

- Audience: who decides or acts after the presentation?
- Intent: inform, align, persuade, decide, or teach?
- Outcome: what should the audience believe or do?
- Evidence: which claims have sources, and which values are illustrative?
- Length: target slide count and speaking time.

Then propose up to three coherent directions. A direction names the narrative angle, layout behavior, image strategy, and emotional tone—not merely a palette. Select one and keep it locked for the deck.

## 2. Build the narrative before the canvas

Use this arc unless the source demands another:

1. Hook — the promise or tension.
2. Context — why the current state fails.
3. Core — the evidence, model, or proposal.
4. Shift — what changes and how.
5. Takeaway — the decision or next move.

Give every slide one `intent` and exactly one element marked `primary: true`. Write claim titles rather than topic labels. Put citations and talk tracks in notes.

## 3. Use the Dokki palette by role

For `theme.style: "dokki-editorial"`, use these exact tokens:

| Role | Hex | Use |
| --- | --- | --- |
| Canvas | `F7F8F5` | Default slide background |
| Paper | `FFFFFF` | Inset planes and tables |
| Ink | `1A1A1A` | Primary type and structure |
| Muted | `666666` | Secondary copy and metadata |
| Signal | `F50132` | One focal point or state change |
| Line | `D6D7D2` | Hairlines and quiet separation |
| Dark | `050706` | High-contrast fields |
| On signal | `FFFFFF` | Type on signal red |

Do not add gradients, glow, glass, drop shadows, purple, or blue. Do not distribute signal red across every object. Neutral tints and additional chart colors require explicit semantic meaning.

## 4. Typography is structural

- Use Aptos for portable Latin text and PingFang SC or Microsoft YaHei for Chinese.
- Display and KPI text: 50–72 pt, weight 200–400, tight tracking.
- Slide title: 35–52 pt, weight 400–600.
- Lead/subtitle: at least 24 pt.
- Body: at least 18 pt.
- Labels/captions: at least 16 pt; metadata/footnotes: at least 14 pt.
- Small labels are heavier (500–600) and may be uppercase. Large text is lighter.
- Stack kicker and title vertically. Never shrink copy to rescue a crowded layout; edit or split the slide.

## 5. Compose with evidence, not decoration

- Use images as evidence, atmosphere, or spatial anchors; decide their role before sourcing them.
- Preserve image aspect ratio and a quiet zone for overlaid type.
- Use native text, shapes, charts, and tables when they should remain editable.
- Prefer hairlines, flat planes, and one strong scale contrast over rounded cards.
- A chart must express real quantitative structure. Do not invent metrics to fill a data layout.
- Do not use three or more generic rounded cards on a slide.

Read [the layout system](layouts.md) to choose and compose a named silhouette. Before delivery, follow [the rendered quality review](quality.md).
