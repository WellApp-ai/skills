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

| Skill | What you get | Details |
|---|---|---|
| `accounting-settings` | Set the accounting basics every period-scoped answer depends on. | [View details →](docs/accounting-settings.md) |
| `accounts-receivable-aging` | See who owes you money, and how long they've been sitting on it. | [View details →](docs/accounts-receivable-aging.md) |
| `assign-missing-invoices` | Put a name on every settled expense that still has no invoice. | [View details →](docs/assign-missing-invoices.md) |
| `avg-burn` | Know what you actually spend each month, averaged over real months. | [View details →](docs/avg-burn.md) |
| `bills-due` | See exactly what's coming due, in what order, and how much cash it adds up to. | [View details →](docs/bills-due.md) |
| `cash-flow-waterfall` | See the bridge from last month's balance to this one. | [View details →](docs/cash-flow-waterfall.md) |
| `cash-forecast` | See where your cash lands if nothing new comes in. | [View details →](docs/cash-forecast.md) |
| `cash-position` | Know exactly how much cash you have, and which accounts it came from. | [View details →](docs/cash-position.md) |
| `categorize-counterparties` | Close the category gaps behind your spend before you close a month. | [View details →](docs/categorize-counterparties.md) |
| `close-books` | Drive the month-end close to the point of approval. | [View details →](docs/close-books.md) |
| `company-profile` | Everything you know about one company, in one view. | [View details →](docs/company-profile.md) |
| `confirm-my-company` | Set the identity that tells your invoices from everyone else's. | [View details →](docs/confirm-my-company.md) |
| `connect-accounting` | Get your accounting tool connected, and confirm the feed is live. | [View details →](docs/connect-accounting.md) |
| `connect-bank` | Get the bank feed in, and confirm it is really live. | [View details →](docs/connect-bank.md) |
| `connect-tools` | See what is connected, what is syncing, and what is missing. | [View details →](docs/connect-tools.md) |
| `cost-structure` | See where your company's money actually goes, no spreadsheets required. | [View details →](docs/cost-structure.md) |
| `define-period` | Fix the month every following answer is measured over. | [View details →](docs/define-period.md) |
| `define-workspace` | Pin the one company account every following answer reads from. | [View details →](docs/define-workspace.md) |
| `deploy-agents` | See exactly which agents would run, before any of them does. | [View details →](docs/deploy-agents.md) |
| `draft-invoice` | Turn a sentence into a real invoice in Well, PDF attached, no template hunting. | [View details →](docs/draft-invoice.md) |
| `fetch-missing-invoices` | Walk the whole month-end sweep in one prompt. | [View details →](docs/fetch-missing-invoices.md) |
| `fx-exposure` | See how much of your cash and receivables sit outside your home currency. | [View details →](docs/fx-exposure.md) |
| `invite-teammates` | Get your teammates into the workspace, without leaving the conversation. | [View details →](docs/invite-teammates.md) |
| `missing-receipts` | Find the bills with no paperwork attached, before an auditor does. | [View details →](docs/missing-receipts.md) |
| `normalize-currency` | Turn mixed currencies into one number you can actually audit. | [View details →](docs/normalize-currency.md) |
| `payment-invoice-lookup` | Find what payment settled an invoice, or catch every payment that never got one. | [View details →](docs/payment-invoice-lookup.md) |
| `rank-clients-by-ltv` | Find out who your best customers really are, ranked by what they've actually paid. | [View details →](docs/rank-clients-by-ltv.md) |
| `runway` | Know exactly how many months and days of cash you have left. | [View details →](docs/runway.md) |
| `show-missing-invoices` | See which suppliers owe you paperwork, before your accountant asks. | [View details →](docs/show-missing-invoices.md) |

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
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/accounts-receivable-aging/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/assign-missing-invoices/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/avg-burn/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/bills-due/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/cash-flow-waterfall/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/cash-forecast/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/cash-position/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/categorize-counterparties/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/close-books/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/company-profile/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/confirm-my-company/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/connect-accounting/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/connect-bank/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/connect-tools/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/cost-structure/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/define-period/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/define-workspace/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/deploy-agents/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/draft-invoice/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/fetch-missing-invoices/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/fx-exposure/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/invite-teammates/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/missing-receipts/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/normalize-currency/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/payment-invoice-lookup/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/rank-clients-by-ltv/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/runway/SKILL.md
    - https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/show-missing-invoices/SKILL.md
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
