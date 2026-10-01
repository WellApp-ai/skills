<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/brand/well-logo-white.svg">
    <img src="assets/brand/well-logo-black.svg" alt="Well" width="220">
  </picture>
</p>

<p align="center"><strong>Grounded financial answers, delivered to you by your favorite agent.</strong></p>

<p align="center">
  <a href="https://www.skills.sh/wellapp-ai"><img src="https://img.shields.io/badge/skills.sh-Browse%20Well%20skills-6b5b95" alt="Browse on skills.sh"></a>
  <a href="#installation"><img src="https://img.shields.io/badge/Claude%20Code-Plugin-d97757" alt="Claude Code plugin"></a>
  <a href="#codex-cli-plugin"><img src="https://img.shields.io/badge/Codex%20CLI-Plugin-000000" alt="Codex CLI plugin"></a>
</p>

> You don't have to dig through ledgers, invoices, and bank feeds by hand. Ask, and get a grounded answer with the receipts attached.

## What is Well?

**Well is the financial operating layer for founders, finance leads, and lean teams.** It connects to your bank accounts, accounting software, and invoicing tools, and gives your AI assistant secure, live access to that data through a standard called MCP, so it can answer with your real numbers instead of guessing.

No more exporting CSVs, copy-pasting numbers between tabs, or waiting on a bookkeeper to answer "how much runway do we actually have?". Well keeps your ledger, invoices, balances, and transactions synced and ready to query, in real time, from the tools you already use: Claude, Codex, Cursor, ChatGPT, and more.

```
https://api.wellapp.ai/v1/mcp
```

