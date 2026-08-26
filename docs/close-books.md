<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Close the Books

**Run your month-end close from chat — start the period, clear what's blocking it, and get it ready to lock, without leaving the conversation.**

## What it does

Tell your AI assistant to close last month and it drives Well's month-end close for you: it starts the close for the month you name, reads what Well says is still blocking it — uncategorized spend, a payment with no supplier invoice, an unreconciled bank line, an open task — and works through them one at a time, checking the real state after each fix rather than trusting what it did a moment ago. Well computes readiness and every fiscal figure server-side; the skill never guesses whether the books are ready.

It takes the close right up to the finish line — a prepared close package and an approval waiting for you — and then hands the last step back to you. Locking a period is a one-click approval you give inside the Well app, on purpose: Well requires a person to lock the books, so the assistant prepares everything and you press the button. Once you have, it reads the receipt back to confirm the period is closed.

It only advances on what's ready. The bank feed is the one connection the close blocks on — if it isn't connected or synced, it says so and points you at what to connect; an accounting connection is optional and just makes the close richer, so it never holds the close up.

## Required data in Well

- **A Well workspace** — the close runs inside it.
- **Bank connected and synced** — the close reads settled bank transactions, so the bank feed must be connected and recently synced; it is the one connection the close blocks on. An accounting connection is optional — it makes the close richer but never gates the close.
- **The workspace's own company set** — Well refuses to start a close until it knows which company is yours. The skill resolves it, and can set it on your explicit confirmation if it isn't set yet.
- **A month that has already ended** — a close runs on a complete month, never the current or a future one.

## Composes onto

This skill delegates six setup steps to Well's atomic skills rather than repeating them:

- **[`define-workspace`](define-workspace.md)** — pins which Well workspace the close runs in.
- **[`resolve-own-company`](resolve-own-company.md)** — resolves which company is yours, which the close requires before it will start, and sets it on your explicit confirmation when it isn't set yet.
- **[`connect-bank`](connect-bank.md)** — gets the bank feed connected and syncing; a missing or unsynced bank is the one connection the close treats as a blocker.
- **[`connect-tools`](connect-tools.md)** — connects the accounting side for a richer close; the close never blocks on a missing accounting tool.
- **[`accounting-settings`](accounting-settings.md)** — sets the fiscal year start month the close derives its period from, when it's unset or wrong.
- **[`define-period`](define-period.md)** — collects the calendar month the close runs on.

Install all six alongside this one. The skill still runs without them — each step falls back inline — but with them installed you get one consistent workspace flow across every Well skill. The **Claude Code plugin** and **Codex plugin** paths below install all seven together; if you download the `.skill` file on its own, grab those six as well.

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
    a. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/close-books/SKILL.md
    b. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/define-workspace/SKILL.md
    c. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/resolve-own-company/SKILL.md
    d. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/connect-bank/SKILL.md
    e. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/connect-tools/SKILL.md
    f. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/accounting-settings/SKILL.md
    g. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/define-period/SKILL.md
2. Download and display these files to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install these skills.
4. Before replying to the user, ensure you have named the downloaded files "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/close-books.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/close-books.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill close-books
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
