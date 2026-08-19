---
name: well-design-system
description: Style any view you compose for Well data — an artifact, an HTML page, a chart, a report — so it looks like Well rather than like a generic page. Use whenever you are about to render Well financial data visually and the host has not already drawn it for you. Supplies the token vocabulary, the card anatomy, and a precompiled stylesheet. Does not fetch data; pair it with whichever skill answers the question.
---

# Style a Well view

## Purpose

Well's own surfaces — the web app, the browser extension, the MCP widget bundle — all render
from one design system. A view you compose yourself should be recognisable as the same
product, not as a page that happens to contain the same numbers.

This skill gives you the vocabulary to do that. It computes nothing and reads no data.

## When to use this skill

Use it when you are about to render Well data visually and nothing else has:

- an artifact, an HTML page, or a standalone report
- a chart or table you are drawing yourself
- any view a `well_*` tool answered in prose, where a visual would read better

## When not to use this skill

- **The host already rendered the tool's own card.** A Well MCP tool that ships a widget
  attaches `_meta.ui.resourceUri` to its result — a versioned `ui://well/widget/<hash>`, so
  test for the **key being present**, never for a particular value. If it is there, a host
  that supports it has drawn the real component, the same code the product ships. Do not
  redraw what is on screen; say what the card cannot, and stop. Composing a second view
  invites two versions of one number.
- The answer is one sentence or one figure. A card around "EUR 412,900" helps nobody.
- The user asked for raw data, a CSV, or a file to paste elsewhere.
- You are editing Well's own codebase. There the design system is a package, not a
  stylesheet, and the repository's own standards govern how a surface consumes it.

## Inputs

The data you are rendering, from whichever skill produced it. This skill adds no inputs of
its own.

## Tooling

`assets/well.css`, packaged alongside this file.

**Do not display or summarise the file** — it is ~116 KB of compiled CSS and tells you
nothing the vocabulary below does not. Move it without reading it: copy the bytes straight
into a `<style>` block with a file read your tooling performs, or `curl -sSfo <path>` it and
link it. Everything else you need to write the markup is on this page.

`assets/well-tokens.css` is a **smaller** palette as plain custom properties, for a surface
that cannot use utility classes and must write inline styles. It is the widget bundle's own
mirror, so the names differ and the coverage is narrower — do not assume a utility class has
a matching property:

| Utility | Custom property |
|---|---|
| `bg-surface-level-0` | `--well-bg` |
| `bg-surface-level-1` | `--well-bg-subtle` |
| `bg-surface-level-2` | `--well-bg-raised` |
| `text-text-primary` / `-secondary` / `-tertiary` | `--well-text` / `--well-text-2` / `--well-text-3` |
| `border-border-low` | `--well-border` |
| `text-text-success` / `-warning` / `-danger` / `-info` | `--well-success` / `--well-warning` / `--well-danger` / `--well-info` |

Three gaps to write around on that path: there is **no 14px radius token** (use a literal
`14px`; `--well-radius` is 12px), the categorical ramp stops at `--well-cat-6` plus
`--well-cat-other`, and there are **no `-fg` foreground properties** at all.

`well.css` does **not** set `color-scheme`, so put `style="color-scheme: dark"` on your root
element or the browser paints scrollbars and form controls light on a dark page.

If either asset is missing — some install paths copy only this file — fetch it from
`https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/well-design-system/assets/well.css`, and the custom properties from
`https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/well-design-system/assets/well-tokens.css`.

## The vocabulary

The system is **dark**. Surfaces are near-black, text is near-white, and colour carries
meaning rather than decoration.

**Surfaces** — the page is `bg-surface-level-0`; each nested layer steps up:

| Class | Use |
|---|---|
| `bg-surface-level-0` | the page itself |
| `bg-surface-level-1` | a panel resting on the page |
| `bg-surface-level-2` | something raised above a panel |
| `bg-bg-subtle` | a card's translucent wash |

**Text** — contrast descends with importance: `text-text-primary` for the figure that
matters, `text-text-secondary` for labels, `text-text-tertiary` for captions and units.

**Meaning** — `text-text-success`, `text-text-warning`, `text-text-danger`, `text-text-info`.
Use them for what a number *means* — a negative runway, a stale sync — never to brighten a
layout. Each has a matching `bg-bg-*` wash for a chip or a banner.

**Borders** — `border-border-low` separates; `border-border-strong` emphasises. A card
carries `border` plus `border-border-low`, nothing heavier.

**Categorical** — for series that differ without ranking (spend by category, one colour per
vendor), use `bg-cat-1` … `bg-cat-8` in order, with `text-cat-N-fg` on top. Never reach for
a semantic colour to distinguish two neutral categories.

