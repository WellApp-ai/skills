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
	local -a refs=()
	for ref in "$dir"/references/*.md; do
		if [ -f "$ref" ]; then refs+=("$ref"); fi
	done
	# An unmatched glob stays literal, so an absent or .md-free references/
	# directory lands here with nothing to inline.
	if [ ${#refs[@]} -eq 0 ]; then
		cp "$dir/SKILL.md" "$out"
		return
	fi
	sed -E \
		-e 's|`references/<name>\.md`|its "Step reference" section|g' \
		-e 's|`references/([a-z0-9-]+)\.md`|the "Step reference: \1" section|g' \
		"$dir/SKILL.md" >"$out"
	for ref in "${refs[@]}"; do
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
	# Only references/ may hold a symlink. A symlink anywhere else never reaches
	# the stage, so it would drop out of the download without a trace.
	if stray=$(cd "$dir" && find . -type l ! -path './references/*' -print -quit) && [ -n "$stray" ]; then
		echo "skills/$name/${stray#./} is a symlink; only references/ may be one" >&2
		exit 1
	fi
	# The build inlines a reference's target into the packaged SKILL.md, so a
	# target outside the repo would publish an arbitrary local file in a public
	# archive. Require every target to resolve in-tree.
	while IFS= read -r link; do
		[ -n "$link" ] || continue
		target=$(cd "$dir" && readlink -f "$link" 2>/dev/null || true)
		case "$target" in
		"$ROOT"/*) ;;
		*)
			echo "skills/$name/${link#./} resolves outside the repo; a reference must stay in-tree" >&2
			exit 1
			;;
		esac
	done <<-EOF
		$(cd "$dir" && find . -type l -path './references/*')
	EOF
	# The stage excludes references/ wholesale and the inliner picks up only
	# top-level .md files that resolve, so anything else under references/ —
	# a broken symlink, a non-markdown file, a nested file — would drop out
	# of the download without a trace.
	while IFS= read -r entry; do
		[ -n "$entry" ] || continue
		case "$entry" in
		./references/*/*) ;;
		./references/*.md)
			if [ -f "$dir/$entry" ]; then continue; fi
			;;
		esac
		echo "skills/$name/${entry#./} would not reach the archive; references/ may hold only top-level .md files that resolve to a real file" >&2
		exit 1
	done <<-EOF
		$(cd "$dir" && find ./references -mindepth 1 \( -type f -o -type l \) 2>/dev/null)
	EOF
	stage=$(mktemp -d)
	(cd "$dir" && find . -type f ! -path './references/*' ! -name '.DS_Store' | while read -r f; do
		mkdir -p "$stage/$(dirname "$f")"
		cp "$f" "$stage/$f"
	done)
	build_skill_md "$dir" "$stage/SKILL.md"

	if [ -f "dist/$name.skill" ] && [ -f "dist/$name.zip" ]; then
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

# Prune an archive whose source folder is gone.
#
# The loop above walks `skills/*/`, so it can only ever ADD or refresh — a skill
# removed from the tree keeps shipping its last build, byte-identical to whatever
# was on main, and nothing else in the repo notices: plugin.json is regenerated
# from the directory, the README is hand-edited, and the symlink mirrors are
# per-skill. So a stale archive is not a broken link that surfaces somewhere, it is
# a package that quietly stays installable.
#
# This bit a removal PR: a merge restored five archives for three deleted skills
# because the conflicted `dist/` paths resolved to the branch that still had them,
# and `make build` afterwards reported success without touching them.
for archive in dist/*.zip dist/*.skill; do
	[ -e "$archive" ] || continue
	name=$(basename "$archive"); name=${name%.*}
	if [ ! -d "skills/$name" ]; then
		rm -f "$archive"
		echo "pruned $archive — skills/$name no longer exists"
	fi
done
