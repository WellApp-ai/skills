.PHONY: install validate

install:
	git config core.hooksPath .githooks

validate:
	claude plugin validate . --strict
	claude plugin validate ./skills --strict
	python3 scripts/check-skill-frontmatter.py
