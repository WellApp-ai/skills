<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/brand/well-logo-white.svg">
    <img src="assets/brand/well-logo-black.svg" alt="Well" width="220">
  </picture>
</p>

<p align="center"><strong>Grounded financial answers, delivered to you by your favorite agent.</strong></p>

<p align="center">
  <a href="https://www.skills.sh/wellapp-ai"><img src="https://img.shields.io/badge/skills.sh-Browse%20Well%20skills-6b5b95" alt="Browse on skills.sh"></a>
  <a href="#installation"><img src="https://img.shields.io/badge/Claude%20Desktop-Ready-d97757" alt="Claude Desktop double click install"></a>
</p>

> You don't have to dig through ledgers, invoices, and bank feeds by hand. Ask, and get a grounded answer with the receipts attached.

## What is Well?

**Well is the financial operating layer for founders, finance leads, and lean teams.** It connects to your bank accounts, accounting software, and invoicing tools, and gives your AI assistant secure, live access to that data through a standard called MCP — so it can answer with your real numbers instead of guessing.

No more exporting CSVs, copy-pasting numbers between tabs, or waiting on a bookkeeper to answer "how much runway do we actually have?" Well keeps your ledger, invoices, balances, and transactions synced and ready to query, in real time, from the tools you already use — Claude, Cursor, ChatGPT, and more.

```
https://api.wellapp.ai/v1/mcp
```

