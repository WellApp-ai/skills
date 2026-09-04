.PHONY: install new validate compile watch build

install:
	git config core.hooksPath .githooks
	npm ci

# Make reads a bare word as another goal to build, not as an argument, so
# `make new my-skill` prints this usage and stops; pass SLUG= instead.
new:
	@if [ -z "$(SLUG)" ] || [ -z "$(DESCRIPTION)" ]; then \
		echo 'usage: make new SLUG=<skill-slug> DESCRIPTION="<one line>" [TITLE="<Title>"] [FLOW=1 STEPS=<n>] [FORCE=1]'; \
		exit 1; \
	fi
	@node scripts/new-shell.mjs "$(SLUG)" --description "$(DESCRIPTION)" \
		$(if $(TITLE),--title "$(TITLE)") \
		$(if $(FLOW),--flow --steps "$(STEPS)") \
		$(if $(FORCE),--force)

# SKIP_CLAUDE=1 drops the two `claude` steps for an environment that has no CLI — a CI
# runner, a container. The frontmatter, atoms, and content-size checks run either way,
# since they need only node.
validate:
	@if [ "$(SKIP_CLAUDE)" = "1" ]; then \
		echo "SKIP_CLAUDE=1 — skipping the claude plugin validation"; \
	else \
		node scripts/check-claude-version.mjs && \
		claude plugin validate . --strict && \
		claude plugin validate ./skills --strict; \
	fi
	node scripts/check-skill-frontmatter.js
	node scripts/compile.mjs --check
	node scripts/check-content-size.mjs
	node scripts/check-catalog.mjs

# atoms/<name>/CONTENT.md and src/<name>.hbs.md are the source; this renders
# them into atoms/<name>/SKILL.md (a dev-only test artifact, gitignored — load
# it into Claude to test one atom in isolation, then discard it) and
# skills/<name>/SKILL.md (what ships). src/ lives outside skills/, so this
# never touches what `build` zips. `validate`/`--check` only enforces
# skills/*/SKILL.md staying current — the atom artifact is never committed,
# so there's nothing on disk to compare it against in a fresh checkout.
compile:
	node scripts/compile.mjs

# The local dev loop: recompiles on every atoms/**/CONTENT.md or src/*.hbs.md
# change, so editing an atom shows its effect on every skill that uses it
# immediately. Never writes to dist/ — run `make build` once you're done.
watch:
	node scripts/compile.mjs --watch

# Rebuilds dist/<name>.{zip,skill} for any skill/atom whose content changed since
# the last build (build-dist.sh diffs against the existing archive and skips the
# rest) — `compile` runs first so skills/*/SKILL.md is current before zipping.
build: compile
	@bash scripts/build-dist.sh
