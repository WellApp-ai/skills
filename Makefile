.PHONY: install validate build refresh refresh-check

install:
	git config core.hooksPath .githooks

validate:
	claude plugin validate . --strict
	claude plugin validate ./skills --strict
	node scripts/check-skill-frontmatter.js

build:
	@bash scripts/build-dist.sh

# The kit under skills/well-design-system/assets is a copy of what
# @wellapp-ai/design-tokens builds. Reads npm.pkg.github.com and needs a token.
refresh:
	node scripts/refresh-design-system.mjs
	$(MAKE) build

refresh-check:
	node scripts/refresh-design-system.mjs --check
