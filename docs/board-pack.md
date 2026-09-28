<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Board pack

**The board numbers in one pass, each with its scope and its window stated.**

## What it does

Ask your AI assistant for the numbers your board is waiting on, and it measures them in one pass over one window: the cash you hold, the burn that cash is running against, the runway those two divide into, the recurring revenue you invoiced, and what is owed to you and by you.

Every figure is computed in the open rather than read off a black box. Well reads the balances, sums the transactions and sums the invoices, and this skill applies the policies you confirm: which account types count as cash, which categories are not spend, which billing counts as recurring. You confirm each policy once and every page downstream of it uses the same answer, so the runway divides the same cash the cash page reported.

The pack asks for no month. Every rate page averages over the same trailing months, ending with the last complete one, because a balance read today cannot be divided by a rate that stopped three months ago. How final the books are for those months is what `close-books` answers, and the pack points at it rather than reporting a verdict it never read.

It changes nothing. It closes no period, posts no entry and produces no file. What it produces is the set of figures, each one re-derivable from the two numbers under it.

## Required data in Well

- **Banking connector** (required). The cash, burn and runway pages are read from the bank feed: balances on one side, transactions on the other.
- **Own company set** (required). Ownership decides which accounts count as cash, which movements count as spend, and which side of an invoice the business is on, so every page rests on it.
- **Invoicing source** (recommended). Without it there are no invoices to sum, so the revenue and recurring revenue pages have nothing to measure and the pack says so.
- **Accounting connection** (optional). Transactions and invoices that reach Well through an accounting platform widen what the burn and the revenue pages measure. The pack states what it counted either way.

## FAQ

**Q: Does it produce a file I can send to my board?**
A: No. It produces the figures and what each one rests on, in the conversation and on the cards. Nothing here assembles an archive, a PDF or a downloadable bundle, and the skill does not pretend otherwise.

**Q: Does it include a profit and loss statement?**
A: No. A profit and loss statement is an aggregate over ledger entry lines, and no such aggregate exists to read. Reaching a total by paging through rows is refused, because a total assembled from a sample is a wrong number rather than an approximate one.

**Q: Can it compare the numbers against our budget?**
A: No. Well holds no budget, so there is nothing to compare against. What it does compare is each rate figure against the window immediately before it, measured under the same policy, so the change is a real one.

**Q: Does it report headcount or payroll commitments?**
A: No. Payslips and employment contracts are not among the records Well reads, so any headcount figure here would be invented. Payroll that moved through a bank account is counted as spend like any other outflow.

**Q: Does it close or lock the period?**
A: No. It reads and reports, and writes nothing back. Closing a month is its own flow, `close-books`, and approving it is a click you make in Well.

**Q: What happens when the money is in several currencies?**
A: Each amount is converted at its own rate, and the rate and the rate date are stated with the figure. When a rate is missing, the amount stays in its own currency and the total says what it left out, because a blended total nobody can re-derive is worse than two numbers they can.

**Q: Does Well work these numbers out for me?**
A: No. The cards draw the figures this skill computed and record that the caller computed them. The arithmetic runs in the open here, over reads that convert nothing and decide nothing, which is what lets you check it.

**Q: Why does it ask me three questions before any number appears?**
A: Because three of the numbers rest on a policy only you can settle: what counts as cash, what is not spend, and what billing is recurring. Each is asked once and every page after it uses the same answer, so the pages agree with each other.

---

## Installation

The file under `skills/board-pack/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install board-pack](https://github.com/WellApp-ai/skills/raw/main/dist/board-pack.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/board-pack/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "board-pack". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill board-pack
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
