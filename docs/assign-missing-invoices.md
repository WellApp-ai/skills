<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Assign missing invoices

**Put a name on every settled expense that still has no invoice.**

## What it does

When spend has settled but its supplier invoice is still missing, someone has to own getting it. This skill lists the expense lines that have no invoice for a month, split into what has no owner set yet, what is already yours, and what is owned by others, and lets you assign a set of owners to a line — or to several lines at once — straight from the card. Assignment is per transaction and the owner is a set of people: picking owners on a line replaces its owner set, and each month is assigned fresh. Assigning a vendor's month to several people holds one task per owner, and one supplier invoice resolves every owner's task for that gap. It sorts ownership only — it never fetches or collects the documents, and it never closes the period. Owners are people already in the workspace.

## Required data in Well

- **Banking connector** (required). The settled spend is what makes a line a missing invoice in the first place.
- **Workspace members** (required). Owners are picked from the workspace, so the people you assign must already be members.

## FAQ

**Q: Does it fetch the missing invoices?**
A: No. It sorts out who owns each gap. The fetching is a separate step you start yourself.

**Q: Can one line have several owners?**
A: Yes. Picking owners replaces the whole set on that line, and each owner gets their own task. One invoice resolves them all.

**Q: What happens on a month that is already closed?**
A: The write is refused and the batch is left alone, rather than rewriting a close that is already committed.

---

## Installation

The file under `skills/assign-missing-invoices/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/assign-missing-invoices/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "assign-missing-invoices". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill assign-missing-invoices
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
