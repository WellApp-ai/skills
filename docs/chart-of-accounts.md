<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Chart of accounts

**Read the accounts your workspace posts to, number by number.**

## What it does

Ask what chart of accounts your workspace is using, and the answer is the list itself: every ledger account held in the workspace, ordered by number, with its name, its type and its class beside it.
The list is read, never written. The accounting graph is a projection owned by the posting pipeline, so this skill creates no account, renames none and deactivates none. A number appears once: a deactivated or removed account drops out of the read rather than showing twice under the same number.
Two things the list deliberately does not carry. It carries no statutory code, because the translation from a Well account to a country's legal account runs when a ledger is exported, and no chart level read reaches it. It carries no binding from a Well role, such as the account collected VAT posts to, because that binding is read by the export, the seeder and the sweeper alone. The class on a row is the first digit of the Well account number, which is the Well class and not a national one: Well 1112 is a bank account and reads as class 1, while its French statutory home is class 5. Where those distinctions matter, the answer says so rather than implying a mapping it cannot show.

## Required data in Well

- **A Well workspace** (required). The chart is seeded into the workspace when the workspace is provisioned, so a workspace that exists already has one to read. No connector is needed for this answer.
- **An accounting connector** (optional). An imported book adds the accounts its own chart carries, so the list grows beyond the seeded one. Without it you read the seeded chart, which is a real chart rather than an empty state.

## FAQ

**Q: Does it show which Well account collected VAT posts to?**
A: No. That binding between a Well role and an account is read by the export, the seeder and the sweeper only. Nothing on the read side emits it, so the list names accounts and not roles.

**Q: Does it show each account's statutory code?**
A: No. The translation from a Well account to a country's legal account runs when a ledger is exported. It is wired to no chart level read, so an answer that showed a statutory code here would be inventing one.

**Q: Can it tell me which accounts have no statutory mapping?**
A: No. That list is built while an export walks the posted entry lines of one fiscal period, so it only ever covers accounts something posted to. At setup, with nothing posted, it is empty, which would read as "every account is mapped" when nothing was checked.

**Q: Is the class on each row a PCG class?**
A: No. The class is the first digit of the Well account number. Well 1112 is a bank account and reads as class 1, while its French statutory home is class 5. Read the class as Well's own grouping.

**Q: Can I add, rename or deactivate an account here?**
A: No. The accounting graph is a read-only projection owned by the posting pipeline. This skill reads it and writes nothing.

**Q: Can I download the chart as a file?**
A: No. The answer is a table on screen and the list in the reply. No file is produced and nothing is sent anywhere.

**Q: Can the same account number show up twice?**
A: No. The read covers live rows only, and a live number is unique in the workspace, so a removed account cannot come back as a duplicate row.

---

## Installation

The file under `skills/chart-of-accounts/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install chart-of-accounts](https://github.com/WellApp-ai/skills/raw/main/dist/chart-of-accounts.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/chart-of-accounts/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "chart-of-accounts". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill chart-of-accounts
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
