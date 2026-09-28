<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Runway

**Know how many months of cash you have at your current burn, with both sides of the division shown.**

## What it does

Ask your AI assistant what your runway is, and it divides your real synced cash balances by your actual trailing burn, computed here from your own accounts and your own transactions rather than estimated. You get months and days, plus both numbers behind the division, so the figure is something you can challenge rather than take on faith.
The division is all it is. Money you have committed but not yet paid, an unpaid supplier bill or next month's payroll, is not deducted, and the answer says so. When a rate is missing, the cash stays per currency rather than arriving as one total nobody can stand behind. When a balance could not be read, the cash is reported as a floor and the months are not presented as exact.
Neither side is handed over by a server. Well reads your balances and sums your transactions, and this skill totals, averages and divides them in the open, under policies you confirm: which account types count as cash, and which categories are not spend.

## Required data in Well

- **Banking connector** (required). Cash and burn are both read from the bank feed.
- **Own company set** (required). Ownership decides which accounts count as cash and which movements count as spend, so both sides of the division rest on it.
- **Exchange rates** (recommended). Without a rate, accounts spanning currencies are reported per currency rather than as one figure.

## FAQ

**Q: How is burn calculated?**
A: As a trailing average over the last 3 full months by default, so a single unusual month cannot distort the figure. You can ask for a different window, and the runway is recomputed from that same window.

**Q: Is this a forecast?**
A: No. Runway is computed from real balances and real trailing spend. Nothing is modelled or predicted, and the skill shows the arithmetic it used.

**Q: Does it subtract money we have already committed?**
A: No, and it refuses to. An unpaid supplier bill and next month's payroll are not inputs to the division. The figure is cash over burn and nothing else, so a commitment you know about is yours to hold beside it.

**Q: What happens when an exchange rate is missing?**
A: It refuses to report one base-currency cash figure. It says the rate is missing and stays per currency, because a blended total nobody can re-derive is worse than two numbers you can.

**Q: What if one of the balances cannot be read?**
A: The months are not presented as exact. An unreadable balance or a missing rate bounds the cash side, so the answer says the cash is a floor and names how many accounts it left out.

**Q: Does Well compute the runway for me?**
A: No. Neither side is derived on the server. Well reads the balances and sums the transactions, this skill measures both halves and divides them, and the card draws the division it was handed.

**Q: What if a bank is still syncing?**
A: The skill says so rather than answering from partial data. A runway number built on half your accounts is worse than no number.

---

## Installation

The file under `skills/runway/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install runway](https://github.com/WellApp-ai/skills/raw/main/dist/runway.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/runway/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "runway". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill runway
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
