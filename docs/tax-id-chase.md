<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Tax id chase

**The companies you deal with that carry no tax identifier, listed before year end.**

## What it does

Ask which of the companies you deal with have no tax number on file, and the skill reads your company records and lists the ones holding neither a tax id nor a registration number. You get the count over the whole set, not a page of it, and the rows on screen so you can start asking.
From that list you can open one company and see its registry identity in detail: its legal name, its registration number, its VAT number, its billed establishment and its postal address, each one either held or plainly blank. A detail that Well cannot store yet is named as such rather than left looking like something you forgot to fill in.
What the skill stays away from matters as much as what it does. It cannot rank the list by how much you paid each company, because the one arithmetic read over transactions groups by month, currency and category and carries no counterparty axis. It applies no reporting threshold, because Well holds no threshold figure, so the list is every company missing an identifier rather than the subset a form would cover. It reports an identifier as held without re-checking it against a registry, and it files nothing.

## Required data in Well

- **Company records in your workspace** (required). The list is read from your companies, so a workspace with none has nothing to chase.
- **An accounting or invoicing connector** (required). This is what puts the companies you deal with into the workspace in the first place. Either one on its own is enough.
- **Registry enrichment on a company** (recommended). The registration number and the tax id are filled by enrichment against a public register. Without it, a company can read as missing an identifier that a register would have supplied.

## FAQ

**Q: Can it sort the list by how much I paid each company?**
A: No. The one arithmetic read over transactions groups by month, currency and category, and it carries no counterparty axis, so a paid per company total has no source. Paging through transactions to build one would produce a figure off a sample rather than off the whole set, so the skill refuses it instead of guessing.

**Q: Does it know which companies cross a reporting threshold?**
A: No. Well holds no threshold figure for 1099-NEC, DAS2, fiche 281.50 or any other form, so the skill lists every company missing an identifier rather than the subset a form covers. Which of them a form reaches is your call or your accountant's.

**Q: Can it tell me which payment rail I paid them on?**
A: No. The scheme a transaction records covers SEPA, SWIFT, ACH, Faster Payments, Bacs, wire and other, with no card value and no third party network value, and the column is often empty. A rail answer built on that would be a guess.

**Q: Does it check that an identifier on file is valid?**
A: No. It reports the value as held. It does not re-check it against a public register and does not tell you whether the registration is still current.

**Q: Can it file or prefill the form for me?**
A: No. It produces the chase list and the per company detail. Filing stays with you.

**Q: Why is the tax id column not in the table?**
A: The table renders the companies view's own columns, which lead with the company composite so a row is identifiable at a glance. The count comes from the text beside the table, and the identifier detail comes from opening one company.

---

## Installation

The file under `skills/tax-id-chase/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install tax-id-chase](https://github.com/WellApp-ai/skills/raw/main/dist/tax-id-chase.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/tax-id-chase/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "tax-id-chase". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill tax-id-chase
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
