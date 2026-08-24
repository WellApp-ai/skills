/**
 * Writes the Well token vocabulary into the skills that compose a visual.
 *
 * The tokens used to travel as a separate `well-design-system` skill that every
 * other skill named. That put design-system plumbing in a catalogue users
 * install from, and advertised a dependency on twenty skills when three of them
 * could act on it. The vocabulary is a few dozen values, so it now lives inline
 * in the skills that draw something, generated from one source.
 *
 * Run through `make refresh` (or `node scripts/generate-style-blocks.mjs`).
 * `--check` fails instead of writing, for CI and `make refresh-check`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TOKENS = join(ROOT, "design-system/well-tokens.css");

/** The skills that compose a chart of their own. Everything else states figures. */
const COMPOSING_SKILLS = ["cash-balance-trend", "fx-exposure", "rank-clients-by-ltv"];

const BEGIN = "<!-- generated: well tokens — edit design-system/well-tokens.css, then `make refresh` -->";
const END = "<!-- /generated -->";

/** Roles a composed view actually needs, in the order it needs them. */
const ROLES = [
  ["Page background", "well-bg"],
  ["Card surface", "well-bg-subtle"],
  ["Border", "well-border"],
  ["Primary text", "well-text"],
  ["Secondary text", "well-text-2"],
  ["Accent", "well-accent"],
  ["Positive", "well-success"],
  ["Negative", "well-danger"],
];
const SERIES = ["well-cat-1", "well-cat-2", "well-cat-3", "well-cat-4", "well-cat-5", "well-cat-6"];

function tokens() {
  const css = readFileSync(TOKENS, "utf8");
  const out = new Map();
  for (const [, name, value] of css.matchAll(/--(well-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    out.set(name, value.trim());
  }
  return out;
}

function block(t) {
  const need = (n) => {
    const v = t.get(n);
    if (!v) throw new Error(`design-system/well-tokens.css no longer defines --${n}`);
    return v;
  };
  return [
    BEGIN,
    "",
    "Well renders dark. A view you compose should read as the same product, not as a page",
    "that happens to hold the same numbers.",
    "",
    "| Role | Value |",
    "| --- | --- |",
    ...ROLES.map(([role, name]) => `| ${role} | \`${need(name)}\` |`),
    `| Series, in order | ${SERIES.map((n) => `\`${need(n)}\``).join(", ")} |`,
    "",
    `Corners \`${need("well-radius")}\`, gap \`${need("well-gap")}\`, body text 14px, numbers tabular.`,
    "A card is a header, then the body, then an action row — the counter first and the",
    "primary action last. State every figure in text as well as in the drawing: a chart the",
    "host cannot render must not take the answer with it.",
    "",
    END,
  ].join("\n");
}

const check = process.argv.includes("--check");
const rendered = block(tokens());
let stale = 0;

for (const skill of COMPOSING_SKILLS) {
  const path = join(ROOT, "skills", skill, "SKILL.md");
  const source = readFileSync(path, "utf8");
  const from = source.indexOf(BEGIN);
  const to = source.indexOf(END);
  if (from === -1 || to === -1) throw new Error(`${skill}: no generated block — expected ${BEGIN}`);
  const current = source.slice(from, to + END.length);
  if (current === rendered) continue;
  stale += 1;
  if (check) {
    console.error(`stale style block: skills/${skill}/SKILL.md`);
    continue;
  }
  writeFileSync(path, source.slice(0, from) + rendered + source.slice(to + END.length));
  console.log(`rewrote skills/${skill}/SKILL.md`);
}

if (check && stale) {
  console.error(`\n${stale} style block(s) behind design-system/well-tokens.css. Run \`make refresh\`.`);
  process.exit(1);
}
if (!check && !stale) console.log("style blocks already current");
