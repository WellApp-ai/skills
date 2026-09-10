<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Invoice fetching agents

**See exactly which agents would run, before any of them does.**

## What it does

You've just been shown the transactions with no invoice attached. The obvious next question is "so go get them" — and the answer starts with a preview. This skill takes the vendors you picked, groups them into the agents Well would run — one per provider, with the counterparties and the number of transactions behind each — and writes it out in your language, one line per agent, plus the rows only you can upload by hand and the providers still waiting to be connected. Nothing is queued yet: no agent has run, no task is queued, no browser session is open.

Then it hands the vendors over. The preview card gives a checkbox to each vendor. Tick the ones to chase, and the card's **Deploy** action creates the durable fetch tasks and opens the collect link that starts the runs — nothing is queued until that click. The Well browser extension collects from the link, and the extension's side panel is where a run is reported. This skill is the last brick of Well's fetch-missing-invoices flow: read the plan first, then queue and hand off the link.

## Required data in Well

- **A list of missing invoices** (required). There is nothing to preview until the gap has been found. This step runs after the missing supplier invoices are listed.
- **Banking connector** (recommended). The settled transactions are what the preview counts invoices against.

## FAQ

**Q: Does the chat collect the invoices?**
A: No. The chat only previews. The collecting happens in the Well app, through the browser extension, and only after you start it on that page.

**Q: What about vendors with no agent?**
A: They are listed with the reason, either connect the provider or upload it by hand. They are never silently dropped from the count.

**Q: Can I pick a subset?**
A: Yes. Every vendor the preview names has its own checkbox, and only the ones you tick are handed over.

---

## Installation

The file under `skills/deploy-agents/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/deploy-agents/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "deploy-agents". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill deploy-agents
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