That's the address your AI assistant connects to. You'll add it once, during setup. ([Jump to setup](#installation))

## Why these skills exist

Connecting Well gives your AI assistant the tools to reach your data. On its own, that doesn't teach it *how* to use them well: what to check first, how to handle an account that's still syncing, or how to avoid blending three currencies into one meaningless number. That judgment is exactly what turns raw data into an answer you can trust.

This repository packages that judgment as **Agent Skills**, playbooks any AI assistant can follow. Each one confirms your workspace, checks there's enough real data to trust, pulls the right numbers, and, when something's missing, says so plainly instead of guessing.

**What this saves you:**

- **No more manual reconciliation.** A question like "what's my runway?" that used to mean opening three tools and building a spreadsheet now takes one prompt.
- **No guessed numbers.** Every answer states its currency, as-of date, and how it was computed, so you can trust it or double-check it in seconds.
- **No re-explaining your stack.** The skill already knows where to find what, so you don't have to walk your AI assistant through your setup every time.
- **No dead ends.** If something isn't connected yet, the skill tells you exactly what to connect instead of returning nothing or making something up.

## They stay current on their own

You install a skill once. Every time you ask for it after that, it fetches its current version from Well before it answers.

So there is nothing to update, and nothing goes stale on you. A skill you installed months ago behaves exactly like one installed this morning.

## Available skills

Ask for any of these by name. Several are setup steps another skill invokes on its own when it needs them, and they answer just as well when you ask for them directly.

| Skill | What you get | Details | Claude Desktop |
|---|---|---|---|
| `accounting-settings` | Set the accounting basics every period-scoped answer depends on. | [View details →](docs/accounting-settings.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/accounting-settings.skill) |
| `accounts-payable-aging` | See what you owe your suppliers, and how long each bill has been past due. | [View details →](docs/accounts-payable-aging.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/accounts-payable-aging.skill) |
| `accounts-receivable-aging` | See who owes you money, and how long they have been sitting on it. | [View details →](docs/accounts-receivable-aging.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/accounts-receivable-aging.skill) |
| `assign-missing-invoices` | Put a name on every settled expense that still has no invoice. | [View details →](docs/assign-missing-invoices.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/assign-missing-invoices.skill) |
| `avg-burn` | Know what you spend in an average month over a window you can see, with the months that carried no spend counted. | [View details →](docs/avg-burn.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/avg-burn.skill) |
| `bills-due` | See what you owe and when, ordered by due date with a running total. | [View details →](docs/bills-due.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/bills-due.skill) |
| `board-pack` | The board numbers in one pass, each with its scope and its window stated. | [View details →](docs/board-pack.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/board-pack.skill) |
| `cash-flow-waterfall` | See how the month moved from opening cash to closing cash, with whatever does not reconcile named as its own step. | [View details →](docs/cash-flow-waterfall.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/cash-flow-waterfall.skill) |
| `cash-forecast` | See the settled month-end cash series and where the line goes from the last complete month. | [View details →](docs/cash-forecast.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/cash-forecast.skill) |
| `cash-position` | Know how much cash you hold right now, with the accounts counted and the ones left out both stated. | [View details →](docs/cash-position.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/cash-position.skill) |
| `categorize-counterparties` | Close the category gaps behind your spend before you close a month. | [View details →](docs/categorize-counterparties.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/categorize-counterparties.skill) |
| `chart-of-accounts` | Read the accounts your workspace posts to, number by number. | [View details →](docs/chart-of-accounts.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/chart-of-accounts.skill) |
| `check-contractor-status` | For each supplier that looks like a freelancer, read the purchase invoices, the payment rail and any contract Well holds, and state the facts a requalification question turns on, next to the papers your country expects you to keep. | [View details →](docs/check-contractor-status.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/check-contractor-status.skill) |
| `check-expense-taxability` | For one French payroll month, list the payslip lines that are neither salary, tax nor contribution, with the label and amount the payslip printed, set the receipt gaps Well already found beside them, and state the country rule each item has to be judged against. | [View details →](docs/check-expense-taxability.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/check-expense-taxability.skill) |
| `check-payslip` | Read one person's payslip for a month, list the lines it printed beside the same contract's earlier payslips, and name every line whose amount changed, appeared or disappeared. | [View details →](docs/check-payslip.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/check-payslip.skill) |
| `check-working-time-record` | For each employee Well can reach, say which kind of working time record your country expects, whether a timesheet is on file for the period, and how long it has to be kept. | [View details →](docs/check-working-time-record.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/check-working-time-record.skill) |
| `close-books` | Drive the month-end close from open to sent to your accounting tool. | [View details →](docs/close-books.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/close-books.skill) |
| `company-profile` | Everything you know about one company, in one view. | [View details →](docs/company-profile.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/company-profile.skill) |
| `compose-board` | The measures you name, arranged on one board that stores the question rather than the answer. | [View details →](docs/compose-board.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/compose-board.skill) |
| `confirm-my-company` | Set the identity that tells your invoices from everyone else's. | [View details →](docs/confirm-my-company.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/confirm-my-company.skill) |
| `connect-accounting` | Get your accounting tool connected, and confirm the feed is live. | [View details →](docs/connect-accounting.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/connect-accounting.skill) |
| `connect-bank` | Get the bank feed in, and confirm it is really live. | [View details →](docs/connect-bank.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/connect-bank.skill) |
| `connect-tools` | See what is connected, what is syncing, and what is missing. | [View details →](docs/connect-tools.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/connect-tools.skill) |
| `context-graph` | Connect your AI apps and your tools, then see your business as one context graph. | [View details →](docs/context-graph.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/context-graph.skill) |
| `contractor-year-end-statements` | Read the purchase invoices for one calendar year, list the contractors and suppliers you paid with the total for each, name the ones with no tax identifier on file, and say which year-end statement each jurisdiction expects and when. | [View details →](docs/contractor-year-end-statements.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/contractor-year-end-statements.skill) |
| `cost-structure` | See where your company's money actually goes, no spreadsheets required. | [View details →](docs/cost-structure.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/cost-structure.skill) |
| `customer-invoicing-identity` | What Well holds about a customer's legal identity, and what is still blank. | [View details →](docs/customer-invoicing-identity.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/customer-invoicing-identity.skill) |
| `declare-new-hire` | Lay out what a new hire needs before day one in the country you hire in, name the forms to collect and the notices to hand over, and, on your explicit yes, record the person in Well and file the signed contract as a document. | [View details →](docs/declare-new-hire.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/declare-new-hire.skill) |
| `define-period` | Fix the month every following answer is measured over. | [View details →](docs/define-period.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/define-period.skill) |
| `define-workspace` | Pin the one company account every following answer reads from. | [View details →](docs/define-workspace.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/define-workspace.skill) |
| `deploy-agents` | See exactly which agents would run, before any of them does. | [View details →](docs/deploy-agents.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/deploy-agents.skill) |
| `draft-invoice` | Turn a sentence into a real invoice in Well, PDF attached, no template hunting. | [View details →](docs/draft-invoice.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/draft-invoice.skill) |
| `employer-cost` | Read one month of payslips and state, per person, gross pay plus the employee deductions and the employer charges the payslip printed, then list the payroll related bills paid from the bank that no payslip carries. | [View details →](docs/employer-cost.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/employer-cost.skill) |
| `export-to-accounting-tool` | Send the closed month's journal entries to your connected accounting tool. | [View details →](docs/export-to-accounting-tool.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/export-to-accounting-tool.skill) |
| `fetch-missing-invoices` | Walk the whole month-end sweep in one prompt. | [View details →](docs/fetch-missing-invoices.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/fetch-missing-invoices.skill) |
| `fetch-provider-exports` | Get the export file from a provider Well cannot connect to, without the manual download. | [View details →](docs/fetch-provider-exports.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/fetch-provider-exports.skill) |
| `first-employer-setup` | Well reads your confirmed company, its public registry record and your accounting country, then lays out the one time employer setup list for that country, counted back from the start date you give, with the portal link, who to contact and your own company details written out for each step to copy. | [View details →](docs/first-employer-setup.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/first-employer-setup.skill) |
| `founder-own-pay` | Read the founder's own payslips, state gross pay, tax withheld, contributions and net pay per period beside the legal form and country on the own company record, and name the self-pay paperwork that goes with them. | [View details →](docs/founder-own-pay.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/founder-own-pay.skill) |
| `fx-exposure` | See how much of your cash and receivables sit outside your home currency. | [View details →](docs/fx-exposure.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/fx-exposure.skill) |
| `import-statement` | Drop a statement you already have, and get its transactions as records. | [View details →](docs/import-statement.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/import-statement.skill) |
| `invite-teammates` | Get your teammates into the workspace, without leaving the conversation. | [View details →](docs/invite-teammates.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/invite-teammates.skill) |
| `invoice-design` | Pick how an invoice prints, from the designs and records you already have. | [View details →](docs/invoice-design.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/invoice-design.skill) |
| `missing-receipts` | Find the bills with no paperwork attached, before an auditor does. | [View details →](docs/missing-receipts.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/missing-receipts.skill) |
| `mrr` | Know what you can count on earning each month, averaged over real months. | [View details →](docs/mrr.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/mrr.skill) |
| `normalize-currency` | Turn mixed currencies into one number you can actually audit. | [View details →](docs/normalize-currency.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/normalize-currency.skill) |
| `payment-invoice-lookup` | Find what payment settled an invoice, or catch every payment that never got one. | [View details →](docs/payment-invoice-lookup.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/payment-invoice-lookup.skill) |
| `payroll-cost-by-month` | Read the payslips for a month and state gross pay, tax withheld, social contributions and net pay per employee, in the currency each payslip was issued in. | [View details →](docs/payroll-cost-by-month.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/payroll-cost-by-month.skill) |
| `payroll-due-dates` | See what payroll and social obligations are coming, with the amount wherever a payslip carries one and whether the money already left the bank. | [View details →](docs/payroll-due-dates.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/payroll-due-dates.skill) |
| `payroll-year-end-pack` | Read every payslip for one calendar year, total gross pay, tax withheld, social contributions and net pay per contract and per month, name each month that has no payslip or no posted journal entry, and hand the year to your accountant through the close package. | [View details →](docs/payroll-year-end-pack.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/payroll-year-end-pack.skill) |
| `prefill-form-1099-nec` | Get one 1099-NEC per contractor back as a PDF with your own posted figures already in box 1, and the list of payees you cannot file for yet. | [View details →](docs/prefill-form-1099-nec.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/prefill-form-1099-nec.skill) |
| `prefill-form-1120` | Get page 1 of your 1120 back as a PDF with your own book figures already in the boxes, and a list of every box left for your preparer. | [View details →](docs/prefill-form-1120.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/prefill-form-1120.skill) |
| `prepare-exit-pack` | Read the final payslip for a leaver, state what it printed and what the contract says, and name the exit documents due and who sends each one. | [View details →](docs/prepare-exit-pack.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/prepare-exit-pack.skill) |
| `rank-clients-by-ltv` | Find out what each customer is worth over its whole life, ranked from the most valuable down. | [View details →](docs/rank-clients-by-ltv.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/rank-clients-by-ltv.skill) |
| `reconcile-hours-to-payslip` | Read one pay period's payslip lines for an hourly or part-time employee, state the hours, rate and amount on each line, name the overtime lines, and set the total against the hours the contract carries. | [View details →](docs/reconcile-hours-to-payslip.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/reconcile-hours-to-payslip.skill) |
| `reconcile-payroll-month` | Read one month's payslips and the bank transactions that paid them, name every payslip with no matching debit and every payroll debit with no payslip, and, on your explicit yes, categorise and post those debits as net salaries, employer social charges or wage withholding. | [View details →](docs/reconcile-payroll-month.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/reconcile-payroll-month.skill) |
| `repost-journals` | Re-run the posting pipeline for the rows that were ready but never posted. | [View details →](docs/repost-journals.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/repost-journals.skill) |
| `resolve-board` | A board you saved, drawn with today's figures rather than the day it was built. | [View details →](docs/resolve-board.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/resolve-board.skill) |
| `revenue-by-customer` | See which customers your revenue came from in a period, ranked, with the part you could not place named. | [View details →](docs/revenue-by-customer.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/revenue-by-customer.skill) |
| `runway` | Know how many months of cash you have at your current burn, with both sides of the division shown. | [View details →](docs/runway.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/runway.skill) |
| `show-missing-invoices` | See which suppliers owe you paperwork, before your accountant asks. | [View details →](docs/show-missing-invoices.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/show-missing-invoices.skill) |
| `signing-back` | Come back to a workspace and know in one turn what changed, where it stands, and what to do next. | [View details →](docs/signing-back.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/signing-back.skill) |
| `subscription-spend` | See which suppliers you pay on a schedule, what each costs a month, and how that spend moved. | [View details →](docs/subscription-spend.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/subscription-spend.skill) |
| `supplier-spend-register` | See what you paid each supplier over a year, ranked, with the invoices that could not be placed counted beside the total. | [View details →](docs/supplier-spend-register.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/supplier-spend-register.skill) |
| `tax-id-chase` | The companies you deal with that carry no tax identifier, listed before year end. | [View details →](docs/tax-id-chase.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/tax-id-chase.skill) |
| `unposted-and-blocked` | See what in a month has not reached the ledger, and which pile each item sits in. | [View details →](docs/unposted-and-blocked.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/unposted-and-blocked.skill) |
| `vat-radar` | See the net VAT your posted ledger shows for a quarter and which invoices to fix first. | [View details →](docs/vat-radar.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/vat-radar.skill) |
| `whats-next` | Five things worth doing next in this workspace, each one a click that starts it. | [View details →](docs/whats-next.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/whats-next.skill) |
| `workspace-data-migration` | Bring a connected bank across from the signup workspace instead of connecting it again. | [View details →](docs/workspace-data-migration.md) | [⬇ Install](https://github.com/WellApp-ai/skills/raw/main/dist/workspace-data-migration.skill) |

The Claude Desktop column is a one-file download: open it and Desktop installs the skill. Nothing to unzip, and it never needs updating.

---

## Installation

### Claude Code plugin marketplace

If you use Claude Code, this repository is a plugin marketplace. One install wires up every skill and the Well connection:

```
/plugin marketplace add WellApp-ai/skills
/plugin install well-skills@wellapp
```

You'll be asked to sign in to Well the first time a skill needs your data.

### Codex CLI plugin

If you use Codex CLI, this repository is also a Codex plugin. One install wires up every skill and the Well connection:

```bash
codex plugin marketplace add WellApp-ai/skills
codex plugin add well-skills@wellapp
```

You'll be asked to sign in to Well the first time a skill needs your data.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others) to install all the skills:

```
Install the following official skills from Well. Instructions:

1. Fetch these files:
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/accounting-settings/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/accounts-payable-aging/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/accounts-receivable-aging/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/assign-missing-invoices/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/avg-burn/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/bills-due/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/board-pack/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/cash-flow-waterfall/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/cash-forecast/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/cash-position/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/categorize-counterparties/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/chart-of-accounts/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/check-contractor-status/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/check-expense-taxability/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/check-payslip/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/check-working-time-record/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/close-books/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/company-profile/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/compose-board/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/confirm-my-company/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/connect-accounting/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/connect-bank/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/connect-tools/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/context-graph/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/contractor-year-end-statements/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/cost-structure/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/customer-invoicing-identity/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/declare-new-hire/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/define-period/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/define-workspace/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/deploy-agents/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/draft-invoice/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/employer-cost/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/export-to-accounting-tool/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/fetch-missing-invoices/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/fetch-provider-exports/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/first-employer-setup/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/founder-own-pay/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/fx-exposure/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/import-statement/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/invite-teammates/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/invoice-design/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/missing-receipts/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/mrr/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/normalize-currency/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/payment-invoice-lookup/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/payroll-cost-by-month/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/payroll-due-dates/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/payroll-year-end-pack/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/prefill-form-1099-nec/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/prefill-form-1120/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/prepare-exit-pack/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/rank-clients-by-ltv/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/reconcile-hours-to-payslip/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/reconcile-payroll-month/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/repost-journals/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/resolve-board/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/revenue-by-customer/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/runway/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/show-missing-invoices/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/signing-back/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/subscription-spend/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/supplier-spend-register/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/tax-id-chase/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/unposted-and-blocked/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/vat-radar/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/whats-next/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/workspace-data-migration/SKILL.md
2. Save each one as a file named exactly "SKILL.md" inside a folder named after the skill. No prefix, no suffix.
3. Create a summary table with the skill names and descriptions extracted from the frontmatter.
4. If you can, install these skills yourself.
5. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Manual installation

#### Step 1: Connect Well

Your data is processed and kept secure at Well. To access it, your AI assistant needs to open a secure connection with Well. This is called MCP, and it's the standard way AI tools connect to outside services. Add this address in your host's connection settings:

```
https://api.wellapp.ai/v1/mcp
```

- **Claude Code**: `claude mcp add --transport http well https://api.wellapp.ai/v1/mcp`
- **Claude Desktop**: Settings → Connectors → Add custom connector.
- **Other AI tools** (Cursor, Codex, etc.): add it wherever that tool manages its connections. The `.mcp.json` at the root of this repository carries the same server, ready to copy.

The first time your assistant needs your data, you'll be asked to sign in and approve access to your Well workspace. No passwords or API keys to manage.

#### Step 2: Install the skills

Every host that reads the Agent Skills format can load the folders under `skills/` (or `.agents/skills/`, which mirrors them). Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills
```

Or pick one skill from the tables above and follow the install steps on its details page.

---

## FAQ

**Q: Why are these files so short?**
A: Because they stay up to date on their own. Each one is a pointer: the moment you ask, it fetches the current version of the skill from Well. You install once and never think about it again.

**Q: Do I need a Well account to use these skills?**
A: Yes, a Well workspace connected to at least one bank or accounting tool. If you don't have one yet, each skill walks you through setting it up before it answers anything.

**Q: What happens if a skill can't get enough data?**
A: It says so plainly, tells you exactly what to connect, and, as a last resort, links you to ask the same question directly inside Well, rather than guessing a number.

**Q: Can I use these skills outside Claude?**
A: Yes. `SKILL.md` is an open format. Any Agent-Skills-compatible host (Codex, Cursor, OpenCode, and others) can load the files under `skills/` or `.agents/skills/`.

## License

Copyright (c) 2026 Well App, Inc. Licensed under [PolyForm Perimeter 1.0.0](LICENSE): free to use, including commercially, in any Agent-Skills-compatible host, but not to build a competing product or service. See [LICENSE](LICENSE) for the full terms and the [Well Terms of Service](https://wellapp.ai/terms/) for terms governing the Well platform itself.

<p align="center">
  <img src="https://wellapp.ai/images/badges/soc2.avif" alt="SOC 2 Type I" height="50">
  <img src="https://wellapp.ai/images/badges/gdpr.avif" alt="GDPR Compliant" height="50">
</p>

<p align="center">
    <b>Well is SOC-2 Type I and GDPR Compliant</b>
</p>
