<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Bring a connector across

**Bring a connected bank across from the signup workspace instead of connecting it again.**

## What it does

Sign-up mints a membership workspace with no own company; a bank connected there lands its transactions on a workspace that cannot post them. When the close later runs in the company workspace, this skill offers to bring that connector across rather than connect it again: a second connector row is minted here that borrows the original's credentials and syncs from a fresh cursor, so the history follows without moving a single transaction.

It draws a card of the connectors that could follow — each graded by how strongly its account holder was proved to be this company, the strong matches pre-ticked — and brings across only the ones you confirm. Keep for later brings nothing across; the close then asks you to connect a bank instead, and the offer returns on the next close.

## Required data in Well

- **A company Well workspace** (required). The connectors follow the workspace this card is drawn on.
- **Owner or admin rights** (required). Borrowing the parent's credentials is an owner/admin action, and the acting person must also hold a membership on the parent workspace.

## FAQ

**Q: Does this move my transactions?**
A: No. A new connector row is created on this workspace that borrows the original's credentials; the history arrives with its first sync. Nothing is moved off the parent workspace.

**Q: What if I decline?**
A: Keep for later brings nothing across and the close continues to connect a bank. The offer returns on the next close.

---

## Installation

The file under `skills/workspace-data-migration/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install workspace-data-migration](https://github.com/WellApp-ai/skills/raw/main/dist/workspace-data-migration.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/workspace-data-migration/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "workspace-data-migration". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill workspace-data-migration
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
