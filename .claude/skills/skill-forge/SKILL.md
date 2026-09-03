---
name: skill-forge
description: Create high-quality Agent Skills and SKILL.md files from a mission and short description. Use this skill when the user wants to write, improve, optimize, package, distribute, or rank an AI agent skill for skill.sh, Claude Code, Codex, Cursor, OpenCode, Gemini CLI, or other Agent Skills-compatible systems. This skill researches best practices, drafts a full SKILL.md, improves trigger/discovery wording, validates structure, and outputs a ready-to-distribute skill.
---

# Skill Forge

Create a complete, high-quality `SKILL.md` from a short skill mission and quick description.

The output must be clear, predictable, concise, and optimized for skill discovery without becoming spammy or over-written.

## Inputs

Expect the user to provide:

- Skill mission
- Quick description
- Target agent or registry, if known
- Required tools, scripts, references, or runtime assumptions, if any

If details are missing, infer reasonable defaults and proceed. Ask follow-up questions only when the missing detail would materially change the skill.

## Output

Produce a complete `SKILL.md` ready to distribute.

Default output format:

```markdown
---
name: ...
description: ...
---

# ...

## Purpose

...

## When to use this skill

...

## Inputs

...

## Workflow

...

## Output requirements

...

## Quality checks

...

## Examples

...
```

Do not include research notes, agent debate, or internal scoring in the final output unless the user asks for it.

## Core principles

Follow these rules for every generated skill:

1. Make the `description` do real discovery work.

    - Front-load the most important trigger terms.
    - Include what the skill does and when to use it.
    - Include adjacent phrases users are likely to say.
    - Avoid vague wording like "helps with documents" or "improves workflow."

2. Keep the body lean.

    - Prefer direct instructions over long explanations.
    - Use progressive disclosure when the skill needs large references.
    - Move detailed docs to `references/`, reusable scripts to `scripts/`, and templates/assets to `assets/`.

3. Write for agent execution.

    - Use imperative instructions.
    - Define exact inputs, workflow, outputs, edge cases, and quality checks.
    - Prefer deterministic scripts for repetitive validation or transformations.
    - Avoid relying on vibes, hidden assumptions, or ambiguous judgment.

4. Optimize for discovery without keyword stuffing.

    - Use natural synonyms and trigger phrases.
    - Put the strongest terms in `name`, `description`, headings, and examples.
    - Do not repeat keywords unnaturally.
    - Do not make unsupported claims.

5. Make the skill safe to distribute.

    - Do not include instructions that exfiltrate data, bypass permissions, or hide actions.
    - Do not assume network access, installed packages, credentials, or MCP tools unless stated.
    - Mention required tools explicitly when needed.
    - Keep examples complete and runnable where possible.

## Agentic workflow

Use this multi-agent loop. If subagents are available, run them as separate agents. If not, simulate the roles sequentially and keep their work clearly separated in scratch space.

### 0. The Intake Normalizer

Convert the user's rough request into a working brief.

Produce:

- Mission
- Target users
- Target agent surfaces
- Main trigger phrases
- Negative triggers
- Inputs
- Outputs
- Required tools or dependencies
- Any domain constraints
- Success criteria

If the user only provides a mission and short description, infer the rest.

### 1. The Researcher

Build a compact context pack before drafting.

Use available web search, docs search, repository search, registry search, MCP tools, or local references.

Research these areas:

- Official Agent Skills or platform documentation
- Current SKILL.md structure and frontmatter requirements
- Similar skills on skill.sh or public repositories
- Domain-specific best practices for the skill's mission
- Search terms users would use to discover this skill
- Common failure modes or security risks

The context pack must include:

- Structural requirements
- Discovery keywords
- Trigger phrases
- Similar skill patterns worth copying
- Similar skill patterns to avoid
- Any tool/runtime assumptions
- Citation/source notes for internal use

Do not paste long research into the final SKILL.md.

### 2. The Template Architect

Create the skeleton before section writing.

Responsibilities:

