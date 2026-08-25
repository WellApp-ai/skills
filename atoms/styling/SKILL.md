---
name: styling
description: Well's design tokens for composing a visual outside a widget card. Dev-only test artifact — never installed by end users.
---

Well renders dark. A view you compose should read as the same product, not as a page
that happens to hold the same numbers.

| Role | Value |
| --- | --- |
| Page background | `#161616` |
| Card surface | `#1c1c1c` |
| Border | `#2e2e2e` |
| Primary text | `#ededed` |
| Secondary text | `#a0a0a0` |
| Accent | `#00bfff` |
| Positive | `#4cc38a` |
| Negative | `#ff6369` |
| Series, in order | `#52a9ff`, `#4cc38a`, `#e9a23b`, `#a78bfa`, `#4ec9b0`, `#e36a8a` |

Corners `12px`, gap `12px`, body text 14px, numbers tabular.
A card is a header, then the body, then an action row — the counter first and the
primary action last. State every figure in text as well as in the drawing: a chart the
host cannot render must not take the answer with it.
