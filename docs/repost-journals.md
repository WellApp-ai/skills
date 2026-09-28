<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Repost the journals

**Re-run the posting pipeline for the rows that were ready but never posted.**

## What it does

Closing the books rests on every row being posted. Most of the time they are, and this step renders nothing. When the posting pipeline missed a run, some rows that were ready to post sit without a journal entry — not because anything is wrong with them, but because nothing booked them yet.

This skill reads that gap. When it is empty, it says so and stops. When the pipeline is still running, it polls rather than re-triggering. When rows are ready and idle, it surfaces a card listing them with one CTA that re-runs the posting pipeline for the workspace. The re-run is idempotent: it re-posts nothing already booked, so pressing it again is safe. It never picks a ledger account or a category — a row that needs one of those is a different step's work.

## Required data in Well

- **A Well workspace with a fiscal period** (required). The posting gap is read for one fiscal period of one workspace.

## FAQ

**Q: What does re-triggering actually do?**
A: It re-runs the same deterministic posting pipeline the system runs on its own, for the workspace's re-triggerable rows. It books nothing twice.

**Q: Why does it not let me pick an account?**
A: A row that needs an account is not ready to post — it is a substantive blocker another step owns. This step lists only the rows that are ready.

**Q: What if Well is still processing the rows?**
A: The read carries an in_flight_processing flag. While it is true, Well is still shaping the rows (enrichment in flight), so the skill polls and does not re-trigger until that work lands.

---

## Installation

The file under `skills/repost-journals/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install repost-journals](https://github.com/WellApp-ai/skills/raw/main/dist/repost-journals.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/repost-journals/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "repost-journals". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill repost-journals
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
