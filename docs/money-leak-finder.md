<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Money leak finder

**Find the double charges and price rises in your bank debits, each with the dates and amounts your bank shows.**

## What it does

Small costs creep in and nobody reads the bank feed line by line. Ask your AI assistant to find your money leaks, and it reads the last few complete months of debits, groups them by the vendor company behind each payment, and works out how often each vendor charges you. The vendor is an exact company identity, never the memo text on the line, so one vendor that shows up under two labels stays one vendor.

Three things get flagged. A duplicate is the same amount to the same vendor a few days apart. A price rise is a fixed-price charge that came in higher than the price before it. A new recurring vendor is a company that had never charged you in the months before and now charges on a schedule. The first two list the charges themselves, with the amounts your bank shows. The skill adds no overpaid amount and no total, because no Well tool computes those figures yet. The third is a cost to decide on, listed with its latest amount and never called recoverable.

The skill is careful about what it will not call a leak. A bill that changes every month, such as usage based hosting, is counted and not tested for price rises. A vendor that charges the same amount several times a week as a matter of course is not a duplicate. A charge followed by a credit from the same vendor stays on the list, with the credit beside it. Rows the bank synced twice are dropped before anything is compared.

Every flag is a lead to check, not a verdict. The skill does not look for charges after a cancellation, because Well holds no cancellation date for a subscription. It does not put an owner on a line. For a line that also has no supplier invoice, the assign missing invoices skill does that.

## Required data in Well

- **Bank connection** (required). This is where the debits the scan reads come from. Without a bank there is nothing to compare.

## FAQ

**Q: Can it find charges that continued after I cancelled?**
A: No. Well holds no cancellation date for a subscription, so no charge can be called late. The skill says so rather than guessing from the memo on the line.

**Q: Does a flag prove I was overcharged?**
A: No. A flag is a lead with the vendor, the dates and the amounts beside it. A second charge can be a real second purchase, and a price rise can be one you agreed to. You decide, and the skill never claims otherwise.

**Q: Why did it skip the price on one of my vendors?**
A: A bill that changes every month has no fixed price to compare against. The skill counts those vendors and leaves them untested instead of flagging every normal change.

**Q: How far back does it look?**
A: It reads the last three complete months for leaks and the six months before them as history. A vendor is called new only if it never charged you in that history, and the answer states how long the history was. You can name a different window.

**Q: What if the vendor already refunded me?**
A: A credit from the same vendor after the charge keeps the line on the list, with the credit's date and amount beside it. The skill does not judge whether the credit covers the charge, so check the amounts yourself.

**Q: Why are some transactions not scanned?**
A: A row with no direction, no vendor company, or a payment that never settled cannot be compared fairly. The skill counts each group and reports the counts beside the result, so you can tell a clean scan from a thin one.

**Q: What if I pay vendors in several currencies?**
A: Each charge keeps its own currency, and you get one list per currency. The skill converts nothing and never adds two currencies together.

---

## Installation

The file under `skills/money-leak-finder/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install money-leak-finder](https://github.com/WellApp-ai/skills/raw/main/dist/money-leak-finder.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/money-leak-finder/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "money-leak-finder". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill money-leak-finder
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