- Choose a valid skill name.
- Draft a strong `description`.
- Choose the right sections.
- Decide whether the skill needs `references/`, `scripts/`, or `assets/`.
- Define exact output shape.
- Define validation checks.

Name rules:

- Lowercase letters, numbers, and hyphens only.
- Maximum 64 characters.
- No reserved or vendor-owned terms unless the user explicitly requires them and the target allows it.
- Prefer specific names over generic names.
- Good: `postgres-query-tuning`, `stripe-webhook-debugger`, `sales-call-summarizer`
- Bad: `helper`, `ai-workflow`, `best-skill-ever`

Description rules:

- Maximum 1024 characters.
- Start with the core capability.
- Include concrete trigger words.
- Include "Use when..." language.
- Mention boundaries when useful.
- Avoid hype.

Description formula:

```text
[Verb] [specific artifact/task] for [domain/use case]. Use when the user asks to [trigger phrase 1], [trigger phrase 2], [trigger phrase 3], or works with [file/tool/domain terms]. Do not use for [boundary] unless [condition].
```

### 3. The Drafter

Model: Sonnet 5, or the strongest available writing/coding model.

Write the first complete pass for one section at a time.

For each section:

- Use the working brief.
- Use the Researcher's context pack.
- Write plainly.
- Prefer concrete workflow instructions.
- Avoid bloated explanations.
- Include examples only when they improve execution.
- Do not optimize for keywords yet.
- Do not invent unsupported capabilities.

The Drafter must produce:

- Section text
- Assumptions made
- Risks or gaps

### 4. The Marketer

Model: Sonnet 5, or the strongest available search/discovery model.

Be aggressive, but only produce recommendations. Do not directly rewrite the final skill.

For each drafted section, recommend:

- Better trigger phrases
- Missing synonyms
- High-intent search terms
- Registry/category terms
- Stronger headings
- Description improvements
- Example prompts likely to trigger the skill
- Terms that should appear once, not repeatedly

The Marketer should optimize for:

- skill.sh search discovery
- Agent Skills registry matching
- Claude/Codex implicit skill activation
- Human readability in listings
- Clear differentiation from similar skills

The Marketer must avoid:

- Keyword stuffing
- Misleading capability claims
- Vendor spam
- Repeating the same term unnaturally
- Turning the SKILL.md into a landing page
- Adding fake compatibility claims

Marketer output format:

```markdown
## Discovery recommendations for [section]

### Add
- ...

### Replace
- `old phrase` → `new phrase`

### Avoid
- ...

### Reason
...
```

### 5. The Reviewer

Review the Drafter's section and the Marketer's recommendations.

Responsibilities:

- Incorporate useful discovery terms.
- Reject spammy or misleading terms.
- Keep the section concise.
- Preserve execution clarity.
- Remove repetition.
- Fix contradictions.
- Tighten language.
- Ensure the skill still reads like agent instructions, not marketing copy.

The Reviewer owns the final section text.

Reviewer decision rules:

- If a keyword improves matching and reads naturally, include it.
- If a keyword makes the text feel stuffed, include it once in the most relevant place.
- If a recommendation makes a false promise, reject it.
- If a section becomes too long, move detail to a referenced file or remove it.
- If the skill needs a script but the user did not ask for implementation, describe the script contract instead of inventing full code.

### 6. The Validator

Run a final quality gate over the complete `SKILL.md`.

Check:

