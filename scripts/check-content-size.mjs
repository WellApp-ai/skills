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
 * An atom gets a stricter budget than a skill, not the same one: it is
 * inlined verbatim into every skill that composes it, so its size is paid
 * by each of them, not once. Budgeted at 10% of a skill's own allowance —
 * a skill composing more than a couple of atoms at 100% each would blow its
 * own budget before writing a word of its own logic.
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
const SKILL_BUDGET_TOKENS = 8000;
const ATOM_BUDGET_RATIO = 0.1;
const ATOM_BUDGET_TOKENS = Math.round(SKILL_BUDGET_TOKENS * ATOM_BUDGET_RATIO);

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

function checkGroup(label, files, budget, reasonSuffix) {
  const measured = files
    .map((file) => ({ file, tokens: estimateTokens(readFileSync(file, "utf8")) }))
    .sort((a, b) => b.tokens - a.tokens);
  const over = measured.filter(({ tokens }) => tokens > budget);

  if (over.length === 0) {
    console.log(`✔ ${measured.length} ${label} file(s), none over the ${budget}-token ballpark`);
    return [];
  }
  console.log(`⚠ ${over.length} of ${measured.length} ${label} file(s) over the ${budget}-token ballpark:\n`);
  for (const { file, tokens } of over) {
    console.log(
      `  ${relative(ROOT, file)} — exceeds ${budget} tokens (~${tokens} estimated)${reasonSuffix}. ` +
        "You should do a pass to compact the content. Refer to /skill-forge for guidelines.",
    );
  }
  console.log("");
  return over;
}

const skillOver = checkGroup("skill", skillFiles(), SKILL_BUDGET_TOKENS, "");
const atomOver = checkGroup(
  "atom",
  atomFiles(),
  ATOM_BUDGET_TOKENS,
  ` — an atom's budget is ${Math.round(ATOM_BUDGET_RATIO * 100)}% of a skill's (${ATOM_BUDGET_TOKENS} of ${SKILL_BUDGET_TOKENS}), since it's inlined into every skill that composes it`,
);

if (skillOver.length === 0 && atomOver.length === 0) {
  console.log("✔ no skill or atom file over its ballpark budget");
} else {
  console.log("This is a warning, not a failure — it does not affect make validate's exit code.");
}
