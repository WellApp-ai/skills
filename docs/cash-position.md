<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Cash position

**Know how much cash you hold right now, with the accounts counted and the ones left out both stated.**

## What it does

Sometimes you don't need a forecast, you just need the number. Ask your AI assistant what your cash position is, and it pulls your real, current bank balances straight from Well, broken down by account and currency, with an as-of timestamp on every figure. No burn rate, no runway, no projections: just what's actually in the bank today.
The total is a policy as much as an amount, and the policy is on screen. Whose accounts count is settled before anything is added, which kinds of account are cash is your call rather than an assumption, and each currency carries the rate it converted at. What fell out is reported in named groups, so a rule you chose reads differently from an account nobody could read.
It also answers whether cash is rising or falling: the same read carries the trailing month-end balances behind today's figure, so "is our cash going up or down?" is this skill rather than a separate one. For cash projected FORWARD, see [`cash-forecast`](cash-forecast.md).

## Required data in Well

- **Banking connector** (required). This is where your real, current cash balances come from.
- **Your own company** (required). Ownership decides which accounts belong in the total, so an account nobody has claimed contributes nothing until this is set.
- **Exchange rates** (recommended). Without a rate on file, a workspace holding several currencies is reported per currency rather than as one total.

## FAQ

**Q: Does it handle multiple currencies?**
A: Yes, and never silently. Each account is converted at a rate the answer names, and the total says so. A currency with no rate on file is reported on its own rather than folded into a blended figure.

**Q: Is the total exact?**
A: Only when every counted account could be read and converted. If one could not, the answer says the total is a floor and names the accounts behind that, rather than presenting a short figure as the full one.

**Q: Why does it ask which accounts are mine?**
A: Because an account nobody has claimed is silently left out of the total. The skill stops and asks rather than reporting a figure that is missing money you own.

**Q: What does it leave out?**
A: Any account whose type sits outside the cash scope you confirmed, and it names what fell out rather than hiding it. Credit cards and loans are liabilities, so most businesses exclude them, but that choice is yours to make and to change.

**Q: What happens when the read comes back empty?**
A: It stops and says the balances could not be read. An empty read is not a zero, and reporting one as the other would turn a failed call into a confident answer.

**Q: How is this different from the runway skill?**
A: This one answers what is in the bank today. Runway adds your burn rate to tell you how long that cash lasts.

---

## Installation

The file under `skills/cash-position/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install cash-position](https://github.com/WellApp-ai/skills/raw/main/dist/cash-position.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/cash-position/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "cash-position". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill cash-position
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
