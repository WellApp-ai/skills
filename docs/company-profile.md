<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Company Profile

**Everything you know about one company, in one view.**

## What it does

Whether you're prepping for a call with a customer or double-checking a vendor before you pay them, this skill pulls together everything Well knows about that one company — who they are, how to reach them, and your full invoice history together — into a single answer. No flipping between tabs, no piecing it together by hand.

## Required data in Well

- **Invoicing / bills connector** — *required.* This is where the invoice relationship (what they owe you, what you owe them) comes from.
- **Contact details on the company record** — *optional.* Emails, phones, and addresses show up when they're on file; the skill says so plainly when they're not.
- **A workspace's own company set** — *recommended, not required.* Without it, the skill can still show the raw invoice totals in both directions, it just can't label the company as a "customer" or "vendor" for you.

## Composes onto

This skill delegates four setup steps to Well's atomic skills rather than repeating them:

- **[`define-workspace`](define-workspace.md)** — pins which Well workspace the answer is for.
- **[`connect-tools`](connect-tools.md)** — checks which of your bank / accounting / invoicing sources are connected.
- **[`confirm-my-company`](confirm-my-company.md)** — works out which company in your workspace is yours, so a company is framed as a customer or a vendor rather than guessed.
- **[`normalize-currency`](normalize-currency.md)** — turns amounts in several currencies into one total with its rate and date, so a company's invoice totals are never blended across currencies.

Install all four alongside this one. The skill still runs without them — each step falls back to resolving things inline — but with them installed you get one consistent workspace and connection flow across every Well skill. The **Claude Code plugin** and **Codex plugin** paths below install all five together; if you download the `.skill` file on its own, grab those four as well.

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
    a. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/company-profile/SKILL.md
    b. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/define-workspace/SKILL.md
    c. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/connect-tools/SKILL.md
    d. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/confirm-my-company/SKILL.md
    e. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/normalize-currency/SKILL.md
2. Download and display these files to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install these skills.
4. Before replying to the user, ensure you have named the downloaded files "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/company-profile.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/company-profile.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill company-profile
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
