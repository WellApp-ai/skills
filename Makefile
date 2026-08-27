.PHONY: install validate build

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
