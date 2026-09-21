<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Signing back

**Come back to a workspace and know in one turn what changed, where it stands, and what to do next.**

## What it does

Coming back to a finance workspace after days away means rebuilding a picture in your head: something synced, something failed, a month sits open, a supplier still owes you an invoice. The tools never put it in front of you.

Ask your assistant what happened since last time and get the whole picture in one turn: what landed and which connector brought it, what failed and needs you, and where the workspace stands today. Every figure is exactly what Well returned, dated in your workspace's own time zone.

The five next steps that close the turn are ranked by Well, not the assistant: the gaps blocking your books come first, then the month ready to close, then the questions worth asking once the data holds. A skill you ran today is left off the list. Click one and it starts. For the same five steps without the recap, see [`whats-next`](whats-next.md).

## Required data in Well

- **A Well workspace** (required). The digest is one workspace's log, so the workspace is pinned first when the grant spans several.
- **A previous session** (optional). A first session gets the tour line and no recap; the recap needs an earlier read cursor or sign-in.

## FAQ

**Q: Does it run on its own?**
A: In the Well app it opens every new conversation. In Claude it runs when you ask what happened since last time, or when a flow closes on its next steps.

**Q: Where do the five next steps come from?**
A: Well ranks them on the server from the workspace's gaps: skills that add data first, then the open month's close, then analysis. A skill you ran in the last day is left out. The assistant draws them and starts the one you click.

**Q: Does reading the recap change anything?**
A: It advances your read cursor, the same one the app's activity feed uses, so the next recap starts where this one ended.

---

## Installation

The file under `skills/signing-back/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install signing-back](https://github.com/WellApp-ai/skills/raw/main/dist/signing-back.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/signing-back/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "signing-back". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill signing-back
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
