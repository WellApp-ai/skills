<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Insurance assessment

**Know which insurance you hold, what it covers and when it renews, with a brief item before each renewal.**

## What it does

A company holds a few insurance contracts: professional liability, office, cyber, legal protection. Their renewal dates sit in documents nobody reopens. This skill reads the insurance contracts Well extracted from your documents and lists each one: the insurer, the cover, the premium and the day the cover ends. It reads the insurance direct debits of your bank beside them, so a premium you pay with no contract on file shows up.

Well adds nothing on its own. It shows the brief items it would add, one per renewal, and waits for your yes. On a yes, each renewal gets one item in your morning brief before its date, and a second run adds no second item. Well never estimates a renewal date: a debit with no contract on file gets no date, and Well asks you for the contract.

Well does not buy, change or end a contract. To compare quotes or end a contract, ask for `insurance-switch`.

## Required data in Well

- **Insurance contracts in your documents** (required). Upload a policy or a renewal notice, or forward it by email, so Well reads its insurer, cover dates and premium.
- **Your bank** (recommended). Well reads the insurance direct debits, so a premium with no contract on file shows. Without it, Well lists only the contracts it holds.

## FAQ

**Q: Does Well keep my insurance contracts?**
A: Yes. Well reads them from your documents and your bank, and tells you each renewal date. It adds an item to your brief only after your yes.

**Q: Does Well buy, change or cancel a policy?**
A: No. A comparison of quotes or a termination letter is another skill, and each step waits for you.

**Q: What if I pay a premium but Well holds no contract?**
A: Well names the debit as read from the bank, gives no renewal date, and asks you for the contract.

---

## Installation

The file under `skills/insurance-assessment/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install insurance-assessment](https://github.com/WellApp-ai/skills/raw/main/dist/insurance-assessment.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/insurance-assessment/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "insurance-assessment". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill insurance-assessment
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
