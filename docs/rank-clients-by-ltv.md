<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Rank clients by LTV

**Find out what each customer is worth over its whole life, ranked from the most valuable down.**

## What it does

Ask your AI assistant to rank your clients by lifetime value, and Well measures it from the invoices you issued over up to the last five years: for each customer, the average invoice net of tax, times how many invoices they receive per month, times how long a customer stays. The result is a bar chart with one bar per customer, from the most valuable down, and the average lifetime value per customer.

The lifespan is measured, not assumed. A customer counts as churned when no invoice has followed for twice its usual interval between invoices, and at least three months. The lifespan is one over the monthly churn across your portfolio, capped at five years. A customer that started recently is measured over its own short span, and the answer says so.

It is a revenue lifetime value, stated as such: no margin or cost is applied, so it tells you what a customer is expected to bill over its life, not the profit it brings.

## Required data in Well

- **Invoicing / accounting connector** (required). This is where your issued customer invoices come from.
- **Company profile confirmed in Well** (required). The skill needs to know which company is yours so it can tell your issued (customer-facing) invoices apart from bills you have received.

## FAQ

**Q: How is lifetime value calculated?**
A: Average order value times monthly purchase frequency times the expected lifespan in months. The average order value is a customer's invoiced revenue net of tax divided by its number of invoices, and the frequency is its invoices per month since its first invoice.

**Q: How does it decide a customer has churned?**
A: A customer counts as churned when no invoice has followed for twice its usual interval between invoices, and at least three months. The lifespan is one over the monthly churn across your customers, capped at five years.

**Q: Does it include margin or costs?**
A: No. It is a revenue lifetime value: what a customer is expected to bill over its life. Taking margin into account would need your cost per customer, which invoices alone do not carry.

**Q: Does it count unpaid invoices?**
A: Yes. It counts every invoice you issued and did not cancel, net of tax, with credit notes taken off. Payment status plays no part, so a customer is not counted as lost because one payment is late.

**Q: Can it rank by something else?**
A: Yes. Ask for a shorter window or a currency and the ranking is measured again over it.

---

## Installation

The file under `skills/rank-clients-by-ltv/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install rank-clients-by-ltv](https://github.com/WellApp-ai/skills/raw/main/dist/rank-clients-by-ltv.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/rank-clients-by-ltv/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "rank-clients-by-ltv". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill rank-clients-by-ltv
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
