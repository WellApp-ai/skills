# dist/

Auto-generated. Each `.zip` and `.skill` here is built from the matching `skills/<name>/` folder by [`scripts/build-dist.sh`](../scripts/build-dist.sh) — run `make build`, or the script directly; the [`.githooks/pre-commit`](../.githooks/pre-commit) hook runs it whenever a commit touches `skills/`. The `.skill` file is the same contents, stored uncompressed and renamed — double-click to install in Claude Desktop.

A skill that keeps step bricks under `references/` ships none of them as separate files: the build inlines each one into the packaged `SKILL.md` as a `## Step reference: <name>` section and rewrites the pointers that named it. Claude Desktop prints one "skill loaded" status line per file the model reads, so a shipped skill must need exactly one read. Verify an archive with `unzip -l`: it must hold exactly one `.md` file.

That hook only runs if you've set it up once: `make install`.

Don't edit these files directly — edit the source under [`skills/`](../skills/) instead. **Exception:** a skill compiled from an atoms template (check for a matching `src/<name>.hbs.md`) is generated too — edit the `.hbs.md` source, not `skills/<name>/SKILL.md`; the pre-commit hook rejects a commit that hand-edits a compiled skill's output without touching its source. Repo conventions for doing that live in [`CONVENTIONS.md`](../CONVENTIONS.md). Download links and descriptions live in the [root README](../README.md#claude-desktop).
