---
name: styling
description: Well's design tokens for composing a visual outside a widget card. Dev-only test artifact — never installed by end users.
---

Well renders dark. A view you compose should read as the same product, not as a page
that happens to hold the same numbers.

| Role | Value |
| --- | --- |
{{#each roles}}| {{label}} | `{{value}}` |
{{/each}}| Series, in order | {{seriesJoined}} |

Corners `{{radius}}`, gap `{{gap}}`, body text 14px, numbers tabular.
A card is a header, then the body, then an action row — the counter first and the
primary action last. State every figure in text as well as in the drawing: a chart the
host cannot render must not take the answer with it.
