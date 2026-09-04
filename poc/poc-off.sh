#!/usr/bin/env bash
# Undo poc-on.sh: remove the POC stub plugin and put the shipped well-skills
# plugin back.
set -euo pipefail

echo "Uninstalling well-skills-poc@wellapp-poc"
if ! claude plugin uninstall well-skills-poc@wellapp-poc --yes; then
	echo "  well-skills-poc@wellapp-poc is not installed, continuing"
fi

echo "Enabling the shipped well-skills@wellapp plugin"
if ! claude plugin enable well-skills@wellapp; then
	echo "  well-skills@wellapp is not installed or already enabled, continuing"
fi

echo "Removing the wellapp-poc marketplace"
if ! claude plugin marketplace remove wellapp-poc; then
	echo "  the wellapp-poc marketplace is not declared, continuing"
fi

echo ""
echo "Done. Open a NEW Claude Code session; the shipped /well-skills:<id> commands are back."
