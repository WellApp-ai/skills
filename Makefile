.PHONY: install validate build

install:
	git config core.hooksPath .githooks

# `skills/` is the plugin's skills directory, not a plugin — it carries no
# .claude-plugin manifest, so validating it as one always failed and, through the
# pre-push hook, blocked every push. The manifest lives at the repository root; the
# skills themselves are covered by the frontmatter check below.
validate:
	claude plugin validate . --strict
	node scripts/check-skill-frontmatter.js

build:
	@set -e; \
	for dir in skills/*/; do \
		name=$$(basename "$$dir"); \
		if [ -f "dist/$$name.skill" ]; then \
			tmp=$$(mktemp -d); \
			unzip -q "dist/$$name.skill" -d "$$tmp"; \
			if diff -rq --exclude=.DS_Store "$$tmp" "$$dir" > /dev/null 2>&1; then \
				rm -rf "$$tmp"; \
				continue; \
			fi; \
			rm -rf "$$tmp"; \
		fi; \
		rm -f "dist/$$name.zip" "dist/$$name.skill"; \
		( cd "$$dir" && zip -r -X -q "../../dist/$$name.zip" . -x ".DS_Store" ); \
		( cd "$$dir" && zip -0r -X -q "../../dist/$$name.skill" . -x ".DS_Store" ); \
		echo "rebuilt dist/$$name.{zip,skill}"; \
	done
