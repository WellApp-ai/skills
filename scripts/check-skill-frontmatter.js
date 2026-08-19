#!/usr/bin/env node
// Every skills/*/SKILL.md frontmatter block is a flat `key: value` list —
// no nesting, no lists, no quoting conventions beyond a single-line string.
// `claude plugin validate` only checks that a frontmatter block exists, never
// that it actually parses as YAML — so a bare `:` inside an unquoted value
// (which YAML reads as the start of a nested mapping) passes it clean. That
// exact bug broke company-profile and missing-receipts in WellApp-ai/skills#8.
// This re-derives just the one YAML rule that matters here, so no YAML
// library needs to be installed to run it.

const fs = require("fs");
const path = require("path");

const skillsDir = path.join(__dirname, "..", "skills");

function frontmatterOf(text) {
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 4);
  if (end === -1) return null;
  return text.slice(4, end);
}

function findBareColonLines(frontmatter) {
  const problems = [];
  frontmatter.split("\n").forEach((line, index) => {
    if (!line.trim()) return;
    const separator = line.indexOf(": ");
    if (separator === -1) {
      if (line.trim().endsWith(":")) {
        problems.push({ line: index + 1, text: line });
      }
      return;
    }
    const value = line.slice(separator + 2);
    const isQuoted = /^["'].*["']$/.test(value.trim());
    if (isQuoted) return;
    if (value.includes(": ") || value.trim().endsWith(":")) {
      problems.push({ line: index + 1, text: line });
    }
  });
  return problems;
}

function main() {
  const skillFiles = fs
    .readdirSync(skillsDir)
    .map((name) => path.join(skillsDir, name, "SKILL.md"))
    .filter((file) => fs.existsSync(file))
    .sort();

  const failures = [];
  for (const file of skillFiles) {
    const text = fs.readFileSync(file, "utf8");
    const frontmatter = frontmatterOf(text);
    if (frontmatter === null) {
      failures.push({ file, problems: [{ line: 1, text: "no frontmatter block found" }] });
      continue;
    }
    const problems = findBareColonLines(frontmatter);
    if (problems.length > 0) failures.push({ file, problems });
  }

  if (failures.length > 0) {
    console.log(`✘ Found ${failures.length} skill(s) with invalid frontmatter:\n`);
    for (const { file, problems } of failures) {
      console.log(`  ❯ ${path.relative(path.join(skillsDir, ".."), file)}`);
      for (const problem of problems) {
        console.log(`    line ${problem.line}: unquoted value contains a bare ':' — ${problem.text.slice(0, 80)}`);
      }
      console.log("");
    }
    process.exit(1);
  }

  console.log(`✔ ${skillFiles.length} skill frontmatter block(s) parsed cleanly`);
}

main();
