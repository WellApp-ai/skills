<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Missing invoice sweep

**Walk the whole month-end sweep in one prompt.**

## What it does

Chasing supplier invoices at month end is seven questions, not one: which entity, which month, is the bank feed actually live, which of that month's vendors carry no industry label, what is actually missing, who owns each gap, and who can go and get the rest. This skill asks them in that order and routes on each answer instead of guessing. It pins the workspace, fixes the month, gets the bank feed in when a month holds no bank transaction, asking for it before the month when the workspace holds no bank transaction at all, offers to label the month's counterparties that carry no industry category, assigns owners to the settled lines still missing an invoice, lists the settled spend that still has no supplier invoice, and finishes by queuing the invoice-fetching agents on your Deploy click. Every stop is named: no workspace, no month, no bank, no gap list, or nothing missing at all. Nothing is queued until you click Deploy. Pick several entities at the workspace step and the whole flow runs once per workspace, in order, with one recap per entity — never a merged view.

It carries the order, not the steps. It runs nine steps, and each one is its own Well skill — `define-workspace`, `define-period`, `connect-bank`, `categorize-counterparties`, `assign-missing-invoices`, `show-missing-invoices`, `connect-tools`, `deploy-agents`, and `invite-members` — which this file runs in a fixed order rather than repeating what they do. Install it on its own and only the workspace step stops the flow: seven steps fall back to an inline copy of the part the order depends on, and the bank step falls back to `connect-tools` scoped to banks. The categorization step runs only when your Well server exposes the counterparty list; without it the flow says so instead of guessing. A caller that has already fixed the workspace, period and scope — the close-books flow — runs this in composed mode, starting at the assign beat.

## Required data in Well

- **Banking connector** (required). The settled spend is what the whole sweep is measured against.
- **Accounting or invoicing connector** (recommended). Lets the sweep match off what you already have, so it chases only the real gaps.

## FAQ

**Q: Does anything run on its own?**
A: No. Every step is a click you make, and the collecting happens in the Well app after you start it there. The conversation never collects anything.

**Q: Can I run just one step?**
A: Yes. Each step is its own skill, so you can ask for the gap list or the categories on their own. This one walks them in order.

**Q: What if a step is already done?**
A: It carries straight through. A workspace you already pinned or a month you already set is not asked for twice.

---

## Installation

The file under `skills/fetch-missing-invoices/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

### Claude Code

```
/plugin marketplace add WellApp-ai/skills
/plugin install well-skills@wellapp
```

### Codex CLI

```bash
codex plugin marketplace add WellApp-ai/skills
codex plugin add well-skills@wellapp
```

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/fetch-missing-invoices/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "fetch-missing-invoices". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill fetch-missing-invoices
```

Whatever the host, the skill needs the Well MCP server at `https://api.wellapp.ai/v1/mcp`. You'll be asked to sign in to Well the first time it needs your data.

---

[← Back to all skills](../README.md#available-skills)

<p align="center">
  <img src="https://wellapp.ai/images/badges/soc2.avif" alt="SOC 2 Type I" height="40">
  <img src="https://wellapp.ai/images/badges/gdpr.avif" alt="GDPR Compliant" height="40">
</p>

<p align="center">
    <sub><b>Well is SOC-2 Type I and GDPR Compliant</b></sub>
</p>
