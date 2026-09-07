<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Connect Accounting

**Get your accounting tool into Well in one click — and know whether it is actually live.**

## What it does

A richer close and a posted-ledger view rest on the accounting feed. This skill reads whether a workspace has an accounting system connected — live and syncing, still running its first pass, or expired and needing a reconnect — and, when it is missing, hands your AI assistant Well's one-click install link (in Claude Desktop, a connect card showing accounting tools only: Pennylane, QuickBooks, Xero, Sage, and the rest). The card is pick-one — a single accounting system, not several. Once it lands it re-checks on its own and moves the flow forward, then reports one plain line: connected, connecting, needs a reconnect, or not connected. It is the dedicated accounting step of Well's close-the-books flow, right after the bank — but the close never blocks on it, so the step is always skippable.

## Required data in Well

- **A resolved workspace** — *required.* Run `define-workspace` first; this skill takes its `workspace_id`.
- **An accounting connector** (Pennylane, QuickBooks, Xero, Sage, and the rest) — *checked, connected here if missing.*
- **Bank and invoicing connectors** — *not read here.* Use `connect-bank` for the bank, `connect-tools` for several kinds at once.

---

## Composes onto

This skill delegates one setup step to a Well atomic skill rather than repeating it:

- **[`define-workspace`](define-workspace.md)** — pins which Well workspace the accounting feed is checked for.

Install it alongside this one. This skill takes its `workspace_id` and does not resolve the workspace itself, so the pair belongs together. The **Claude Code plugin** and **Codex plugin** paths below install both together; if you download the `.skill` file on its own, grab `define-workspace` as well.

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
    a. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/connect-accounting/SKILL.md
    b. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/define-workspace/SKILL.md
2. Download and display these files to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install these skills.
4. Before replying to the user, ensure you have named the downloaded files "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/connect-accounting.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/connect-accounting.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill connect-accounting
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
