<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Company profile

**Everything you know about one company, in one view.**

## What it does

Whether you're prepping for a call with a customer or double-checking a vendor before you pay them, this skill pulls together everything Well knows about that one company — who they are, how to reach them, and your full invoice history together — into a single answer. No flipping between tabs, no piecing it together by hand.

## Required data in Well

- **Invoicing / bills connector** (required). This is where the invoice relationship (what they owe you, what you owe them) comes from.
- **Contact details on the company record** (optional). Emails, phones, and addresses show up when they are on file. The skill says so plainly when they are not.
- **A workspace's own company set** (recommended). Without it, the skill can still show the raw invoice totals in both directions, it just cannot label the company as a customer or vendor for you.

## FAQ

**Q: What if a company is both customer and vendor?**
A: The view shows both directions separately, so you can see what they owe you and what you owe them without the two netting into one confusing number.

**Q: What if contact details are missing?**
A: The skill says which details are not on file rather than leaving a blank that reads as if there is nothing to find.

**Q: Does it need my own company set?**
A: Not strictly. Without it you still get the invoice totals in both directions, it just cannot label the company as customer or vendor for you.

---

## Installation

The file under `skills/company-profile/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/company-profile/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "company-profile". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill company-profile
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
