<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Subscription spend

**See what each scheduled supplier costs a month and a year, how it moved, and where your workspaces can save.**

## What it does

Ask your AI assistant what you pay for on a schedule, and Well reads the payments that left your bank accounts and credit cards over the last 24 complete months, groups them by supplier, and keeps the suppliers whose payments repeat. A supplier counts as monthly when it was paid in at least three months, never more than once a month, with no gap longer than one skipped month and most gaps of one month. It counts as bimonthly when every gap is two months, quarterly when every gap is three, and yearly when every gap is twelve. The rule is stated in the answer, so a supplier you expected and do not see can be checked against it.

Each supplier carries its cadence, its cost per month and per year, and how its amount behaved: the same every time, changed and then held, or varying from one payment to the next. A changed amount is named with both figures and the month it moved. A varying amount is reported as usage shaped and never as a price change, because a bill that moves every month has no price to increase.

Two cards follow. The first draws the last 12 complete months of subscription spend, one line per category, so a step up shows where it came from. The second lists each supplier with its logo, its category and one column per month, with the running month apart and marked in progress.

Transfers between your own accounts, taxes, salaries, social charges, loan repayments and treasury moves are never counted as subscriptions. A subscription paid by card is in the read when the card is connected. A credit card charge counts on its own day and against its supplier, and the card's repayment from your bank is a transfer between your own accounts, so the spend is never counted twice. A payment on a row linked to no connected account is not measured, and the answer says how many rows it left out. A supplier paid more than once in a month is flagged as a possible duplicate, and a supplier whose payments stopped is flagged as possibly ended. Beside the total, the answer gives what those flagged suppliers cost a month, as arithmetic and never as a saving. Asked when a subscription can be cancelled, it gives the date to give notice by when Well holds the supplier's contract, and asks for the contract when it does not. It never estimates that date, and it does not say whether a subscription is still in use. Asked about a refused payment, an anomaly or a price rise, it also reads your own mails of the last three months for a failed payment, an announced price rise or a cancellation, and keeps each one out of the totals. A teammate's mails stay private and are never read.

## Required data in Well

- **Banking connector** (required). The subscriptions are read from the payments that leave your bank accounts and your connected credit cards.
- **Company profile confirmed in Well** (recommended). Lets the read leave out payments to your own accounts at a bank that is not connected, which would otherwise read as a supplier.
- **Exchange rates** (recommended). Spend in several currencies is reported per currency, with one trend and one table each. A headline across currencies carries the rate and the rate date used.

## FAQ

**Q: Which suppliers count as a subscription?**
A: A supplier paid from a bank account or a credit card in at least three months, never more than once a month, with no gap longer than one skipped month and most gaps of one month, counts as monthly. Every gap of two months counts as bimonthly, every gap of three as quarterly, and every gap of twelve as yearly. The supplier must also be software or a service paid on a schedule, by its category: an agency, a contractor, a meal or a trip paid every month is not a subscription. A supplier on a cadence with no category is listed apart, to categorise, and is not counted. The answer states the rule it used.

**Q: Can it tell me a price went up?**
A: Yes, for a supplier whose payments held one amount and then moved to another and held there. It names both amounts and the month it changed. A supplier whose amount varies every month is reported as usage shaped, not as a price change.

**Q: What about a subscription I pay by card?**
A: A charge on a debit card, or on a credit card you connected, is in the read like any other outflow, on the day of the charge and against its supplier. The card's repayment from your bank is a transfer between your own accounts, so it is never counted a second time. A charge on a card that is not connected reaches Well with no account behind it, so the answer says how many rows it left out because they moved no connected account.

**Q: What does it leave out?**
A: Transfers between your own accounts, payments to your own company, taxes, salaries, social charges, loan repayments and treasury moves. Each one repeats every month and none of them is a subscription. The answer says how many transfers, rows that moved no connected account and payments to your own loan accounts it left out, and names the categories it never counts.

**Q: Does it show renewal dates or cancellation deadlines?**
A: Yes, when Well holds the supplier's contract. It reads the end date and the notice period Well extracted from the contract, gives the last day to give notice (the end date minus the notice period), and names the contract. A contract that renews automatically and whose end date is past has no next date on file, so the answer says so and asks for the latest contract. A contract that states it does not renew gives the date it ends. A contract whose reading does not say whether it renews gets no deadline: the answer gives the end date and the notice period, says it does not know whether the contract renews, and asks for the contract. With no contract on file, the answer says the date is unknown and asks for the contract. It never estimates the date from the payments. When no bank transaction has reached Well, the answer reads the contracts on file and asks for the contract when none carries the date.

**Q: Can it find duplicates or tell me what to cut?**
A: In part. Asked where you can save, it reads all your workspaces and lists your subscriptions first, then the numbered leads, every amount per year, the biggest first: a price rise to renegotiate, and a supplier you pay in two workspaces. A refused payment to a subscription and a tool its supplier says you do not use follow as signals to check. Reply with the numbers to act on them. Each lead names the workspace, the yearly figure, the action, the evidence and the date that matters. A supplier paid more than once in a month is flagged as a possible duplicate, and one whose payments stopped as possibly ended. Taxes, meals and a one-off transfer are never flagged. Every lead is to check, because Well cannot see whether a subscription is in use, and nothing is cancelled.

**Q: What if we pay in several currencies?**
A: You get one trend and one table per currency, and the totals per currency. A headline across currencies carries the rate and the rate date. Never a blended number with no rate behind it.

**Q: Which months does it cover?**
A: The read covers the last 24 complete calendar months, so a yearly subscription shows. The cards draw the last 12 complete months, and the table draws the running month apart, marked in progress.

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
