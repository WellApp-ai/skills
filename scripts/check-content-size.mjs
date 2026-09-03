/**
 * Ballpark size warning for skills/*\/SKILL.md and atoms/*\/CONTENT.md.
 *
 * This is a hygiene ceiling, not a quality-degradation claim — no source
 * ties a specific token count to measured LLM output quality at the sizes
 * these files actually reach. Research turned up one real, Claude-specific
 * cliff ("Prompt Design at Scale," arXiv 2607.19257: adherence to a stacked
 * rule-set collapses with instruction *count*, not token length — ~62% at 20
 * instructions, ~17% at 40), but that paper's N counted a synthetic prompt
 * built with exactly one isolated instruction per line. A naive keyword-line
 * count against this repo's actual prose (which routinely packs 2-3
 * imperative words into one ordinary, non-bloated sentence) flagged all 26
 * of 26 skills — not a usable signal, so that approach was tried and
 * dropped rather than shipped as if it were evidence-backed when the
 * counting method didn't actually match what the paper measured.
 *
 * So: token count stays as a plain, non-empirical ceiling for keeping a file
 * reviewable and roughly bounded — 50,000 tokens for a skill (~5% of
 * Claude's 1M-token context, a round number chosen as a common-sense outer
 * bound rather than derived from any measured degradation point), estimated
 * at ~4 characters each (a rough ratio, not a real tokenizer). An atom gets
 * 10% of that: it's inlined verbatim into every skill that composes it, so
 * its size is paid by each of them, not once — a skill composing a few
 * atoms at full skill-sized budgets each would blow its own budget before
 * writing a line of its own logic. This is a warning, never a failure: it
 * does not affect `make validate`'s exit code.
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
const SKILL_BUDGET_TOKENS = 50000;
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
