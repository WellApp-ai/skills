<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Company profile

**One look at a company tells you what it is to you, what is open, and what comes next.**

## What it does

Prepping a renewal, a payment or a call? Well gathers what it knows about one company from your records, your connected tools and public registers, checks it for wrong or duplicate data, and shows a short brief with its sources: who they are, what they are to you, money and promises open, and the next step.

## Required data in Well

- **A seat in the Well workspace** (required). Without a workspace, Well can read the public register only.
- **Invoicing, bank or accounting connector** (recommended). The money lines come from it.

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

### Claude Desktop

[⬇ Install company-profile](https://github.com/WellApp-ai/skills/raw/main/dist/company-profile.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

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
