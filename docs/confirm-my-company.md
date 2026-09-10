<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Confirm your company

**Set the identity that tells your invoices from everyone else's.**

## What it does

Every "who owes us money" and "what do we owe" answer rests on one pointer: which company in your workspace is your own legal entity. Get it wrong and the answer doesn't look broken — it looks fine and is exactly backwards, with your bills reported as your revenue.

This skill resolves that pointer properly. It reads the own-company setting on your workspace, and when that setting is missing, empty, or points at more than one company, it asks you instead of guessing. When you — or a flow like the month-end close — ask it to, it also *sets* your company permanently on your explicit confirmation, so you're not re-asked every run (a workspace owner or admin is required for that write). It also catches the case where one legal entity has several records in Well — `ACME LTD` and `ACME, LTD`, or a `EI-` prefixed duplicate — and offers to treat them as one identity for the run, so invoices booked under the alias don't silently vanish from your totals.

Other Well skills call this one internally; you rarely need to run it yourself.

## Required data in Well

- **A Well workspace** (required). The company identity is set on the workspace itself.
- **Owner or admin rights** (required). Setting the identity is accounting-critical, so it is never inferred and never taken without your say-so.

## FAQ

**Q: What breaks if this is wrong?**
A: Every payable and receivable flips. Money you are owed reads as money you owe, which makes both your aging and your bills due wrong.

**Q: Why does it fold duplicates?**
A: The same legal entity often arrives more than once from different connectors. Folding them keeps one company's history in one place.

**Q: Can it set this without asking?**
A: No. It is an admin-only write taken only on your explicit confirmation, never guessed from a name that looks close enough.

---

## Installation

The file under `skills/confirm-my-company/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/confirm-my-company/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "confirm-my-company". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill confirm-my-company
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
