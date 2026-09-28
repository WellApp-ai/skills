<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Unposted and blocked

**See what in a month has not reached the ledger, and which pile each item sits in.**

## What it does

Ask what a month has not booked yet and the useful answer is not one number. A transaction with no category is waiting on a decision about what it is. A transaction that already has a category and no ledger account is waiting on a posting decision. The two piles are read by two different tools, over two different definitions of the month, and this skill keeps them apart for that reason. It reports each count on its own and says which fix each pile needs.

Both reads are capped. When a page fills, the count that comes back is a floor rather than the month's total, and the answer says so instead of quoting it as exact. When a read fails, the pile is unknown rather than clear, and the answer says that too: an empty list from a failed read is not an empty pile. Neither read totals an amount, and no aggregate groups the unposted set, so the skill states counts and leaves money out rather than adding up a page it already called a floor.

It is a read from end to end. Each pile is drawn as its own card, and the card carries the picker that clears a row in place: a category on the uncategorized rows, a ledger account on the unposted rows, chosen from the chart the read returned. The skill itself categorizes nothing, posts nothing and closes nothing. For the supplier paperwork a month is still owed, ask for the missing invoices instead.

## Required data in Well

- **Bank connector** (required). The movements are what the two piles are read from. Without a bank behind the month there is nothing to check against the ledger.
- **Accounting connector, or the chart Well seeds** (recommended). The unposted pile is only meaningful where a posting target exists. The read returns the chart a row can be assigned from, and says when that list came back short.
- **A month the workspace can name** (required). The skill reads one complete month at a time, pinned from the period picker or from the month named in the question.

## FAQ

**Q: Does it tell me why each row is stuck?**
A: No. It tells you which pile a row sits in, which is the fix it needs: a category, or a ledger account. It gives no per-row reason beyond that, and it does not invent one.

**Q: Why two counts instead of one?**
A: Because they are two different problems. The unposted list holds only rows that already carry a category or a ledger role, so a row nobody has categorized yet appears in the uncategorized pile instead. Adding the two would merge a naming decision with a posting decision.

**Q: How much money is sitting outside the books?**
A: The skill does not say. Both reads cap their page, no aggregate groups the unposted rows, and adding up a capped page gives a floor dressed as a total. It reports how many rows are waiting, not what they are worth.

**Q: Does it cover payroll?**
A: Not as a pile of its own. It reads transactions, so a payslip that never reached Well is not a blocked row here, it is simply absent. Ask for the payroll read for what the payslips themselves say.

**Q: Can I trust a count of zero?**
A: Only when the read succeeded and the page did not fill. A page that filled means more rows exist and the count is a floor. A read that failed means the pile is unknown, and the answer says so rather than reporting it clear.

**Q: Does it categorize or post anything?**
A: No. Every tool it calls is a read. The cards carry the pickers, so a row is cleared on the card by the person looking at it, not by this skill.

---

## Installation

The file under `skills/unposted-and-blocked/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install unposted-and-blocked](https://github.com/WellApp-ai/skills/raw/main/dist/unposted-and-blocked.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/unposted-and-blocked/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "unposted-and-blocked". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill unposted-and-blocked
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
