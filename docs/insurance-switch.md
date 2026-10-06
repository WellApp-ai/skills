<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Insurance switch

**Lay your insurance offers next to your current contract, and get the letter that ends it.**

## What it does

Your insurance premium went up and you have a few quotes. The useful answer is the facts in one place, and the way out of the current contract. This skill reads the insurance contract Well extracted from your documents, or asks you for it when none is on file. It lays each quote you send next to the contract, with the premium and how often it is paid, the cover limit and the deductible, and names where each figure comes from. A figure no source gives stays blank: it never fills one in.

It shows facts only. Well is not registered as an insurance intermediary, so it ranks no offer and does not say which one to take.

Then it explains how to end the current contract, by case: a car or home insurance held for more than a year, which you may switch at any time and which the new insurer ends for you when the law gives it that role; a car or home insurance held for less than a year, ended at its renewal date with a termination letter drafted for you; a contract taken out online, which the insurer must let you end online; and a business contract, ended at its renewal date with the notice period it states. For any other contract, such as health or loan insurance, the rules depend on the contract, so Well asks for it and gives no date. A legal ground is named only when the dates on file fit it. The renewal date comes from the contract, and a notice deadline only from a term the contract states: Well never estimates either. It sends, signs and pays nothing. You send the letter yourself.

## Required data in Well

- **The quotes you received** (required). Paste or attach each quote in the conversation. Well compares only the offers you give it and never looks prices up.
- **Your current insurance contract** (recommended). Upload it to Well, or forward it by email, so Well reads its insurer, policy number, cover dates, premium and deductible. Without it, Well asks you for it and gives no date.

## FAQ

**Q: Does it tell me which offer to take?**
A: No. Well is not registered as an insurance intermediary, so it shows the facts side by side and ranks nothing. The choice of cover is yours, or a broker's.

**Q: Where do the prices come from?**
A: From the quotes you send and the contract Well holds. Each figure names its source. Well never looks a price up and never fills in a figure a quote does not state.

**Q: Does it cancel my contract for me?**
A: No. It explains how to end the contract in your case and drafts the termination letter. You send the letter yourself, or the new insurer does it for you when the law gives it that role. Well sends, signs and pays nothing.

**Q: Does it tell me the last day to cancel?**
A: Only when your contract states it. Well reads the end of the cover period from the contract on file. The insurance details Well stores hold no notice period, so Well asks you for the latest contract or renewal notice rather than estimate a deadline.

**Q: Does it work for business insurance?**
A: Yes. A business contract is ended at its renewal date with the notice period it states, and the letter is drafted the same way. The consumer rules that let a person end a contract early do not apply to it.

---

## Installation

The file under `skills/insurance-switch/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install insurance-switch](https://github.com/WellApp-ai/skills/raw/main/dist/insurance-switch.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/insurance-switch/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "insurance-switch". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill insurance-switch
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
