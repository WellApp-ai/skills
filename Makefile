.PHONY: install validate build refresh refresh-check

install:
	git config core.hooksPath .githooks

# SKIP_CLAUDE=1 drops the two `claude` steps for an environment that has no CLI — a CI
# runner, a container. The frontmatter check runs either way, since it needs only node.
validate:
	@if [ "$(SKIP_CLAUDE)" = "1" ]; then \
		echo "SKIP_CLAUDE=1 — skipping the claude plugin validation"; \
	else \
		node scripts/check-claude-version.mjs && \
		claude plugin validate . --strict && \
		claude plugin validate ./skills --strict; \
	fi
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
