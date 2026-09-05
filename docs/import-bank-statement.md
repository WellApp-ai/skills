<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Import a Bank Statement

**Turn a bank statement file into real, promoted transactions in Well — no bank connector required.**

## What it does

Not every bank feed syncs automatically, and sometimes the fastest way to get transactions into Well is the file you already have — a CSV export, or a PDF or scanned statement straight from your bank's website. Drop it into the conversation and this skill gets it into Well through the same import pipeline (detection, dedup, promotion) an in-app upload runs, without a bank connector: bytes for a PDF or image, verbatim text for a CSV/XML/TXT, or a plain upload link when neither fits. It reports back what landed — matched, pending review, newly imported, already present — plus a fidelity check on what it relayed, so a corrupted or mangled upload never passes as a clean one.

OFX, QIF, and MT940 exports are not supported yet — this skill says so rather than trying the upload and letting it fail opaquely.

## Required data in Well

- **A resolved workspace** — the skill pins one itself at the start of its workflow (the workspace-resolution step is compiled into it); with several workspaces it asks which one to use.
- **No bank, accounting, or invoicing connector required.** The statement file itself is the data source. Connecting a bank (`connect-bank`) is a separate, complementary step for an ongoing automatic feed — not a prerequisite for this one-off import.

---

## Installation

### AI Assisted (Recommended)

Paste this into any AI agent — Claude, Codex, Cursor, OpenCode, and others:

> [!NOTE]
> We suggest using **Claude Chat** rather than Claude Cowork for this step — Cowork's approach is noticeably slower and pricier for a quick install like this. Any Claude model works fine.

```
Install the following official skill from Well.

**Instructions**:

1. Fetch this file: 
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/import-bank-statement/SKILL.md
2. Download and display this file to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install this skill.
4. Before replying to the user, ensure you have named the downloaded file "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/import-bank-statement.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/import-bank-statement.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill import-bank-statement
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
