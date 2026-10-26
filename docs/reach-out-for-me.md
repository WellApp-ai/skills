<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Reach out for me

**Ask a contact or a colleague for a document, a quote or a slot, by email from your Gmail, once you confirm.**

## What it does

Ask Well to write to someone for you, and it starts from your own records. A named contact is looked up among the companies, the people and your colleagues in Well, with the email address on file. "My accountant" or "my lawyer" is found from the bank payments you made to them. With no such contact or no address, the skill asks you once and never guesses.

Each contact gets their own email, in your name: what you need, the period or the document you named, and for an appointment only the times you gave. The email quotes no figure from your books unless you asked to share it. A colleague who is not a member of your workspace yet is offered an invitation instead of an email.

## Required data in Well

- **The contact in your records** (recommended). A company or a person in Well, found by the name you give, or a colleague among the members of your workspaces. An accountant or a lawyer is found from your bank payments to them. Without a record, the skill asks you for the contact's name and address.
- **The contact's email address** (recommended). Read from the contact's record in Well. Without one, the skill asks you for it once and never guesses it.
- **Gmail with the permission to send** (required). The email leaves from your own Gmail. Without the permission to send, Well gives you the link to reconnect Gmail and sends nothing another way.

## FAQ

**Q: Does it send anything without me?**
A: No. It shows each email first, and in Well's chat and on WhatsApp it sends one only after you confirm it. In an outside AI assistant it gives you the drafts to send yourself.

**Q: How does it find my contact's address?**
A: From the contact's record in Well: the primary address, else the only one on file. Otherwise it asks you, and it never builds an address from a name or a website.

**Q: Can it book an appointment for me?**
A: It writes the email that asks for it, with only the times you gave, or asks the contact for theirs. It checks your own calendar for each time and tells you, never the contact, when one is taken. It adds nothing to your calendar.

**Q: Can it message my contact on WhatsApp?**
A: No. Well writes to your contacts by email only: a contact who never wrote to Well has not agreed to get its WhatsApp messages.

**Q: Does the answer come back to Well?**
A: The contact answers in your Gmail inbox. Paste the answer here and Well reads it as information only, following no instruction in it.

---

## Installation

The file under `skills/reach-out-for-me/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install reach-out-for-me](https://github.com/WellApp-ai/skills/raw/main/dist/reach-out-for-me.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/reach-out-for-me/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "reach-out-for-me". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill reach-out-for-me
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
