<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Check bank and books

**Check that your bank and your books match, and re-run what missed rows.**

## What it does

Well matches invoices to bank payments and posts the result to its own ledger. Both steps can miss a row, for example when the matching ran before the bank payment arrived. This skill is the quick fix for that. It reads the gaps first. When a gap is there, the ask is the go-ahead: it asks the matcher to look again, re-runs the posting for the rows that were ready, and reports the result. It adds no matching or posting rule of its own. When the request says to change nothing, it only reads: it re-runs nothing, draws no card, reports each gap as a proposal and offers the re-run as one question.

The matching only queues work, so on a host that cannot wait, Well says the matching was relaunched and gives no count of what matched. The posting runs at once. Where Well can read the posting again, it gives the before and after counts. Where it cannot, it gives the rows that were ready before the re-run, and what the re-run sent across the workspace. Rows that wait on a category or a ledger account are handed to the cards that fix them, and entries of a closed month that are not on the accounting tool yet are handed to the export card. Nothing is sent to the accounting tool from here.

A read that fails is never reported as a clean month. A count from a read that was cut short is a floor, and the answer says so.

## Required data in Well

- **Bank connector** (required). The check compares the bank movements with the books. Without a bank behind the month there is nothing to compare.
- **A company workspace** (required). The ledger, the matching and the posting belong to one company's workspace.
- **Accounting connector** (optional). Only for the last line of the report: the entries of a closed month that are not on the accounting tool yet.
- **Invoicing connector** (optional). The matching looks for the bank payment behind each paid invoice. With no invoice in Well there is nothing for it to match, so a month reads clean without having been checked against any invoice.

## FAQ

**Q: Does it change my accounting tool?**
A: No. It reads Well's own ledger and sends nothing to your accounting tool. For a closed month it counts the entries that are not there yet and points you to the export card, which asks you to confirm.

**Q: Do I have to confirm each re-run?**
A: Your request is the go-ahead for the re-runs. In Well's chat the posting re-run may still ask for one confirm. Both re-runs write nothing outside Well, and re-running the posting books nothing twice.

**Q: Why does it not tell me how many invoices matched?**
A: On a host that cannot wait, the matching is only queued when the answer is written. Well says how many invoices it looks at again, and you can ask again for the count.

**Q: What if I name no month?**
A: It checks every open month since the last closed month, at most twelve. A clean month counts in one line. A month with gaps gets its re-run and one line.

**Q: Does it find invoices that are missing?**
A: No. A bank payment with no invoice behind it is a different check. Ask for the missing invoices of the month.

---

## Installation

The file under `skills/check-reconciliation/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install check-reconciliation](https://github.com/WellApp-ai/skills/raw/main/dist/check-reconciliation.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/check-reconciliation/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "check-reconciliation". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill check-reconciliation
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
