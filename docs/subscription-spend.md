<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Subscription spend

**See which suppliers bill you on a schedule, what each one costs a month, and which amounts have changed.**

## What it does

Ask your AI assistant what you pay for on a schedule, and it reads the purchase side of your synced invoices for the window you name, groups them by supplier, and keeps the suppliers whose invoices repeat. A supplier counts as monthly when it invoiced in at least three months, never more than once a month, with no gap longer than one skipped month and most gaps of one month. It counts as bimonthly when every gap is two months, quarterly when every gap is three, and yearly when every gap is twelve, which only a 24 month window can show. The rule is stated in the answer, so a supplier you expected and do not see can be checked against it.

Each supplier carries its cadence, its cost per month and per year net of tax, and how its amount behaved: the same every time, changed and then held, or varying from one invoice to the next. A changed amount is named with both figures and the month it moved. A varying amount is reported as usage shaped and never as a price change, because a bill that moves every month has no price to increase.

The total is set beside everything you bought in the same window, so the share is a share of real purchase spend rather than of a figure the skill made up. Invoices Well could not place on either side are counted beside it, because an incomplete own company pushes purchases into that bucket.

It reads invoices, so a subscription you pay by card with no invoice in Well is invisible to the main read. The skill looks at the last three complete months of categorized bank spend for suppliers that appear every month with no invoice attached, and lists them as candidates. A charge not categorized yet is not in that read, and the list can be partial, so it is never a complete list. Candidates stay out of the total.
A supplier that keeps a steady run but bills more than once in a month is flagged as a possible duplicate subscription, and a supplier whose invoices stopped is flagged as possibly ended. Beside the total, the answer gives what those flagged suppliers bill a month, as arithmetic and never as a saving. It does not see contract terms, renewal dates or cancellation deadlines, and it does not say whether a subscription is still in use.

## Required data in Well

- **Invoicing or accounting connector** (required). This is where the supplier invoices you received come from. Either one is enough.
- **Company profile confirmed in Well** (required). The purchase side of an invoice is resolved from the company you confirm as your own. Without it, invoices land in the unplaced bucket instead of the read.
- **Banking connector** (recommended). Lets the skill list categorized bank spend that repeats every month with no invoice attached.
- **Exchange rates** (recommended). A window that spans several currencies is reported per currency unless rates cover it, in which case each figure carries the rate and the rate date used.

## FAQ

**Q: Which suppliers count as a subscription?**
A: A supplier that invoiced in at least three months, never more than once a month, with no gap longer than one skipped month and most gaps of one month, counts as monthly. Every gap of two months counts as bimonthly, every gap of three as quarterly, and every gap of twelve as yearly, which needs a 24 month window. The answer states the rule it used.

**Q: Can it tell me a price went up?**
A: Yes, for a supplier whose invoices held one amount and then moved to another and held there. It names both amounts, net of tax, and the month it changed. A supplier whose amount varies every month is reported as usage shaped, not as a price change.

**Q: What about a subscription I pay by card with no invoice?**
A: It cannot appear in the main list, because the list is read from invoices. If a bank is connected, the skill looks at the last three complete months and lists categorized bank spend that shows up every month with no invoice attached, as candidates to check. A charge that is not categorized yet is not in that read, and the list can be partial. Candidates are never added to the total.

**Q: Does it show renewal dates or cancellation deadlines?**
A: No. Well holds the invoices and the payments, not the contract behind them, so a renewal date or a notice period is not something it can read.

**Q: Can it find duplicates or tell me what to cut?**
A: In part. A supplier that keeps a steady run but bills more than once in a month is flagged as a possible duplicate, and a supplier whose invoices stopped is flagged as possibly ended. The answer gives what the flagged suppliers bill a month. It does not compare two different suppliers for overlap and it never calls that figure a saving, because Well cannot see whether a subscription is in use.

**Q: Are the amounts before or after tax?**
A: Before tax. Every figure is the net amount on the invoice, so a change in a tax rate is never read as a change in what the supplier charges.

**Q: What if we pay in several currencies?**
A: You get one figure per currency, or a converted total with the rate and the rate date attached. Never a blended number with no rate behind it.

**Q: Can I run it over a longer window?**
A: Yes. A yearly subscription shows only in a window of two years, so ask for that when you want yearly charges. A longer window reads more invoices, and the skill says so before it starts.

---

## Installation

The file under `skills/subscription-spend/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install subscription-spend](https://github.com/WellApp-ai/skills/raw/main/dist/subscription-spend.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/subscription-spend/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "subscription-spend". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill subscription-spend
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
