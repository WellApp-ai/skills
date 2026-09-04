#!/usr/bin/env bash
# Switch Claude Code from the shipped well-skills plugin to the POC stub plugin.
#
# The two plugins declare the same eight skill names, so leaving both enabled
# would make the command a coin flip. This disables the shipped one for the
# duration of the POC; poc-off.sh puts it back.
set -euo pipefail

MARKETPLACE_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/well-skills-poc" && pwd)"

echo "Adding the wellapp-poc marketplace from ${MARKETPLACE_PATH}"
# `marketplace add` fails when the marketplace is already declared, which is the
# normal state on a re-run. Nothing else here is affected, so the run continues.
if ! claude plugin marketplace add "${MARKETPLACE_PATH}"; then
	echo "  the wellapp-poc marketplace is already declared, continuing"
fi

echo "Installing well-skills-poc@wellapp-poc"
claude plugin install well-skills-poc@wellapp-poc

echo "Disabling the shipped well-skills@wellapp plugin"
if ! claude plugin disable well-skills@wellapp; then
	echo "  well-skills@wellapp is not installed or already disabled, continuing"
fi

echo ""
echo "Done. Open a NEW Claude Code session; commands are /well-skills-poc:<id>"
