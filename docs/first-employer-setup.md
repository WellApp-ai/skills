<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# First employer setup

**Well reads your confirmed company, its public registry record and your accounting country, then lays out the one time employer setup list for that country, counted back from the start date you give, with the portal link, who to contact and your own company details written out for each step to copy.**

## What it does

The first hire is the moment a solo founder becomes an employer, and the list nobody hands you is the expensive part: a works number nobody mentioned, an accident insurer that back charges contributions to the start date, a risk assessment that has to exist on day one, an employer account the payroll engine refuses to run without.
This skill reads three things and writes one list. It reads which company is hiring, from the own company pinned on your workspace. It reads that company's public registry record, for the registered name, the registry number and the registered address you will retype into every portal form. It reads the country, incorporation date and tax id on your accounting settings, which is what decides whose list you get. Then it lays out the one time employer setup for that country, ordered by when each step has to be done, counted back from the start date you type.
Each step says what it is, who it is with, the portal link where there is one, and your own details written out beside it so the retyping is copying rather than hunting. Where a detail is not in Well, the activity or risk class a social insurer asks for is the usual one, the step says plainly that you have to supply it rather than inventing a value.
What it will not do is act. This skill never files an employer registration, a declaration or any statutory return, in any country, and no portal form is filled in for you. A number that comes back, an EIN, a Betriebsnummer, an ONSS number, a CCC, an INPS matricola, has no structured field to live in: keep it as free text or drop the letter into Well as a document. The country lists are reference text pinned when the skill was built, so treat them as a starting list to check with your accountant or payroll bureau, not as an authority, and not as legal advice.

## Required data in Well

- **A confirmed own company** (required). Which company in the workspace is the one hiring. It names the legal entity every registration is made in the name of.
- **The country on your accounting settings** (required). The country of incorporation decides whose first employer list you get. Without it the skill asks you for the country rather than guessing from the company name.
- **Your public registry record** (recommended). The registry number and registered address that every portal form asks for. Read from the public company registry, since the own company read withholds registry identifiers and addresses by design.
- **The start date you intend** (required). Typed by you. Well reads no hire, no contract and no offer, so the date the list counts back from is the one you give.
- **Your activity or risk class** (optional). The code a social insurer or accident insurer asks for. It is on no record Well reads, so you supply it or your bureau does.

## FAQ

**Q: Which forms does this cover?**
A: United States: the SS-4 that gets your EIN, the state employer registration (NYS-100 in New York), workers' compensation cover, and disability and paid family leave cover (DBL and PFL). Germany: the Betriebsnummer, the BG-Anmeldung with your accident insurer, and choosing a Krankenkasse. Belgium: ONSS employer identification, affiliation to a SEPP or prevention service, the règlement de travail, and the first hire contribution reduction. Italy: the INPS and INAIL registration for a first employee, the delega to a consulente or intermediario, and the DVR with its training and health surveillance. Spain: the inscripcion de empresa that gives you a CCC, Sistema RED authorisation and its apoderamientos, and the PRL documentation for onboarding. France: SPSTI membership and the visite de prevention, mutuelle and prevoyance under the DUE, the DUERP, and the compulsory postings and collective agreement information. Well reads none of these from a portal. It names each one so you know what is due, gives the link and the body to contact, and writes out your own company details to copy. The only one it can hold is a document you upload back to Well after it comes through, kept as a document rather than as a field.

**Q: Does Well file any of these for me?**
A: No, never. Not with the IRS, ELSTER, ONSS, the Agenzia delle Entrate, the TGSS or net-entreprises, and not with an insurer or a prevention service. Every step ends at a link and a hand-off. You or your payroll bureau click submit.

**Q: Can it fill in the portal forms for me?**
A: No. There is no form prefill on any government or insurer portal. The details you need are given as text beside each step so you copy them into the form yourself.

**Q: Where does my registration number go once it comes back?**
A: Nowhere structured. There is no employer registration record and no field for an EIN, a Betriebsnummer, an ONSS number, a CCC or an INPS matricola. Keep the number as free text, and drop the confirmation letter into Well as a document if you want it held somewhere.

**Q: Does this connect my payroll engine?**
A: No. It names the registration numbers a payroll engine will ask you for before it runs, and it can look up a payroll provider by name in the connector catalog. It does not connect, configure or run one, and it creates no employee, no contract and no payslip.

**Q: Are the dates a deadline Well tracks?**
A: No. They are planning dates counted back from the start date you typed. Nothing is monitored, nothing is chased, and no filing is watched for.

**Q: How current is the country list?**
A: It is reference text pinned when the skill was built, so it can lag a rule change. Treat it as a starting list to check with your accountant or payroll bureau. It is not legal, tax or employment law advice, and it does not judge which rule applies to your case.

**Q: Does it pick my insurer, health fund or prevention service?**
A: No. Choosing a Krankenkasse, a SEPP, an occupational health service, a mutuelle or a workers' compensation carrier is yours to do. The skill says the choice is due and by when, and names the kind of body you are choosing between.

---

## Installation

The file under `skills/first-employer-setup/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install first-employer-setup](https://github.com/WellApp-ai/skills/raw/main/dist/first-employer-setup.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/first-employer-setup/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "first-employer-setup". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill first-employer-setup
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
