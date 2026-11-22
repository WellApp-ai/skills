<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Payroll question

**Ask about payroll and get the cost or the pay, from your payslips.**

## What it does

A question about payroll has two sides. The first is the cost: what an employee or the whole payroll costs the company, employer charges included. The second is the pay itself: gross, net, what was withheld and who was paid what.

Well reads your question, picks the side it asks about, and answers from the payslips it holds for the months you name. It files nothing and pays nothing.

## Required data in Well

- **Payslips in Well** (required). Both readings come from the payslips Well holds. Without them there is nothing to read.

## FAQ

**Q: Which reading do I get?**
A: A question about cost, for a person or the team, gets the cost reading. A question about gross, net, what was withheld or who was paid what gets the pay reading.

---

## Installation

The file under `skills/payroll-question/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install payroll-question](https://github.com/WellApp-ai/skills/raw/main/dist/payroll-question.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/payroll-question/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "payroll-question". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill payroll-question
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
