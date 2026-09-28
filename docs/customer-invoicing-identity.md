<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Customer invoicing identity

**What Well holds about a customer's legal identity, and what is still blank.**

## What it does

Ask about one customer and get their invoicing identity as Well holds it today: the legal name on the register, the registry number, the establishment being billed, the postal address and the VAT number, each shown with where the value came from.
Every value is read from that customer's own company record in your workspace. Nothing is guessed from the company name, and no public directory is queried, so a blank row means Well holds nothing rather than that nothing exists.
Some details an electronic invoice needs have no home in Well yet, such as a routing address or a buyer reference. The read names those separately, so you are never asked for a value the product cannot keep. For the other side of the relationship, which company your own workspace is, ask `confirm-my-company` instead.

## Required data in Well

- **A company record for the customer** (required). The read is addressed to one customer by its company id, so that customer has to exist as a company in your workspace before there is anything to read.
- **Registry values on that company record** (recommended). The legal name, the registry number, the establishment number and the VAT number are read from the registry values held on the record. Without them those rows come back blank.
- **A primary location on that company record** (recommended). The postal address and the place of supply country are derived from it, so a record with no location shows both as blank.

## FAQ

**Q: Does this send my invoice anywhere?**
A: No. It reads identity and reports it. It does not transmit an invoice to any platform or to a tax authority, and it produces no Factur-X, UBL or CII file.

**Q: Does it check a public company register?**
A: No. It reads your workspace's own company records only. A blank row means Well holds no value for it, which is different from the value not existing anywhere.

**Q: Why are some details listed as something Well cannot store?**
A: Because no column holds them yet. The routing address and the buyer reference on a business customer, and the customer type, supply category, VAT rate and VAT point basis on an individual, are named separately for that reason. They are not gaps you can close, so the skill never asks you for them.

**Q: Does it say who entered each value?**
A: No. Each value is marked registry or derived, and nothing more. The context graph records no per column authorship, so naming a person would be an invention.

**Q: Can I check several customers at once?**
A: One customer per call. Ask again for the one after it, and each answer stays about a single company.

**Q: What happens when I have more than one workspace?**
A: The read answers for one workspace and refuses to choose which, so the workspace is pinned first and rides every call.

---

## Installation

The file under `skills/customer-invoicing-identity/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install customer-invoicing-identity](https://github.com/WellApp-ai/skills/raw/main/dist/customer-invoicing-identity.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/customer-invoicing-identity/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "customer-invoicing-identity". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill customer-invoicing-identity
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
