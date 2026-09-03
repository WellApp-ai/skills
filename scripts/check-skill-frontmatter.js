#!/usr/bin/env node
// Every skills/*/SKILL.md frontmatter block is a flat `key: value` list — no
// nesting, and no value beyond a single-line string or a one-line flow list
// such as `requires: [a, b]` (which this parser reads as an ordinary value).
// `claude plugin validate` only checks that a frontmatter block exists, never
// that it actually parses as YAML — so a bare `:` inside an unquoted value
// (which YAML reads as the start of a nested mapping) passes it clean. That
// exact bug broke company-profile and missing-receipts in WellApp-ai/skills#8.
// This re-derives just the one YAML rule that matters here, so no YAML
// library needs to be installed to run it.
//
// atoms/*/CONTENT.md frontmatter carries the same colon-heavy `description:`
// prose, so the same bug class applies there too — checked here as well,
// with its one legitimate nested block (`placeholders:`) stripped first.
//
// The `description` length is checked for the same reason the colon is: it is a
// frontmatter rule a host enforces at install time, so breaking it fails where
// nobody is watching rather than here. Only shipped skills are measured — an
// atom's CONTENT.md is a dev artifact nothing installs.

const fs = require("fs");
const path = require("path");

const skillsDir = path.join(__dirname, "..", "skills");
const atomsDir = path.join(__dirname, "..", "atoms");

function frontmatterOf(text) {
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 4);
  if (end === -1) return null;
  return text.slice(4, end);
}

function stripPlaceholdersBlock(frontmatter) {
  return frontmatter.replace(/\n?placeholders:\n(?:[ \t]+.*\n?)*/, "");
}

// The documented ceiling is 1024 CHARACTERS, so characters are what this enforces.
// Counting bytes instead would reject valid metadata: descriptions here are dense
// with em dashes at three bytes each, and one is already at 1021 bytes while
// comfortably inside the character limit. Spreading the value counts code points
// rather than UTF-16 units, so an astral character counts once instead of twice.
// The byte width rides along in the message because it is the number a
// byte-counting host would trip on, and a reader chasing a failure elsewhere
// should not have to measure it again.
const DESCRIPTION_LIMIT = 1024;

function findOverlongDescription(frontmatter) {
  const match = frontmatter.match(/^description: (.*)$/m);
  if (!match) return null;
  const value = match[1];
  const chars = [...value].length;
  if (chars <= DESCRIPTION_LIMIT) return null;
  const bytes = Buffer.byteLength(value, "utf8");
  return {
    line: frontmatter.slice(0, match.index).split("\n").length,
    text: `description is ${chars} characters, over the ${DESCRIPTION_LIMIT}-character limit (${bytes} bytes)`,
  };
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
  const root = path.join(__dirname, "..");
  const skillFiles = fs
    .readdirSync(skillsDir)
    .map((name) => path.join(skillsDir, name, "SKILL.md"))
    .filter((file) => fs.existsSync(file))
    .sort();
  const atomFiles = fs
    .readdirSync(atomsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(atomsDir, entry.name, "CONTENT.md"))
    .filter((file) => fs.existsSync(file))
    .sort();

  const failures = [];
  for (const file of [...skillFiles, ...atomFiles]) {
    const text = fs.readFileSync(file, "utf8");
    let frontmatter = frontmatterOf(text);
    if (frontmatter === null) {
      failures.push({ file, problems: [{ line: 1, text: "no frontmatter block found" }] });
      continue;
    }
    if (file.startsWith(atomsDir)) frontmatter = stripPlaceholdersBlock(frontmatter);
    const problems = findBareColonLines(frontmatter);
    const overlong = file.startsWith(atomsDir) ? null : findOverlongDescription(frontmatter);
    if (overlong) problems.push(overlong);
    if (problems.length > 0) failures.push({ file, problems });
  }

  if (failures.length > 0) {
    console.log(`✘ Found ${failures.length} file(s) with invalid frontmatter:\n`);
    for (const { file, problems } of failures) {
      console.log(`  ❯ ${path.relative(root, file)}`);
      for (const problem of problems) {
        const detail = problem.text.startsWith("description is")
          ? problem.text
          : `unquoted value contains a bare ':' — ${problem.text.slice(0, 80)}`;
        console.log(`    line ${problem.line}: ${detail}`);
      }
      console.log("");
    }
    process.exit(1);
  }

  console.log(`✔ ${skillFiles.length} skill and ${atomFiles.length} atom frontmatter block(s) parsed cleanly`);
}

main();