- Frontmatter exists and is valid.
- `name` is lowercase, hyphenated, and under 64 characters.
- `description` is non-empty, specific, and under 1024 characters.
- `description` includes what the skill does and when to use it.
- Main body is lean and structured.
- Instructions are imperative and actionable.
- Inputs and outputs are clear.
- Examples are concrete.
- Edge cases are covered.
- Tool assumptions are explicit.
- Any references/scripts/assets are mentioned with relative paths.
- No unreferenced bundled resources are implied.
- No hidden data access or unsafe behavior.
- No keyword stuffing.
- No stale or time-sensitive claims unless dated.
- The skill can be understood by a human in under two minutes.
- If the skill integrates with Well's MCP, it follows the Well MCP skill standard (MCP-endpoint check before account resolution, account resolution/DCR, connector-sufficiency check, plain-workspace-link fallback, optional at-most-once-per-conversation SOC-2/GDPR compliance mention).
- The login/DCR step and the connector-sufficiency step each say what happens once unblocked: retry (or re-check) immediately in the same turn and continue the workflow — never leave the agent waiting on the user to say "continue" or restate the request. This applies only to those two steps — it must not weaken any deliberate confirmation gate (e.g. a write skill's explicit-confirm-before-write step, or an ask-the-user-to-disambiguate branch).
- Any URL template the skill emits (including MCP fallback links) has been confirmed to resolve — no assumed query params or routes.
- If the skill's headline number depends on categorized/classified underlying data, the skill checks and discloses coverage rather than presenting it as unconditionally complete.
- If the skill's output could reasonably be visual (a chart/comparison), the skill either renders it appropriately or explicitly asks the user's preferred format — and when asking, names the chart shape that best fits the data (trend over time → line/area, composition at a point in time → pie/donut, comparison across categories → bar) rather than leaving the question fully open.
- The skill resolves to exactly one workspace and stays there — it asks which one when several exist, and never queries or merges data across multiple workspaces in one run.
- If more than one data source could compute the same headline figure, the skill asks which is the source of truth rather than silently preferring one.
- On a transient MCP-call failure, the skill retries once before falling back to the workspace-link fallback — it doesn't dead-end on a blip.
- The skill's `Output requirements` discloses connector coverage — which connector categories the skill actually reads are connected versus still missing — so the user can tell a full picture from one gated by what's connected today.
- The skill's `Output requirements` ends with a one-line pointer to a related follow-up skill, naming the next question that skill answers, rather than dead-ending.

If validation fails, send the skill back to the relevant role:

- Metadata issue → Template Architect
- Weak section → Drafter
- Discovery issue → Marketer
- Clarity/control issue → Reviewer
- Safety/tooling issue → Validator revision pass

Repeat at most two revision loops unless the user asks for deeper iteration.

### 7. The Compactor

Run after the Validator approves the skill's structure and content. Compact only the body — Purpose, When not to use this skill, Inputs, Workflow, Output requirements, Quality checks, Examples, Tooling, File layout, Edge cases, whichever the skill uses. Never touch the frontmatter `description` or the `When to use this skill` section — those exist to be matched and found, not shortened, and stay exactly as the Reviewer left them.

Target: keep the SKILL.md body under 500 lines (~5k tokens), the platform's documented ceiling for a skill loaded into context. Count lines across the full file after the Validator's pass.

Ramp aggressiveness against how close the body sits to the limit:

- Under 400 lines — no action.
- 400-450 lines — light pass. Tighten wording, merge short adjacent paragraphs, cut redundant phrasing. Preserve every instruction, example, and edge case.
- 450-500 lines — aggressive pass. Compress step lists to one imperative line each, trim examples to the minimum that still demonstrates the behavior, and move reference-heavy content (long tables, exhaustive edge-case lists, background rationale) into `references/` with a pointer left in its place.
- Still over 500 lines after the aggressive pass — stop cutting silently and ask the user to choose:

  - Rewrite the body in stripped, telegraphic "caveman" phrasing (drop articles and connectors) to save more lines at the cost of a less polished read.
  - Accept further quality-degrading cuts — drop less-common edge cases, merge or remove examples, shorten the workflow to only the critical path.
  - Split more content into `references/`, `scripts/`, or `assets/`, even if it makes the file layout heavier.
  - Ship it over the recommended size as-is — 500 lines is a documented best practice, not a hard platform limit.

  State the current line count and how far over target it is so the user can judge the tradeoff.

## Recommended section set

Use this default structure unless the skill requires a different one:

```markdown
# [Human-readable Skill Name]

## Purpose

One short paragraph describing the skill's job.

## When to use this skill

Concrete trigger conditions.

## When not to use this skill

Boundaries and exclusions.

## Inputs

Expected user inputs, files, context, tools, or configuration.

## Workflow

Step-by-step instructions the agent should follow.

## Output requirements

Exact final answer, file, code, or artifact requirements.

## Quality checks

Validation checklist before finishing.

## Examples

A few realistic user requests and expected behavior.
```

For coding, data, document, or tool-heavy skills, add:

```markdown
## Tooling

Required tools, commands, MCP servers, package assumptions, or scripts.

## File layout

Suggested `references/`, `scripts/`, and `assets/` structure.

## Edge cases

Known tricky cases and required behavior.
```

## Skill template standard

When generating a new skill, use this template as the gold standard and adapt it to the mission.

```markdown
---
name: [lowercase-hyphen-name]
description: [Specific capability]. Use when the user asks to [trigger 1], [trigger 2], [trigger 3], or works with [domain/tool/file terms]. [Optional boundary sentence.]
---

# [Readable Skill Name]

## Purpose

[One concise paragraph. State exactly what this skill helps the agent do.]

## When to use this skill

Use this skill when:

- [Concrete trigger]
- [Concrete trigger]
- [Concrete trigger]
- [Adjacent task/query phrasing]

## When not to use this skill

Do not use this skill when:

- [Boundary]
- [Boundary]
- [Boundary]

## Inputs

The user may provide:

- [Input type]
- [Input type]
- [Input type]

If required information is missing, infer safe defaults and proceed. Ask a follow-up only when the missing detail would materially change the result.

## Workflow

1. Parse the user's request.
   1. Identify the target artifact.
   1. Identify constraints, tools, audience, and success criteria.
   1. Note any missing but important assumptions.

2. Gather required context.
   1. Use available files, docs, web search, MCP tools, or local references when relevant.
   1. Prefer official or primary sources.
   1. Keep context compact and task-specific.

3. Produce the first pass.
   1. Follow the required structure.
   1. Use direct, imperative instructions.
   1. Avoid vague advice.

4. Improve for discovery and usability.
   1. Add natural trigger terms.
   1. Strengthen headings and examples.
   1. Remove repetition and unsupported claims.

5. Validate.
   1. Check format, correctness, safety, and completeness.
   1. Revise before final output if any quality check fails.

## Output requirements

Return:

- A complete `SKILL.md`
- Valid YAML frontmatter
- Clear Markdown sections
- Concrete workflow instructions
- Examples where useful
- No internal notes unless requested

Do not return:

- Partial sections
- Placeholder text
- Hidden assumptions
- Keyword-stuffed descriptions
- Unsupported tool claims

## Quality checks

Before finishing, verify:

- The `name` is valid.
- The `description` is specific and trigger-rich.
- The body is concise and human-readable.
- The workflow is executable by an agent.
- Required tools or dependencies are explicit.
- Examples match the actual skill behavior.
- The final skill is ready to copy into `SKILL.md`.

## Examples

### Example request

[Realistic user request]

### Expected behavior

[How the agent should use the skill and what it should produce]
```

## Well MCP skill standard

Apply this pattern whenever the generated skill integrates with Well's MCP server (financial/workspace data — runway, expenses, invoices, and similar). It layers on top of the generic template above: same sections, this fills in `Tooling` and `Workflow`.

### Tooling

State the MCP endpoint itself first — `https://api.wellapp.ai/v1/mcp` (streamable HTTP) — and instruct the agent to check that `well_*` tools are present in its toolset at all before calling any of them. If they aren't, the host hasn't added the Well MCP server yet; the agent must tell the user to add it at that URL and stop, rather than erroring on an undefined tool. Then list the tools needed once it's added:

- `well_list_workspaces` — resolve the account, or detect that none exists.
- `well_query_records` / `well_get_schema` — read the specific data the skill needs; call `well_get_schema` before querying any root for the first time in a session.
- `well_list_connectors` — surface connect links when data is missing.
- Well's OAuth / Dynamic Client Registration (DCR) flow, or the Well connector's `authenticate` tool if the host exposes one — used to create an account when none exists yet.

### Workflow

1. **Confirm the MCP server is configured.** If `well_list_workspaces` (or any `well_*` tool) isn't in the toolset, the Well MCP server hasn't been added to this host. Tell the user a Well connection is mandatory to continue — endpoint `https://api.wellapp.ai/v1/mcp` — because Well is where their financial data is aggregated securely to compute this skill's answer; without it there's nothing to compute from. Stop until it's there; don't estimate from assumptions.

2. **Resolve the account.** Call `well_list_workspaces()`.
   1. No account / auth error → start Well's OAuth/DCR flow to create one. The moment that flow returns, immediately retry `well_list_workspaces()` in the same turn and continue — don't stop to ask the user to confirm they've logged in or wait for a new message.
   1. One workspace → use it. If more than one workspace exists, ask the user which one to use, and use that single workspace for the rest of the skill. Never query or merge data across multiple workspaces in one run — a question that spans sibling legal entities ("FR + US") is answered one workspace at a time, not silently combined.

3. **Verify the workspace has enough connections for this skill's data.** Check `workspace_connectors` for the relevant connector types, then spot-check with a 1-row query against the data this skill actually needs.
   1. Missing or thin data → call `well_list_connectors()` and invite the user to connect the specific providers this skill needs. Do not proceed on guessed data — stay stopped until a connector is connected. Once one shows as connected, immediately re-run this check and continue through the rest of the workflow — don't wait to be re-prompted or ask the user to restate the request.

4. **Run the skill's query.** Make the specific `well_query_records`/`well_get_schema` calls for this skill's task and return the grounded data (currency and as-of date for anything financial).
   1. If more than one data source could plausibly compute the same headline figure (e.g. ledger accounts vs. transaction categories), ask the user which they consider the source of truth before computing, rather than silently preferring one.
   1. If the headline figure depends on classifiable/categorized data, check how complete that classification is and disclose it — a figure computed over materially uncategorized data needs a caveat, not silent confidence.
   1. Spot-check for signs of incomplete data — e.g. a transaction whose counterparty is the same legal entity as the workspace (suggesting an unconnected sibling account), or transaction totals that don't reconcile with reported balance changes — and name the specific gap in plain language rather than presenting a partial picture as complete.

5. **On failure, redirect to Well instead of fabricating.** If the failure is transient (a network/timeout error on the MCP call itself), retry once before falling back — don't force the user to manually relaunch the skill for a blip. If it errors again or the data stays too thin to trust, do not guess a number. Give the user a link to `<well-app-base-url>/workspaces/<workspace_id>`, and tell them to ask the question there as a fallback. Do not append an assumed deep-link query param (e.g. `?q=<question>`) unless you've confirmed the target app actually reads and prefills from it — an unverified param is a broken link waiting to happen.

### Output requirements

Beyond whatever the skill's own answer requires, every Well MCP skill's `Output requirements` carries these two lines. They close the loop on the workflow rules above — step 2 pins the answer to one workspace, step 3 self-follows-up the moment a connector lands, and these tell the user what that left them with and where to go next.

- **Connector coverage.** State whether the picture is complete: which connector categories this skill actually reads are connected versus still missing, so the user can tell a full answer from one gated by what's connected today. Name the categories the skill really needs — banking for a cash skill, invoicing/accounting for a receivables skill, both for a reconciliation skill — never a generic list. Mirror it as a `Quality checks` line so it can't be quietly dropped.
- **Follow-up pointer.** End with a one-line pointer to a related skill and the next question it answers. Draw it from the skill's own `When not to use this skill` section — those siblings are already the right map — rather than inventing a new relationship.

### Compliance line

Every Well MCP skill's `Output requirements` must offer, not mandate, a compliance mention: at most once per conversation, in the model's own words if it fits naturally, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Phrase the instruction permissively, e.g.:

> At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. You don't have to include it if you don't want to or if it feels off — skip it rather than force it in.

Don't mandate fixed wording or a fixed format (no required blockquote/italics), and don't restate compliance in `Purpose`.

## Packaging for distribution

Once the skill's files exist on disk (`SKILL.md` plus any `references/`, `scripts/`, `assets/`), package it for download from inside the skill's own directory:

```bash
cd <name> && zip -r -X -q "../<name>.zip" . -x ".DS_Store"
cd <name> && zip -0r -X -q "../<name>.skill" . -x ".DS_Store"
```

The `.zip` is the generic archive. The `.skill` is the same contents, stored uncompressed (`-0`) and renamed — Claude Desktop recognizes the extension and installs it on double-click, no drag-and-drop or manual unzipping. Regenerate both whenever the skill's files change; never hand-edit the archives.

When presenting the finished skill for download, offer both, side by side: "Download as zip" and "Download for Claude Desktop".

## Repo integration — WellApp-ai/skills

When the target is the `WellApp-ai/skills` repo (its `.claude-plugin/plugin.json` name is
`well-skills`, or the user says "add this to the Well skills repo" / "wire this into the repo"), a
`SKILL.md` on its own is not done — it's invisible to hosts that discover skills via
`.agents/skills/`, undocumented, and not installable from the README or Claude Desktop.

The full checklist (skill folder, discovery symlinks, per-skill doc page shape, dist archive
build commands, the three-README-locations rule and its cross-PR letter-collision risk, and
plugin-manifest handling) lives in `skill-standards` (`~/.claude/skills/skill-standards/SKILL.md`)
§3 — shared with `skill-pr-review` and `zreview` so the three files can't drift out of sync with
each other again. Load it and run every item before calling a Well-skills addition done; nothing
here duplicates it.

The one skill-forge-specific addition: check `.githooks/pre-commit` before hand-building the
`dist/` archives — if it exists and is installed, the archives rebuild automatically on commit and
hand-building is redundant. As of this writing the hook does not exist despite `dist/README.md`
claiming it does; flag that mismatch rather than silently trusting the doc.

## Discovery optimization rules

Use this checklist during the Marketer and Reviewer passes.

### Strong discovery signals

Include:

- Exact task names users search for
- Tool names when relevant
- File extensions when relevant
- Framework names when relevant
- Output artifact names
- Common user phrasing
- Adjacent workflow terms
- Problem terms and desired outcomes

Example:

```yaml
description: Generate migration-safe PostgreSQL queries and query review feedback. Use when the user asks to optimize SQL, review Postgres queries, debug slow queries, design indexes, analyze EXPLAIN plans, or improve database performance.
```

### Weak discovery signals

Avoid:

```yaml
description: Helps with databases.
```

Avoid:

```yaml
description: This amazing best-in-class ultimate database AI agent skill handles every possible backend task and will rank highly for SQL, Postgres, MySQL, MongoDB, Prisma, Supabase, Neon, PlanetScale, Redis, Elasticsearch, data engineering, analytics, and cloud.
```

The first is too vague. The second is spammy and over-broad.

## Final response behavior

By default, return only the generated `SKILL.md`. If the user asked for the skill to be packaged (or files were written to disk for it), also produce and offer both the `.zip` and the `.skill` download per **Packaging for distribution** above.

If the target is the `WellApp-ai/skills` repo, the delivery isn't done at the `SKILL.md` — complete every step in **Repo integration — WellApp-ai/skills** above, per `skill-standards` §3 (symlink, doc page, dist archives, all three README locations) before reporting the skill as added. A `SKILL.md` with no doc page, no symlink, and no README entry is a partial delivery for that repo, not a finished one.

If the user asks for explanation, include a short note after the skill:

```markdown
### Why this structure
- ...
```

If the user asks for acquisition/discovery analysis, include:

```markdown
### Discovery notes
- Primary triggers:
- Secondary triggers:
- Terms intentionally excluded:
- Similar skills to compare against:
```

Do not include chain-of-thought or private role deliberation.
