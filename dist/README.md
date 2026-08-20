# dist/

Auto-generated. Each `.zip` and `.skill` here is built from the matching `skills/<name>/` folder by [`scripts/build-dist.sh`](../scripts/build-dist.sh) — run `make build`, or the script directly; the [`.githooks/pre-commit`](../.githooks/pre-commit) hook runs it whenever a commit touches `skills/`. The `.skill` file is the same contents, stored uncompressed and renamed — double-click to install in Claude Desktop.

The build inlines a skill's `references/*.md` files into the packaged `SKILL.md` as `## Step reference: <name>` sections, rewrites the pointers that named those files, and ships no `references/` directory. Claude Desktop prints one "skill loaded" status line per file the model reads, so a shipped skill must need exactly one read. The source tree keeps `references/` as symlinks; only the archives are self-contained. Verify an archive with `unzip -l`: it must hold exactly one `.md` file.

That hook only runs if you've set it up once: `make install`.

Don't edit these files directly — edit the source under [`skills/`](../skills/) instead. Download links and descriptions live in the [root README](../README.md#claude-desktop).
