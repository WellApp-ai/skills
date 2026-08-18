.PHONY: install validate build

install:
	git config core.hooksPath .githooks

validate:
	claude plugin validate . --strict
	claude plugin validate ./skills --strict
	node scripts/check-skill-frontmatter.js

build:
	@for dir in skills/*/; do \
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
