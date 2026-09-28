<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Provider exports

**Get the export file from a provider Well cannot connect to, without the manual download.**

## What it does

A connector is the best way to get a provider's data into Well, and some providers do not offer one. Gusto, for example, gives its API only to approved partners. The data is still yours, and the provider's web app still lets you export it: a payroll journal, an employee roster, time off balances, as CSV files. This skill does those exports for you. It shows a card with the provider and every file Well can fetch from it. When you click Deploy, Well opens a page that asks you to confirm, and the Well browser extension then opens the provider in a new tab. Its agent works the site the way you would: for each file it finds the report, picks the range and the format, and starts the download. A file your account does not have, such as contractor payments when you have no contractors, is skipped with the reason. The run uses your browser and your session, so Well never holds your provider password. When a login or a two-factor code stands in the way, the agent hands the tab back to you. The files stay in your downloads, and Well also files a copy of each in the workspace you chose.

## Required data in Well

- **The Well browser extension** (required). The download happens in your browser, through the extension, in your own signed-in session with the provider.
- **A provider account** (required). You must be able to sign in to the provider in the same browser. The agent never types a password; it hands the tab back to you for the login.

## FAQ

**Q: Does Well see my provider password?**
A: No. The agent works in your browser, in the session you are already signed in to. When a login or a code is needed, it hands the tab back to you and waits.

**Q: Does the chat download the file?**
A: No. The chat shows what can be fetched. The download starts only after you click Deploy and then start the export on the page it opens.

**Q: Which providers work?**
A: Gusto today: the payroll journal, the employee roster, time off balances, time tracking hours and contractor payments. The card lists every file Well can fetch, and says so when a provider has none.

---

## Installation

The file under `skills/fetch-provider-exports/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install fetch-provider-exports](https://github.com/WellApp-ai/skills/raw/main/dist/fetch-provider-exports.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/fetch-provider-exports/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "fetch-provider-exports". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill fetch-provider-exports
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
