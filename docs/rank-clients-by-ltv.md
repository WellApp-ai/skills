<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Rank clients by LTV

**Find out who your best customers really are, ranked by what they've actually paid.**

## What it does

Ask your AI assistant to rank your clients by lifetime value, and it pulls the answer straight from your synced invoices — every paid invoice, summed and grouped by customer, sorted from your biggest customer down — with real currency amounts and an as-of date attached, not a guess. To be upfront: this is a ranking of realized revenue paid to date, not a predictive model of future customer value (there's no churn or retention data behind it) — but it answers "who's paid us the most so far" honestly and reliably.

## Required data in Well

- **Invoicing / accounting connector** (required). This is where your issued customer invoices and their payment status come from.
- **Company profile confirmed in Well** (required). The skill needs to know which company is yours so it can tell your issued (customer-facing) invoices apart from bills you have received.

## FAQ

**Q: Is this really lifetime value?**
A: It is realized revenue to date, which is the honest version of the question. A true LTV model needs churn and retention data that invoices alone cannot provide.

**Q: Does it count unpaid invoices?**
A: No. Only invoices actually paid count toward the ranking, so the order reflects cash received rather than cash promised.

**Q: Can it rank by something else?**
A: Yes. Ask for a specific window, a currency, or a segment and the ranking recomputes.

---

## Installation

The file under `skills/rank-clients-by-ltv/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/rank-clients-by-ltv/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "rank-clients-by-ltv". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill rank-clients-by-ltv
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
