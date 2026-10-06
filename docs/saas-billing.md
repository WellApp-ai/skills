<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# SaaS billing

**See who cancelled, which payments failed and what was refunded, read live from Stripe, Paddle or Lago.**

## What it does

A SaaS founder asks billing questions every week: who cancelled, which cards failed, what was refunded, whether a customer still pays. The answer sits in the billing tool, and Well reads it there, live, through the connection you made. Stripe, Paddle and Lago each name these things in their own way, so the skill reads the tool list of your connection first and calls only a read that the list holds.

Every row is a record the billing tool returned. The status is the provider's own value, such as past due, canceled, terminated or failed, and a Paddle refund or chargeback keeps the adjustment status Paddle wrote. The skill never reads a status out of a description or a reason text, and it never guesses one. The amount keeps its currency, and the date is the one the provider stamped on the record. When the billing tool holds more rows than the skill read, the answer says so and gives the count it read, rather than giving a partial list as the whole.

It reads and it stops there. It cancels no subscription, issues no refund and answers no dispute, and it writes nothing into Well. Recurring revenue is a separate question with its own method, so a question about MRR goes to the recurring revenue skill.

## Required data in Well

- **A billing tool connected (Stripe, Paddle or Lago)** (required). The rows are read live from the billing tool, through the connection you made in Well. With none connected, the skill offers to connect one and reads nothing.

## FAQ

**Q: Which billing tools does it read?**
A: Stripe, Paddle and Lago. It reads the one you connected. With two of them connected, it reads each one and labels every row with the tool it came from.

**Q: Does it change anything in my billing tool?**
A: No. It calls read tools only. It cancels no subscription, issues no refund, retries no payment and answers no dispute. It saves nothing in Well either.

**Q: How does it decide that a payment failed?**
A: From the status field the billing tool returns, such as a Paddle transaction on automatic collection that is past due, or a Lago invoice whose payment status is failed. It never reads a failure out of a description or a decline message, and it states the status as the provider wrote it.

**Q: Why does it ask for a period?**
A: A list of every refund or every failed payment since the account opened can run to thousands of rows. The skill asks for a window first, such as this month or the last 90 days, and reads only that.

**Q: Does it give me a total or my MRR?**
A: No. It lists the rows with their amounts and counts them. It adds no amounts into a total, and recurring revenue goes to the recurring revenue skill, which has its own method.

---

## Installation

The file under `skills/saas-billing/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install saas-billing](https://github.com/WellApp-ai/skills/raw/main/dist/saas-billing.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/saas-billing/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "saas-billing". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill saas-billing
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
