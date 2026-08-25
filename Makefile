.PHONY: install validate compile build refresh refresh-check

install:
	git config core.hooksPath .githooks
	npm ci

# SKIP_CLAUDE=1 drops the two `claude` steps for an environment that has no CLI — a CI
# runner, a container. The frontmatter and atoms checks run either way, since they
# need only node.
validate:
	@if [ "$(SKIP_CLAUDE)" = "1" ]; then \
		echo "SKIP_CLAUDE=1 — skipping the claude plugin validation"; \
	else \
		node scripts/check-claude-version.mjs && \
		claude plugin validate . --strict && \
		claude plugin validate ./skills --strict; \
	fi
	node scripts/check-skill-frontmatter.js
	node scripts/compile-atoms.mjs --check

# atoms/<name>/CONTENT.md and templates/<name>.hbs.md are the source; this renders
# them into atoms/<name>/SKILL.md (a dev-only test artifact) and skills/<name>/SKILL.md
# (what ships). Templates live outside skills/, so this never touches what `build` zips.
# The `styling` atom also folds in what used to be scripts/generate-style-blocks.mjs —
# its content is generated from design-system/well-tokens.css, not a consumer's args.
compile:
	node scripts/compile-atoms.mjs

build: compile
	@bash scripts/build-dist.sh

# design-system/well-tokens.css is a copy of what @wellapp-ai/design-tokens builds; the
# `styling` atom (compile) generates the values from it into the skills that compose a
# visual. The design system is not itself a skill — it is Well's brand, not a capability
# a user installs. Reads npm.pkg.github.com and needs a token.
refresh:
	node scripts/refresh-design-system.mjs
	$(MAKE) build

refresh-check:
	node scripts/refresh-design-system.mjs --check
