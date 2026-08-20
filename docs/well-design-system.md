<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Well Design System

**Make a view you compose look like Well, not like a generic page.**

## What it does

The other skills answer questions. This one decides how the answer looks when your assistant
draws it rather than describing it — a card for a board deck, an HTML report, a chart.

Well's own surfaces — the web app, the browser extension, the cards that appear inline in
chat — all render from a single design system. Without this skill an assistant inventing its
own layout produces something that holds the right numbers and still looks like it came from
somewhere else. With it, the view carries Well's surfaces, type scale, and card anatomy.

It also says when *not* to draw. If your host already rendered the tool's own card, the
product has drawn it for you, and a second version of the same number helps nobody.

## What ships

Unlike the other skills, this one carries assets: `assets/well.css` (the compiled
stylesheet) and `assets/well-tokens.css` (the same palette as custom properties, for
surfaces that cannot use utility classes). Both are packaged into the `.skill` and `.zip`,
so a download installs a self-contained skill.

They are a copy of what `@wellapp-ai/design-tokens` builds, so they can fall behind it.
`make refresh-check` fails when they have, and a weekly workflow
(`.github/workflows/refresh-design-system.yml`) opens a PR when the published package moves.
That workflow reads GitHub Packages, so it needs a `PACKAGES_READ_TOKEN` repository secret
— a PAT with `read:packages`. Without it the run fails loudly rather than reporting a
current kit it never checked.

## Required data in Well

None. This skill computes nothing and reads nothing — pair it with whichever skill answers
the question.

## Composes onto

Nothing. Every other skill can reach for it once it has an answer to show.

## Installation

### AI Assisted (Recommended)

Paste this into any AI agent — Claude, Codex, Cursor, OpenCode, and others:

> [!NOTE]
> We suggest using **Claude Chat** rather than Claude Cowork for this step — Cowork's approach is noticeably slower and pricier for a quick install like this. Any Claude model works fine.

```
Install the following official skill from Well.

**Instructions**:

1. Fetch the skill file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/well-design-system/SKILL.md
2. Fetch its two stylesheets, which are assets rather than reading material — save them without displaying them:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/well-design-system/assets/well.css
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/well-design-system/assets/well-tokens.css
3. Keep the stylesheets at `assets/well.css` and `assets/well-tokens.css` beside the skill file. The skill file must be named "SKILL.md" — no prefix, no suffix.
4. Install this skill.
5. Before replying to the user, ensure you have named the downloaded file "SKILL.md". This is crucial for the rest of the steps.
6. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/well-design-system.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/well-design-system.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill well-design-system
```

---

[← Back to all skills](../README.md#available-skills)

<p align="center">
  <img src="https://wellapp.ai/images/badges/soc2.avif" alt="SOC 2 Type I" height="40">
  <img src="https://wellapp.ai/images/badges/gdpr.avif" alt="GDPR Compliant" height="40">
</p>

<p align="center">
    <sub><b>Well is SOC-2 Type I and GDPR Compliant</b></sub>
</p>
