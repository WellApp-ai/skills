<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Accounting Settings

**Set the accounting settings that decide how Well files your books — the fiscal year start month above all.**

## What it does

Well derives every fiscal period from one durable setting: the month your fiscal year starts. Leave
it unset and Well assumes January; set it wrong and every close is filed against the wrong period,
silently. This skill sets it — and the other accounting settings behind it — from what you tell it,
never from a guess.

Ask it to set your fiscal year start ("our accounting year starts in April"), your reporting
currency, your country, your accounting framework, or to confirm your chart of accounts, and it
reads the current value, shows you what you're changing, and writes only what you confirm. Changing
the fiscal year start realigns the whole calendar, so Well refuses it once a period is locked or a
close is in progress, and warns you that the regenerable draft entries on the old coordinates are
discarded — the skill says all of this before it writes.

It sets accounting *configuration* only. It never changes which company your workspace *is* — that's
[`resolve-own-company`](resolve-own-company.md) — and it never picks which month a job works on —
that's [`define-period`](define-period.md).

## Required data in Well

- **A Well workspace** — the settings live on it. You need workspace owner or admin rights to change
  them; the skill reports the refusal plainly if you don't have them.
- **Nothing else to read the current settings** — but to *change* the fiscal year start, no period
  can be locked and no close can be in progress, because moving the start month realigns the fiscal
  calendar. The skill tells you when that's what's blocking the change.

## Composes onto

This skill delegates one setup step to a Well atomic skill rather than repeating it:

- **[`define-workspace`](define-workspace.md)** — pins which Well workspace the settings are written on.

Install it alongside this one. The skill still runs without it — step 1 falls back to resolving the
workspace inline — but with it installed you get one consistent workspace flow across every Well
skill. The **Claude Code plugin** and **Codex plugin** paths below install both together; if you
download the `.skill` file on its own, grab `define-workspace` as well.

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
    a. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/accounting-settings/SKILL.md
    b. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/define-workspace/SKILL.md
2. Download and display these files to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install these skills.
4. Before replying to the user, ensure you have named the downloaded files "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/accounting-settings.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/accounting-settings.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill accounting-settings
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
