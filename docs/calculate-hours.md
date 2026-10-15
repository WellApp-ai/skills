<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Calculate Hours

**Send a photo of paper time cards and get hours per person and pay at the rate Well holds, not a payslip.**

## What it does

Paying hourly staff from paper cards means adding up each card by hand and looking up each rate. This skill does both. Send a photo of the cards, or type the hours, and it totals the week for each person.

Each rate comes from Well: the person's hourly contract rate first, and the hourly rate on their latest payslip when there is no contract rate. A rate written on a card or in a note is never used. When Well has no rate the skill can read for a person, it says so and asks for it, and it gives no pay figure for that person.

The skill reads and calculates only. It never writes a payslip and never pays anyone. Check the result against the payslips afterwards with the hours-to-payslip check.

## Required data in Well

- **Hourly rates for your staff** (recommended). A contract rate or a payslip rate for each person on the cards. Without one, the skill asks for the rate and prices nobody.

## FAQ

**Q: Where does the hourly rate come from?**
A: From the person's contract in Well, or from their latest payslip when the contract holds none. A rate written on a card is ignored.

**Q: What if a day on the card is smudged?**
A: It totals the days it can read, asks you one question about the unclear day, and gives no pay figure until you answer.

---

## Installation

The file under `skills/calculate-hours/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install calculate-hours](https://github.com/WellApp-ai/skills/raw/main/dist/calculate-hours.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/calculate-hours/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "calculate-hours". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill calculate-hours
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
