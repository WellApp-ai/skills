.PHONY: install validate build refresh refresh-check

install:
	git config core.hooksPath .githooks

# The manifest lives at the repository root; `skills/` is the plugin's skills
# directory, not a plugin of its own. The frontmatter check below covers the skills.
validate:
	claude plugin validate . --strict
	node scripts/check-skill-frontmatter.js

# `-y` on both zips: without it a symlink under skills/ is stored as its target's
# CONTENT, which would publish an arbitrary local file in a public archive.
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
		( cd "$$dir" && zip -ry -X -q "../../dist/$$name.zip" . -x ".DS_Store" ); \
		( cd "$$dir" && zip -0ry -X -q "../../dist/$$name.skill" . -x ".DS_Store" ); \
		echo "rebuilt dist/$$name.{zip,skill}"; \
	done

# The kit under skills/well-design-system/assets is a copy of what
# @wellapp-ai/design-tokens builds. Reads npm.pkg.github.com and needs a token.
refresh:
	node scripts/refresh-design-system.mjs
	$(MAKE) build

refresh-check:
	node scripts/refresh-design-system.mjs --check
