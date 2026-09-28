<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Export to accounting tool

**Send the closed month's journal entries to your connected accounting tool.**

## What it does

Well keeps the ledger of record; this step is how a closed period reaches the accounting tool a workspace actually files under. It reads the connected accounting connector's write grant first, with no post attempted: a tool that cannot receive entries yet is named before any push is offered, never after one fails. When it can, the card lists the period's journal-entry categories, the connector's own state behind each one, and the ones still missing there in red. One Confirm sends every native entry that is not on the connector yet — an entry the connector already holds through its own sync is never resent, and a re-run over an already-sent period reports the count and does nothing more.

A partial failure is never a raw error dump: the step re-reads the connector's state and says in plain words what still has not landed, the same way the close's own blocker list explains a gap, and points at what to try next.

## Required data in Well

- **A closed period from close-books** (required). The export reads a specific close run's native journal entries; it is reached once that run's period is closed, never earlier.
- **Owner or admin rights** (required). Sending entries to the connected accounting tool is an owner/admin action, gated the same way the rest of the close is.
- **A write-capable accounting connector** (recommended). Without one, or with one whose grant cannot post yet, the step says so and changes nothing — the ledger stays in Well either way.

## FAQ

**Q: What happens with no accounting tool connected?**
A: Nothing is sent. The journals stay in Well, and connecting one later makes the same close exportable on the next run.

**Q: Does it overwrite what the connector already has?**
A: No. The connector is the source of truth: an entry it already holds is never resent, and a divergence is never overwritten from Well's side.

**Q: What if some entries fail to send?**
A: The step never shows a raw error list. It re-reads what the connector actually has, says which categories still have entries missing there, and points at the right next step.

---

## Installation

The file under `skills/export-to-accounting-tool/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install export-to-accounting-tool](https://github.com/WellApp-ai/skills/raw/main/dist/export-to-accounting-tool.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/export-to-accounting-tool/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "export-to-accounting-tool". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill export-to-accounting-tool
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
