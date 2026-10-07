<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Call and claim

**Claim a refund or a compensation with the evidence in hand, and know what to say when you call.**

## What it does

Ask Well to claim a refund or a compensation, and it starts from your records: the invoice or booking from that business, and the debits your bank shows to it. Every fact in the claim comes with its date, its amount and the record behind it. When Well holds no invoice and no debit for the business, it asks you for the booking or the invoice before it writes anything.

A right is named only when every fact it needs is in your records or in what you tell it. A flight delayed by 3 hours or more, from an airport in the EU, is named under the EU rule for air passengers, with the airline's right to refuse for extraordinary circumstances stated beside it. When a fact is missing, the right is marked to confirm and the missing fact is named. The claim never states an amount that no record holds, and never says the money will come back.

When a call is the faster way, the skill writes the script you read: who you are, the reference, the facts, what you ask, and what to note. Well does not place the call. In Well's chat and on WhatsApp the claim email goes out from your Gmail only after you confirm it on the confirmation Well shows. In an outside AI assistant, you get the draft and send it from your own mail app.

## Required data in Well

- **The invoice or booking** (required). The claim quotes the invoice or booking Well holds for the business. Without one, and with no bank debit to it, the skill asks you for the booking or the invoice and writes nothing.
- **Banking connector** (recommended). The debits to the business show what you paid and when. A card payment is read from the card's debits when the card account is in Well.
- **The business's email address and phone number** (recommended). Read from the business's record in Well. Without an email address, the skill asks you for it once and never guesses it. Without a phone number, the call script tells you where to find it.

## FAQ

**Q: Does Well call the business for me?**
A: No. It writes the script you read on the call: who you are, the reference, the facts with their dates and amounts, what you ask, and what to note during the call. You place the call yourself.

**Q: Which rights does it name?**
A: Only a right whose facts are all in your records or in what you tell it, such as the EU rule for a flight that arrived 3 hours or more late, or a card dispute for a card payment. When a fact is missing, it marks the right to confirm and names the missing fact.

**Q: Will it tell me how much I will get?**
A: No. It asks for the amount a record shows, such as the invoice total for a refund. For a flight compensation it states no figure, because the amount depends on the flight distance and the delay, and the airline sets it. The business or the bank decides.

**Q: What if Well has no invoice for it?**
A: It says what it looked for and asks you for the booking or the invoice. It writes no claim on a purchase it cannot see.

**Q: Does it send anything without me?**
A: No. It shows the exact email first. In Well's chat and on WhatsApp it sends only after you confirm on the confirmation Well shows. In an outside AI assistant it gives you the draft to send yourself.

---

## Installation

The file under `skills/call-and-claim/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install call-and-claim](https://github.com/WellApp-ai/skills/raw/main/dist/call-and-claim.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/call-and-claim/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "call-and-claim". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill call-and-claim
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
