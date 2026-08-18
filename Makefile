.PHONY: install validate

install:
	git config core.hooksPath .githooks

validate:
	claude plugin validate . --strict
	claude plugin validate ./skills --strict
	node scripts/check-skill-frontmatter.js
