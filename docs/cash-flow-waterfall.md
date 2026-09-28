<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Cash flow bridge

**See how the month moved from opening cash to closing cash, with whatever does not reconcile named as its own step.**

## What it does

Ask your AI assistant why your balance changed, and it bridges the gap: opening position, total in, total out, closing position. The two ends are read from your balances and the two flows are summed from your transactions, so the four are measured independently and the law between them is checked rather than assumed.

Where the flows do not fully account for the movement between the two anchors, the residual is reported as its own step on the card. Nothing is adjusted to make the bridge balance, and the gap is never folded into money in or money out.

For what the outflows were spent on, see [`cost-structure`](cost-structure.md). For cash projected forward, see [`cash-forecast`](cash-forecast.md).

## Required data in Well

- **Bank connector** (required). Opening and closing balances, and the movements between them, all read from the feed.
- **Own company set** (required). A bridge reconciles against the workspace's own balances, so the skill has to know which company is yours before it can tell your accounts from a counterparty's.

## FAQ

**Q: Does it break fees out as their own step?**
A: No. A fee carried on the transaction row is inside the flows, not beside them. The card holds five figures (opening, in, out, the gap, closing) and no fee segment, so a fee bar would be a number nothing measured.

**Q: What if the numbers do not add up?**
A: Then the skill says so and shows the gap as its own step. The closing balance is read on its own rather than worked out from the flows, so a residual is a real finding about your data. It is never absorbed into money in or money out to make the bridge look tidy.

**Q: How does it decide what came in and what went out?**
A: From the period's own rows, once. Some feeds record an outflow as a negative amount and some as a positive magnitude, so the convention is elected over the whole period rather than guessed per row. A period that mixes both is reported as such instead of split on a guess.

**Q: Does a parent workspace's cash count?**
A: No. The sums run under the own scope, so a child workspace bridges its own accounts only. Adopted balances from a parent moved the parent's accounts, and counting them here would report money the child never held.

**Q: Does it break inflows out by source?**
A: This skill gives you the bridge: opening, in, out, closing. For the breakdown of what the outflows were spent on, ask the cost structure skill.

**Q: Why does it not tie to my accounting?**
A: The bridge is settled bank movement. Your ledger can recognise things in a different period, so the two answer different questions on purpose.

**Q: Can I bridge a quarter?**
A: Yes. Ask for the period you want and the skill bridges it, as long as your feed covers both ends of it.

---

## Installation

The file under `skills/cash-flow-waterfall/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install cash-flow-waterfall](https://github.com/WellApp-ai/skills/raw/main/dist/cash-flow-waterfall.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/cash-flow-waterfall/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "cash-flow-waterfall". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill cash-flow-waterfall
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
