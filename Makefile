.PHONY: install validate build refresh refresh-check

install:
	git config core.hooksPath .githooks

validate:
	claude plugin validate . --strict
	claude plugin validate ./skills --strict
	node scripts/check-skill-frontmatter.js

build:
	@bash scripts/build-dist.sh

# design-system/well-tokens.css is a copy of what @wellapp-ai/design-tokens builds; the
# values are generated from it into the skills that compose a visual. The design system is
# not itself a skill — it is Well's brand, not a capability a user installs.
# Reads npm.pkg.github.com and needs a token.
refresh:
	node scripts/refresh-design-system.mjs
	node scripts/generate-style-blocks.mjs
	$(MAKE) build

refresh-check:
	node scripts/refresh-design-system.mjs --check
	node scripts/generate-style-blocks.mjs --check
