# Skill runtime POC

Eight stub skills that hold no instructions. Each one names a skill and tells the model to
fetch the real content from Well's MCP server at run time, so the instruction set changes
server-side with no reinstall.

The eight: `fetch-missing-invoices` (the flow), plus `define-workspace`, `connect-tools`,
`connect-bank`, `define-period`, `categorize-counterparties`, `show-missing-invoices`, and
`deploy-agents`.

Every stub copies its `description` byte for byte from the shipped skill in `skills/<id>/`.
That string is what a host matches a user request against, so a reworded stub would be
discovered for different requests than the skill it stands in for.

Nothing under `poc/` reaches the repo's own checkers or the shipped `dist/` archives. The
checkers walk `skills/` and `atoms/` by fixed path, and `plugin.json` at the repo root lists
the 26 shipped skills by name.

## Build

```sh
node poc/build-stubs.mjs
```

Writes `poc/well-skills-poc/skills/<id>/SKILL.md`, then packages each one into
`poc/dist-stub/<id>.skill` and `poc/dist-stub/<id>.zip` with `SKILL.md` at the archive root.
The script reports a description over 1024 code points and exits non-zero rather than
truncating it.

## Install in Claude Desktop

Settings, then Capabilities, then Skills. Upload one `.skill` file at a time from
`poc/dist-stub/`, opening each file in the picker:

`categorize-counterparties.skill`, `connect-bank.skill`, `connect-tools.skill`,
`define-period.skill`, `define-workspace.skill`, `deploy-agents.skill`,
`fetch-missing-invoices.skill`, `show-missing-invoices.skill`.

Add the Well MCP connector in the same settings pane, or the stubs have nothing to call.

## Switch Claude Code

```sh
bash poc/poc-on.sh    # install the POC plugin, disable the shipped well-skills plugin
bash poc/poc-off.sh   # uninstall the POC plugin, re-enable the shipped one
```

Both plugins declare the same eight skill names, so `poc-on.sh` disables the shipped one for
the duration of the POC. Open a **new** Claude Code session after either script: a running
session keeps the plugin set it started with.

## Commands

```
/well-skills-poc:fetch-missing-invoices
/well-skills-poc:define-workspace
/well-skills-poc:connect-tools
/well-skills-poc:connect-bank
/well-skills-poc:define-period
/well-skills-poc:categorize-counterparties
/well-skills-poc:show-missing-invoices
/well-skills-poc:deploy-agents
```

The plugin points its MCP server at `http://localhost:8280/v1/mcp`, so the local Well API has
to be running for `well_get_skill` to answer.
