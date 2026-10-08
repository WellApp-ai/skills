<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Subscription actions

**Cancel a subscription, ask for a better price or contest a double debit, with your bank's facts in the email.**

## What it does

Ask Well to cancel, renegotiate or contest a subscription, and it starts from what your bank shows: the supplier's last debits, how often they come, and whether the amount moved. Every email quotes those facts, never a figure the bank does not hold.

A cancellation leads with the notice date and the end of service, because a cancellation cannot be taken back. Those dates come only from a contract on file. With no contract, the answer says the notice date is unknown and asks you for the contract, and the email asks the supplier to confirm the end of service in writing. Because many suppliers also ask you to cancel from the account settings, the answer points to the supplier's own cancellation page when the assistant can search the web, and says so when it cannot.

A double debit is two debits to one supplier of the same amount, a few days apart. It is always marked to check, because two real purchases can look the same. The email asks the supplier to check and refund the second debit, and the answer gives the bank route if the supplier does not: a refund request for a SEPA direct debit, marked to confirm because it depends on the mandate and on your bank agreement, or a card dispute with the bank that issued the card. A right is named only when your records show every fact it needs.

A cancellation and a contest act on the supplier's own site first, through the Well browser extension in your own signed-in browser: Well gives you a link that you open on a computer with a Chromium-based browser and the extension, and the task runs once you click Open in the extension. The email to the supplier is the fallback, when the supplier has no site Well knows or the extension cannot be used. In Well's chat and on WhatsApp the email goes out from your Gmail only after you confirm it on the confirmation Well shows. In an outside AI assistant, you get the draft and send it from your own mail app.

With several workspaces, the skill works in rounds, one workspace at a time, the workspace that pays the most first, and each round names its workspace. When you answer a subscription recap with lead numbers, it shows the plan, biggest amount first, then acts on the leads you picked and on no other.

## Required data in Well

- **Banking connector** (required). The facts in every email come from the supplier's debits in your bank. A subscription paid by card is read from the card's debits when the card account is in Well.
- **The supplier's email address** (recommended). Read from the supplier's record in Well. Without one, the skill asks you for it once and never guesses it.
- **The contract with the supplier** (recommended). The notice date and the end of service come only from a contract on file. Without one, the skill says the notice date is unknown and asks for the contract.

## FAQ

**Q: Does it cancel the subscription for me?**
A: When the Well browser extension can reach the supplier's site, yes: the extension cancels from the supplier's own site in your browser, once you open Well's link and start the task, and it hands the tab back to you for a sign-in or a payment step. Otherwise it writes the cancellation email to the supplier and, in Well's chat and on WhatsApp, sends it from your Gmail once you confirm. It does not stop the debit at your bank. When the assistant can search the web, it also gives the supplier's own cancellation page with its source and the steps that page states. Otherwise it says the supplier may require cancelling from your account settings.

**Q: How does it know my notice date?**
A: Only from a contract on file. Without one, it says the notice date is unknown and asks you for the contract. It never estimates a date from the payments.

**Q: Is a double debit a sure claim?**
A: No. Two debits of the same amount a few days apart can be two real purchases. It is always marked to check, with both dates and amounts, and the email asks the supplier to check and refund the second one.

**Q: Will I get my money back?**
A: It never promises an amount or a result. It asks the supplier, and if the supplier does not refund, it gives the bank route that fits how the debit was paid. The supplier or the bank decides.

**Q: Does it find a cheaper offer?**
A: When the assistant can search the web, it quotes one comparable offer with its source. It never invents a price, and it never calls a lower price a saving before the supplier agrees.

**Q: Does it send anything without me?**
A: No. A task for the extension waits until you open Well's link and start it. An email is shown whole first; in Well's chat and on WhatsApp it is sent only after you confirm on the confirmation Well shows. In an outside AI assistant it gives you the draft to send yourself.

---

## Installation

The file under `skills/subscription-actions/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install subscription-actions](https://github.com/WellApp-ai/skills/raw/main/dist/subscription-actions.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/subscription-actions/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "subscription-actions". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill subscription-actions
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