Those `bg-cat-*` values are low-alpha washes, sized for a chip or a table row. The saturated
hue lives only on `text-cat-N-fg`, and there is no `fill-cat-*`. For SVG geometry — a donut,
a bar — put `text-cat-N-fg` on the node and draw with `fill="currentColor"`, or the shape
renders almost invisible.

**Type** — `text-xs` `text-sm` `text-md` `text-lg` `text-xl` `text-2xl` `text-3xl`.
`text-xl` and above carry their own weight, so do not add `font-bold` to those. Below that
the tiers set no weight at all — a `text-sm` card title needs an explicit `font-medium`.

**Depth inside a card.** The card itself is recessed — `bg-bg-subtle` is a translucent
wash. Anything listed inside it sits *lifted*: a row or a tile takes `bg-surface-level-2`
with `border-border-low/50`. Most of what these skills return is a list, and a flat one
reads as prose with lines between it rather than as a Well card.

**Do not** write a hex value, a raw Tailwind palette class (`bg-blue-500`), or an inline
`font-size`. If a token seems missing, the nearest one is almost always right.

## The card anatomy

Well presents a result as a card, and every card has the same three parts:

```html
<!-- The card is a translucent wash, so it needs a dark ancestor and an explicit
     colour-scheme; on a default white artifact page it renders unreadable. -->
<div class="bg-surface-level-0 p-4" style="color-scheme: dark">
  <div class="flex flex-col overflow-hidden rounded-[14px] border border-border-low/50 bg-bg-subtle">
    <div class="flex items-center justify-between border-b border-border-low/50 px-4 pt-4 pb-3">
      <div class="flex flex-col gap-0.5">
        <h3 class="text-sm font-medium text-text-primary">Runway</h3>
        <div class="text-xs text-text-tertiary">as of 12 Aug 2026</div>
      </div>
      <span class="rounded-md bg-bg-warning px-2 py-1 text-xs text-text-warning">Partial</span>
    </div>

    <div class="flex flex-col gap-1 px-4 py-3">
      <div class="text-3xl text-text-primary">7 months 12 days</div>
      <div class="text-sm text-text-secondary">EUR 412,900 cash · EUR 55,300/mo burn</div>
    </div>

    <div class="flex items-center gap-3 border-t border-border-low/50 px-4 pt-3 pb-4">
      <span class="text-xs text-text-tertiary">3 accounts</span>
      <button class="ml-auto rounded-[10px] bg-bg-highlight px-3 py-1.5 text-sm font-medium text-text-primary">View details</button>
      <button class="rounded-[10px] bg-bg-primary px-3 py-1.5 text-sm font-medium text-text-invert">Open in Well</button>
    </div>
  </div>
</div>
```

Three rules that matter more than the markup:

1. **`rounded-[14px]` is the card radius.** Not `rounded-lg`, not `rounded-xl`.
2. **The header's trailing slot carries status, never a decision.** A badge belongs there;
   a button does not. The product keeps actions in the footer for the same reason.
3. **The footer reads counter, then secondary, then primary** — left to right, with the
   primary hard against the trailing edge. The product also opens that row with an overflow
   menu; a static view has no menu to open, so this omits it deliberately.

## Output requirements

The view you compose must:

- state the figure that answers the question as the largest thing on the card
- keep its provenance — the as-of date, the window, what was excluded — visible rather than
  dropped for tidiness
- use a semantic colour only where the data carries that meaning
- render legibly at ~420px wide, the width a chat surface gives you

## Quality checks

Before returning the view, verify:

- The card sits on a `bg-surface-level-0` ancestor and the root carries
  `color-scheme: dark`. `bg-bg-subtle` is a translucent wash, not an opaque surface — on a
  light page the headline figure disappears.
- No hex value, no raw Tailwind palette class, no inline `font-size` anywhere in the markup.
- The stylesheet was moved without being displayed or summarised.
- Cards use `rounded-[14px]`, `bg-bg-subtle`, and a single `border-border-low`.
- Every caveat the tool surfaced — `partial`, `excluded`, `hints`, staleness — appears in
  the view. A card that renders a partial number as a clean one is worse than prose.
- You did not redraw something the host already rendered from the tool's own UI resource.

## Examples

### Example request

"Show me our runway as a card I can drop into the board deck."

### Expected behavior

Get the figures through `runway-calculator`, then compose one card: the months-and-days
headline in `text-3xl text-text-primary`, cash and burn beneath it in `text-text-secondary`,
the as-of date as a caption, and a `bg-bg-warning` chip if the tool reported `partial`.
Inline `assets/well.css`; do not read it.

### Example request

"What's my runway?" — in a host that rendered the tool's own card.

### Expected behavior

Do not compose anything. The card on screen is the product's own component. Add what it
does not say — which connectors are missing, what the burn window was — in prose, and stop.
