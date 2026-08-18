.PHONY: install validate

install:
	git config core.hooksPath .githooks

validate:
	claude plugin validate .
	claude plugin validate ./.claude-plugin/plugin.json
	claude plugin validate ./skills
