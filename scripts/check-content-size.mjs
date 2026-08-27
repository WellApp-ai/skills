/**
 * Ballpark size warning for skills/*\/SKILL.md and atoms/*\/CONTENT.md.
 *
 * Nothing else in this repo measures content length, and a skill built from
 * several inlined atoms (see CONVENTIONS.md's Atoms section) can grow long
 * without anyone noticing until someone happens to read the whole thing.
 * Tokens are estimated at ~4 characters each — a standard rough ratio for
 * English prose, not a real tokenizer — because a real one would need a
 * dependency this check isn't worth adding. This is a warning, never a
 * failure: it does not affect `make validate`'s exit code.
 *
 * Run through `make validate` (or `node scripts/check-content-size.mjs`).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(ROOT, "skills");
const ATOMS_DIR = join(ROOT, "atoms");

const CHARS_PER_TOKEN = 4;
const WARN_AT_TOKENS = 8000;

function estimateTokens(text) {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function skillFiles() {
  return readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(SKILLS_DIR, entry.name, "SKILL.md"))
    .filter((file) => existsSync(file));
}

function atomFiles() {
  return readdirSync(ATOMS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(ATOMS_DIR, entry.name, "CONTENT.md"))
    .filter((file) => existsSync(file));
}

const files = [...skillFiles(), ...atomFiles()].sort();
const over = files
  .map((file) => ({ file, tokens: estimateTokens(readFileSync(file, "utf8")) }))
  .filter(({ tokens }) => tokens > WARN_AT_TOKENS)
  .sort((a, b) => b.tokens - a.tokens);

if (over.length === 0) {
  console.log(`✔ ${files.length} skill and atom file(s), none over the ${WARN_AT_TOKENS}-token ballpark`);
} else {
  console.log(`⚠ ${over.length} of ${files.length} file(s) over the ${WARN_AT_TOKENS}-token ballpark:\n`);
  for (const { file, tokens } of over) {
    console.log(
      `  ${relative(ROOT, file)} — exceeds ${WARN_AT_TOKENS} tokens (~${tokens} estimated). ` +
        "You should do a pass to compact the content. Refer to /skill-forge for guidelines.",
    );
  }
  console.log("\nThis is a warning, not a failure — it does not affect make validate's exit code.");
}
