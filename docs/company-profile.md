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

---

## Installation

### AI Assisted (Recommended)

Paste this into any AI agent — Claude, Codex, Cursor, OpenCode, and others:

> [!NOTE]
> We suggest using **Claude Chat** rather than Claude Cowork for this step — Cowork's approach is noticeably slower and pricier for a quick install like this. Any Claude model works fine.

<!-- NOTE: repo is currently private, so this raw link 404s until WellApp-ai/skills
     goes public. Link is permanent (no token) and will work as-is once it does. -->

```
Install the following official skill from Well.

**Instructions**:

1. Fetch this file: 
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/company-profile/SKILL.md
2. Download and display this file to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install this skill.
4. Before replying to the user, ensure you have named the downloaded file "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/company-profile.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/company-profile.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/company-profile
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
