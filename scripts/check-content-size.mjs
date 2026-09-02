/**
 * Size gates for the files a skill ships.
 *
 * Two different ceilings apply:
 *
 * 1. A HARD per-file cap of 10,000 estimated tokens on every shipped source
 *    file — skills/<name>/SKILL.md and skills/<name>/references/*.md. Claude
 *    Code's Read tool refuses any file over ~10,000 real tokens ("File
 *    content (n) exceeds maximum allowed tokens (10000)", reproduced in
 *    anthropics/claude-plugins-official#995), and the plugin marketplace
 *    serves these source files directly — so a file over the cap fails to
 *    load at every invocation while `claude plugin validate --strict` still
 *    passes it. The chars/4 estimate runs ~5-10% ABOVE a real BPE count on
 *    this repo's prose, so a file that passes here has margin against the
 *    real cap. This check fails the run.
 *
 * 2. A WARNING at the same threshold on the PACKAGED size — SKILL.md plus
 *    every references/*.md the build inlines into the one-file archive that
 *    Claude Desktop installs (see scripts/build-dist.sh). Desktop's loader
 *    has no documented per-file token cap, so an oversized package is a risk
 *    to flag, not a proven failure.
 *
 * Atoms keep their advisory ceiling: an atom is inlined verbatim into every
 * skill that composes it, so its size is paid by each consumer and the hard
 * gate on the compiled skills/<name>/SKILL.md is what actually enforces the
 * budget. The atom warning just points at the source to shrink.
 *
 * Tokens are estimated at ~4 characters each (a rough ratio, not a real
 * tokenizer). Run through `make validate` (or `node scripts/check-content-size.mjs`).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(ROOT, "skills");
const ATOMS_DIR = join(ROOT, "atoms");

const CHARS_PER_TOKEN = 4;
const SHIPPED_FILE_CAP_TOKENS = 10000;
const ATOM_BUDGET_TOKENS = 5000;

function estimateTokens(text) {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function measure(file) {
  return { file, tokens: estimateTokens(readFileSync(file, "utf8")) };
}

function skillDirs() {
  return readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(SKILLS_DIR, entry.name));
}

function atomFiles() {
  return readdirSync(ATOMS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(ATOMS_DIR, entry.name, "CONTENT.md"))
    .filter((file) => existsSync(file));
}

const hardFailures = [];
const packagedWarnings = [];
let shippedCount = 0;

for (const dir of skillDirs()) {
  const skillMd = join(dir, "SKILL.md");
  if (!existsSync(skillMd)) continue;
  const refsDir = join(dir, "references");
  const refs = existsSync(refsDir)
    ? readdirSync(refsDir)
        .filter((name) => name.endsWith(".md"))
        .map((name) => join(refsDir, name))
    : [];
  const measured = [skillMd, ...refs].map(measure);
  shippedCount += measured.length;
  for (const entry of measured) {
    if (entry.tokens > SHIPPED_FILE_CAP_TOKENS) hardFailures.push(entry);
  }
  const packaged = measured.reduce((sum, entry) => sum + entry.tokens, 0);
  if (refs.length > 0 && packaged > SHIPPED_FILE_CAP_TOKENS) {
    packagedWarnings.push({ file: skillMd, tokens: packaged });
  }
}

if (hardFailures.length === 0) {
  console.log(`✔ ${shippedCount} shipped file(s), none over the ${SHIPPED_FILE_CAP_TOKENS}-token load cap`);
} else {
  console.log(`✘ ${hardFailures.length} of ${shippedCount} shipped file(s) over the ${SHIPPED_FILE_CAP_TOKENS}-token load cap:\n`);
  for (const { file, tokens } of hardFailures) {
    console.log(
      `  ${relative(ROOT, file)} — ~${tokens} estimated tokens. Claude Code cannot read a file this size, ` +
        "so the skill fails to load at every invocation. Move detail into skills/<name>/references/*.md files.",
    );
  }
  console.log("");
}

for (const { file, tokens } of packagedWarnings) {
  console.log(
    `⚠ ${relative(ROOT, file)} packages to ~${tokens} estimated tokens once its references are inlined ` +
      "for the Claude Desktop archive. Desktop documents no per-file cap, so this is a warning, not a failure.",
  );
}

const atomOver = atomFiles()
  .map(measure)
  .filter(({ tokens }) => tokens > ATOM_BUDGET_TOKENS);
for (const { file, tokens } of atomOver) {
  console.log(
    `⚠ ${relative(ROOT, file)} — ~${tokens} estimated tokens, over the ${ATOM_BUDGET_TOKENS}-token atom ` +
      "ceiling. An atom is inlined into every skill that composes it; the compiled skills are what the " +
      "hard cap above enforces, so shrink the atom before its consumers start failing.",
  );
}

if (hardFailures.length > 0) {
  process.exit(1);
}