That's the address your AI assistant connects to. You'll add it once, during setup. ([Jump to setup](#installation))

## Why these skills exist

Connecting Well gives your AI assistant the tools to reach your data. On its own, that doesn't teach it *how* to use them well — what to check first, how to handle an account that's still syncing, or how to avoid blending three currencies into one meaningless number. That judgment is exactly what turns raw data into an answer you can trust.

This repo packages that judgment as **Agent Skills** — playbooks any AI assistant can follow. Each one confirms your account, checks there's enough real data to trust, pulls the right numbers, and — when something's missing — says so plainly instead of guessing.

**What this saves you:**

- **No more manual reconciliation.** A question like "what's my runway?" that used to mean opening three tools and building a spreadsheet now takes one prompt.
- **No guessed numbers.** Every answer states its currency, as-of date, and how it was computed — so you can trust it or double-check it in seconds.
- **No re-explaining your stack.** The skill already knows where to find what, so you don't have to walk your AI assistant through your setup every time.
- **No dead ends.** If something isn't connected yet, the skill tells you exactly what to connect instead of returning nothing or making something up.

## Available skills

| Skill | Description | Details |
|---|---|---|
| `expense-breakdown` | "Where does our money go?" — top expense categories and the biggest outstanding bills, from the ledger and invoices. | [View details →](docs/expense-breakdown.md) |
| `runway-calculator` | "What's our runway?" — real cash on hand vs. trailing burn, stated in months and days, with the full formula shown. | [View details →](docs/runway-calculator.md) |
| `cash-position` | "How much cash do we have right now?" — a point-in-time snapshot across every connected account. | [View details →](docs/cash-position.md) |
| `cash-balance-trend` | "Is our cash going up or down?" — a historical trend from real balance snapshots, never a forecast. | [View details →](docs/cash-balance-trend.md) |
| `accounts-receivable-aging` | "Who owes us money, and since when?" — outstanding customer invoices bucketed by days overdue. | [View details →](docs/accounts-receivable-aging.md) |
| `bills-due` | "What bills are due, and when?" — accounts payable sorted by due date with a running cash-out total. | [View details →](docs/bills-due.md) |
| `rank-clients-by-ltv` | "Who are our best customers?" — customers ranked by total paid revenue to date. | [View details →](docs/rank-clients-by-ltv.md) |
| `fx-exposure` | "How exposed are we to currency risk?" — cash and invoices in foreign currencies, converted at real rates. | [View details →](docs/fx-exposure.md) |
| `company-profile` | "Give me a 360 view of this company" — profile, contacts, and the full invoice relationship, customer or vendor. | [View details →](docs/company-profile.md) |
| `payment-invoice-lookup` | "What happened with this payment?" — match a payment to its invoice, or list every unreconciled one. | [View details →](docs/payment-invoice-lookup.md) |
| `missing-receipts` | "Which expenses are missing receipts?" — invoices with no source document attached, for compliance. | [View details →](docs/missing-receipts.md) |
| `draft-invoice` | "Draft an invoice for this client" — creates a real invoice record in Well, with an attached PDF, from a chat description. | [View details →](docs/draft-invoice.md) |
| `fetch-missing-invoices` | "Fetch the invoices I'm missing" — the whole month-end sweep in one prompt: workspace, connections, bank, month, the gap list, then a preview of the agents that would fetch them. | [View details →](docs/fetch-missing-invoices.md) |
| `show-missing-invoices` | "What am I missing for March?" — settled spend with no supplier invoice, one row per supplier, each row saying how the gap can be closed. | [View details →](docs/show-missing-invoices.md) |
| `deploy-agents` | "Go get those invoices" — a preview of which invoice-fetching agents Well would launch, per provider, before any of them runs. | [View details →](docs/deploy-agents.md) |
| `close-books` | "Close the books for last month" — drives the month-end close: starts the period, clears the blockers one at a time, prepares the package, and leaves the final lock as your one-click approval in Well. | [View details →](docs/close-books.md) |

## Utils

These are the setup steps the skills above invoke automatically to get what they need. Several also stand on their own when you ask for them directly. Listed here for reference, or if you want to see exactly how that step works.

| Skill | Description | Details |
|---|---|---|
| `define-workspace` | Pins the one Well workspace a conversation works in and hands it to every skill that follows. | [View details →](docs/define-workspace.md) |
| `connect-tools` | Checks bank, accounting, and invoicing sources: connected, still syncing, in error, or missing, with one-click connect links. | [View details →](docs/connect-tools.md) |
| `connect-bank` | "Connect my bank" — the dedicated bank step: which banks are live, syncing, or expired, and a one-click link to get the feed in. | [View details →](docs/connect-bank.md) |
| `define-period` | "Which month are we working on?" — pins the calendar month or months, translates them into the workspace's fiscal year and period, and says whether the selection holds activity. | [View details →](docs/define-period.md) |
| `categorize-counterparties` | "Which suppliers have no category?" — the companies behind your spend on a card, uncategorized ones first, each one categorized by picking from Well's catalog on its row. | [View details →](docs/categorize-counterparties.md) |
| `resolve-own-company` | Resolves the own-company pointer that decides payable from receivable, and folds in an entity's duplicate records. | [View details →](docs/resolve-own-company.md) |
| `accounting-settings` | "Set our fiscal year start to April" — writes the workspace's accounting settings (fiscal year start month, currency, framework, chart of accounts), only what you confirm. | [View details →](docs/accounting-settings.md) |
| `normalize-currency` | Converts multi-currency amounts into one total carrying its rate and date, or a clean per-currency breakdown, never a blended figure. | [View details →](docs/normalize-currency.md) |

---

## Working on this repo

`make install` points git at `.githooks/`, whose `pre-push` runs `make validate`. That
needs the `claude` CLI at **2.1.233 or newer**: before that version
`claude plugin validate ./skills` reports a missing plugin manifest, which describes the
CLI rather than this repository. `make validate` checks the version first and says so.

In an environment with no CLI — a CI runner, a container — use `make validate SKIP_CLAUDE=1`
to run the checks that need only node.

## Installation

### Assisted by AI (Recommended)

Paste this into any AI agent — Claude, Codex, Cursor, OpenCode, and others — to install all the skills:

> [!NOTE]
> We suggest using **Claude Chat** rather than Claude Cowork for this step — Cowork's approach is noticeably slower and pricier for a quick install like this. Any Claude model works fine.

```
Install the following official skills from Well. Instructions:

1. Fetch these files:
    a. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/expense-breakdown/SKILL.md
    b. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/runway-calculator/SKILL.md
    c. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/cash-position/SKILL.md
    d. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/cash-balance-trend/SKILL.md
    e. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/accounts-receivable-aging/SKILL.md
    f. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/bills-due/SKILL.md
    g. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/rank-clients-by-ltv/SKILL.md
    h. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/fx-exposure/SKILL.md
    i. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/company-profile/SKILL.md
    j. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/payment-invoice-lookup/SKILL.md
    k. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/missing-receipts/SKILL.md
    l. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/draft-invoice/SKILL.md
    m. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/fetch-missing-invoices/SKILL.md
    n. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/show-missing-invoices/SKILL.md
    o. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/deploy-agents/SKILL.md
    p. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/close-books/SKILL.md
    q. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/define-workspace/SKILL.md
    r. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/connect-tools/SKILL.md
    s. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/connect-bank/SKILL.md
    t. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/define-period/SKILL.md
    u. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/categorize-counterparties/SKILL.md
    v. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/resolve-own-company/SKILL.md
    w. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/normalize-currency/SKILL.md
    x. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/accounting-settings/SKILL.md
2. Download and display the SKILL.md files to the user. Each must be named "SKILL.md" — no prefix, no suffix, exact name.
3. Create a summary table with skill names and descriptions extracted from the frontmatter
4. Before replying to the user, ensure you have named the downloaded files "SKILL.md". This is crucial for the rest of the steps.
5. If you can, install these skills yourself.
6. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain them how to add a new MCP.
```

### Claude Code Plugin Marketplace

If you use Claude Code, this repo is also a plugin marketplace — one install wires up every skill and the Well connection:

```
/plugin marketplace add WellApp-ai/skills
/plugin install well-skills@wellapp
```

You'll be asked to sign in to Well the first time a skill needs your data.

### Codex CLI Plugin

If you use Codex CLI, this repo is also a Codex plugin — one install wires up every skill and the Well connection:

```bash
codex plugin marketplace add WellApp-ai/skills
codex plugin add well-skills@wellapp
```

You'll be asked to sign in to Well the first time a skill needs your data.

### Manual Installation

> [!NOTE]
> Using Codex CLI? The [Codex CLI Plugin](#codex-cli-plugin) above does both steps below in one command.

#### Step 1: Connect Well

Your data is processed and kept secure at Well. To access it, your AI assistant needs to open a secure connection with Well — this is called MCP, and it's the standard way AI tools connect to outside services. Here's how to set it up:

Add this address in your host's connection settings:

```
https://api.wellapp.ai/v1/mcp
```

- **Claude Code**: `claude mcp add --transport http well https://api.wellapp.ai/v1/mcp`
- **Claude Desktop**: Settings → Connectors → Add custom connector.
- **Other AI tools** (Cursor, Codex, etc.): add it wherever that tool manages its connections.

The first time your assistant needs your data, you'll be asked to sign in and approve access to your Well workspace — no passwords or API keys to manage.

Next, give it the skills below so it knows how to use that connection well.

#### Step 2: Install all the skills

> [!NOTE]
> We strongly suggest installing the skills you find relevant among the one listed in the table [here](#available-skills).

##### Claude Desktop

Download the `.skill` file and double-click it to install — Claude Desktop installs it immediately, no drag-and-drop, no unzipping.

| Skill | Description | Download |
|---|---|---|
| `expense-breakdown` | Break down where a company's money goes — top expense categories and biggest outstanding bills. | [⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/expense-breakdown.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/expense-breakdown.zip) |
| `runway-calculator` | Calculate true cash runway in months and days from real balances and trailing burn. | [⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/runway-calculator.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/runway-calculator.zip) |
| `cash-position` | Point-in-time snapshot of current cash across every connected account. | [⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/cash-position.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/cash-position.zip) |
| `cash-balance-trend` | Historical cash balance trend from real balance snapshots. | [⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/cash-balance-trend.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/cash-balance-trend.zip) |
| `accounts-receivable-aging` | Outstanding customer invoices bucketed by days overdue. | [⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/accounts-receivable-aging.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/accounts-receivable-aging.zip) |
| `bills-due` | Accounts payable sorted by due date with a running cash-out total. | [⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/bills-due.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/bills-due.zip) |
| `rank-clients-by-ltv` | Customers ranked by total paid revenue to date. | [⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/rank-clients-by-ltv.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/rank-clients-by-ltv.zip) |
| `fx-exposure` | Cash and invoices in foreign currencies, converted at real exchange rates. | [⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/fx-exposure.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/fx-exposure.zip) |
| `company-profile` | A 360 view of one company — profile, contacts, and the invoice relationship. | [⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/company-profile.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/company-profile.zip) |
| `payment-invoice-lookup` | Match a payment to its invoice, or list every unreconciled one. | [⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/payment-invoice-lookup.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/payment-invoice-lookup.zip) |
| `missing-receipts` | Invoices with no source document attached, for compliance. | [⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/missing-receipts.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/missing-receipts.zip) |
| `draft-invoice` | Create a real invoice record in Well, with an attached PDF, from a chat description. | [⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/draft-invoice.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/draft-invoice.zip) |
| `fetch-missing-invoices` | Walk the whole missing-invoice flow end to end, from workspace to a preview of the agents that would fetch. | [⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/fetch-missing-invoices.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/fetch-missing-invoices.zip) |
| `show-missing-invoices` | Settled spend for a period that still has no supplier invoice, one row per supplier, with how each gap can be closed. | [⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/show-missing-invoices.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/show-missing-invoices.zip) |
| `deploy-agents` | Preview the invoice-fetching agents Well would launch for a period, without launching any. | [⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/deploy-agents.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/deploy-agents.zip) |
| `close-books` | Drive the month-end close to approval — start the period, clear the blockers, prepare the package, then lock it with your one-click approval in Well. | [⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/close-books.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/close-books.zip) |

**Utils** — each `.skill`/`.zip` above only bundles its own folder, so a util it depends on isn't included; download and install the util separately alongside it.

| Skill | Description | Download |
|---|---|---|
| `define-workspace` | Pin the one Well workspace a conversation works in and hand it to every skill that follows. | [⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/define-workspace.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/define-workspace.zip) |
| `connect-tools` | Check bank, accounting, and invoicing connections and connect the missing ones in one click. | [⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/connect-tools.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/connect-tools.zip) |
| `connect-bank` | Get the bank feed into a workspace in one click, and report whether it is live, syncing, or expired. | [⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/connect-bank.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/connect-bank.zip) |
| `define-period` | Pin the calendar month or months, derive the fiscal year and period, and report whether the selection holds activity. | [⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/define-period.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/define-period.zip) |
| `categorize-counterparties` | Categorize the companies behind a workspace's spend from Well's shared catalog, on a card where every pick saves as you make it. | [⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/categorize-counterparties.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/categorize-counterparties.zip) |
| `resolve-own-company` | Work out which company in the workspace is yours, and fold in its duplicate records. | [⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/resolve-own-company.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/resolve-own-company.zip) |
| `accounting-settings` | Set the workspace's accounting settings — the fiscal year start month above all — writing only what you confirm. | [⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/accounting-settings.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/accounting-settings.zip) |
| `normalize-currency` | Convert amounts across currencies into one auditable total, or report them per currency. | [⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/normalize-currency.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/normalize-currency.zip) |

##### For Advanced Users

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills
```

---

## FAQ

**Q: Is my financial data stored in this repo or on GitHub?**
A: No. This repo only contains instructions for your AI assistant. Every number is fetched live from Well, scoped to your own workspace, and never stored here.

**Q: Do I need a Well account to use these skills?**
A: Yes — a Well workspace connected to at least one bank or accounting tool. If you don't have one yet, each skill walks you through setting it up before it answers anything.

**Q: What happens if a skill can't get enough data?**
A: It says so plainly, tells you exactly what to connect, and — as a last resort — links you to ask the same question directly inside Well, rather than guessing a number.

**Q: Can I use these skills outside Claude?**
A: Yes. `SKILL.md` is an open format — any Agent-Skills-compatible host (Codex, Cursor, OpenCode, and others) can load the files under `skills/` or `.agents/skills/`.

## License

Copyright (c) 2026 Well App, Inc. Licensed under [PolyForm Perimeter 1.0.0](LICENSE) — free to use, including commercially, in any Agent-Skills-compatible host, but not to build a competing product or service. See [LICENSE](LICENSE) for the full terms and the [Well Terms of Service](https://wellapp.ai/terms/) for terms governing the Well platform itself.


<p align="center">
  <img src="https://wellapp.ai/images/badges/soc2.avif" alt="SOC 2 Type I" height="50">
  <img src="https://wellapp.ai/images/badges/gdpr.avif" alt="GDPR Compliant" height="50">
</p>

<p align="center">
    <b>Well is SOC-2 Type I and GDPR Compliant</b> 
</p>
