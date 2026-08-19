#!/usr/bin/env bash
# Build dist/<name>.zip and dist/<name>.skill from every skills/<name>/ folder.
#
# A skill's references/*.md files are inlined into the packaged SKILL.md as
# "## Step reference: <name>" sections, and no references/ directory ships in
# the archive. Claude Desktop prints one "skill loaded" status line per file
# the model reads, so a shipped skill must need exactly one read. The source
# tree keeps references/ as symlinks for maintainability; only the archives
# are self-contained.
#
# An archive whose content already matches the source is left untouched, so
# the script is idempotent and safe to run from the pre-commit hook.
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$(pwd)

# Print $1 with its frontmatter removed and every heading demoted two levels,
# so an inlined SKILL.md nests under its "## Step reference" heading.
strip_frontmatter_and_demote() {
	awk '
		NR == 1 && $0 == "---" { infm = 1; next }
		infm { if ($0 == "---") infm = 0; next }
		/^```/ { infence = !infence }
		!infence && /^#/ { sub(/^/, "##") }
		{ print }
	' "$1"
}

# Write the packaged SKILL.md for skill dir $1 to $2. When references/ exists,
# rewrite the "read references/<file>" pointers to name the inlined sections,
# then append one section per reference file.
build_skill_md() {
	local dir=$1 out=$2 ref name
	if [ ! -d "$dir/references" ]; then
		cp "$dir/SKILL.md" "$out"
		return
	fi
	sed -E \
		-e 's|`references/<name>\.md`|its "Step reference" section|g' \
		-e 's|`references/([a-z0-9-]+)\.md`|the "Step reference: \1" section|g' \
		"$dir/SKILL.md" >"$out"
	for ref in "$dir"/references/*.md; do
		name=$(basename "$ref" .md)
		{
			printf '\n---\n\n## Step reference: %s\n\n' "$name"
			printf 'The `%s` brick, inlined at packaging time. Follow it when the workflow reaches its step.\n\n' "$name"
			strip_frontmatter_and_demote "$ref"
		} >>"$out"
	done
}

for dir in skills/*/; do
	name=$(basename "$dir")
	stage=$(mktemp -d)
	(cd "$dir" && find . -type f ! -path './references/*' ! -name '.DS_Store' | while read -r f; do
		mkdir -p "$stage/$(dirname "$f")"
		cp "$f" "$stage/$f"
	done)
	build_skill_md "$dir" "$stage/SKILL.md"

	if [ -f "dist/$name.skill" ]; then
		prev=$(mktemp -d)
		unzip -q "dist/$name.skill" -d "$prev"
		if diff -rq --exclude=.DS_Store "$prev" "$stage" >/dev/null 2>&1; then
			rm -rf "$prev" "$stage"
			continue
		fi
		rm -rf "$prev"
	fi

	rm -f "dist/$name.zip" "dist/$name.skill"
	(cd "$stage" && zip -r -X -q "$ROOT/dist/$name.zip" . -x ".DS_Store")
	(cd "$stage" && zip -0r -X -q "$ROOT/dist/$name.skill" . -x ".DS_Store")
	rm -rf "$stage"
	echo "rebuilt dist/$name.{zip,skill}"
done
