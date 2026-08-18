#!/usr/bin/env python3
# Parses every skills/*/SKILL.md frontmatter block as real YAML. `claude plugin
# validate` only checks that a frontmatter block exists — it does not catch
# frontmatter that fails to actually parse (e.g. a bare `:` inside a one-line
# description), which is exactly the class of bug that broke company-profile
# and missing-receipts in WellApp-ai/skills#8.

import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("error: PyYAML is required (pip install pyyaml) to run this check.", file=sys.stderr)
    sys.exit(1)

SKILLS_DIR = Path(__file__).resolve().parent.parent / "skills"

def frontmatter_of(path):
    text = path.read_text()
    if not text.startswith("---\n"):
        return None
    end = text.find("\n---", 4)
    if end == -1:
        return None
    return text[4:end]

def main():
    failures = []
    for skill_md in sorted(SKILLS_DIR.glob("*/SKILL.md")):
        frontmatter = frontmatter_of(skill_md)
        if frontmatter is None:
            failures.append((skill_md, "no frontmatter block found"))
            continue
        try:
            yaml.safe_load(frontmatter)
        except yaml.YAMLError as error:
            failures.append((skill_md, str(error)))

    if failures:
        print(f"✘ Found {len(failures)} skill(s) with invalid frontmatter YAML:\n")
        for path, reason in failures:
            print(f"  ❯ {path.relative_to(SKILLS_DIR.parent)}\n    {reason}\n")
        sys.exit(1)

    print(f"✔ {len(list(SKILLS_DIR.glob('*/SKILL.md')))} skill frontmatter block(s) parsed cleanly")

if __name__ == "__main__":
    main()
