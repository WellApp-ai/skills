<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Resolve Own Company

**Work out which company in your Well workspace is *yours* — the one line that decides what you owe from what you're owed.**

## What it does

Every "who owes us money" and "what do we owe" answer rests on one pointer: which company in your workspace is your own legal entity. Get it wrong and the answer doesn't look broken — it looks fine and is exactly backwards, with your bills reported as your revenue.

This skill resolves that pointer properly. It reads the own-company setting on your workspace, and when that setting is missing, empty, or points at more than one company, it asks you instead of guessing. It also catches the case where one legal entity has several records in Well — `ACME LTD` and `ACME, LTD`, or a `EI-` prefixed duplicate — and offers to treat them as one identity for the run, so invoices booked under the alias don't silently vanish from your totals.

Other Well skills call this one internally; you rarely need to run it yourself.

## Required data in Well

- **Any connector that has synced companies** — invoicing, accounting, or bank. Without company records there is nothing to resolve against.
- **The own-company setting on your workspace** — *optional.* If it's set, this skill reads it and doesn't ask. If it isn't, the skill asks you once and uses your answer for that run only. Setting it permanently is done in the Well app; no skill can write it.

## Composes onto

This skill delegates one setup step to a Well atomic skill rather than repeating it:

- **[`define-workspace`](define-workspace.md)** — pins which Well workspace the own company is resolved in.

Install it alongside this one. The skill still runs without it — step 1 falls back to resolving the workspace inline — but with it installed you get one consistent workspace flow across every Well skill. The **Claude Code plugin** and **Codex plugin** paths below install both together; if you download the `.skill` file on its own, grab `define-workspace` as well.

---

## Installation

### AI Assisted (Recommended)

Paste this into any AI agent — Claude, Codex, Cursor, OpenCode, and others:

> [!NOTE]
> We suggest using **Claude Chat** rather than Claude Cowork for this step — Cowork's approach is noticeably slower and pricier for a quick install like this. Any Claude model works fine.

```
Install the following official skills from Well.

**Instructions**:

1. Fetch these files:
    a. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/resolve-own-company/SKILL.md
    b. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/define-workspace/SKILL.md
2. Download and display these files to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install these skills.
4. Before replying to the user, ensure you have named the downloaded files "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/resolve-own-company.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/resolve-own-company.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill resolve-own-company
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
