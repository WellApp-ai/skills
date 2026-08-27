/**
 * Compiles atoms/<brick>/CONTENT.md into a dev-only atoms/<brick>/SKILL.md test
 * artifact, and src/<name>.hbs.md into the shipped skills/<name>/SKILL.md.
 *
 * Each atom's CONTENT.md body is registered as one Handlebars partial, named
 * after the atom. A consumer template calls it inline with hash args
 * (`{{> define-workspace purpose="..."}}`) — no separate data file. `strict: true`
 * makes a missing property throw instead of rendering blank, so a typo'd or
 * forgotten property fails loud at compile time rather than shipping a silently
 * incomplete skill.
 *
 * The `styling` atom is the one exception: its content comes entirely from
 * design-system/well-tokens.css, not from a consumer's hash args, so it's
 * pre-rendered once against the parsed tokens and registered as a plain string
 * partial. This replaces the old scripts/generate-style-blocks.mjs, which
 * rewrote a marker-delimited region of each skill's SKILL.md in place — one
 * mechanism now, not two.
 *
 * Run through `make compile` (or `node scripts/compile.mjs`). `--check` fails
 * instead of writing, for CI and `make validate`. `--watch` (also `make watch`)
 * recompiles on every source change, and never watches its own output paths.
 */
import Handlebars from "handlebars";
import { existsSync, readdirSync, readFileSync, watch, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ATOMS_DIR = join(ROOT, "atoms");
const SRC_DIR = join(ROOT, "src");
const SKILLS_DIR = join(ROOT, "skills");

Handlebars.registerHelper("list", (value) =>
  String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

// For a `mode`-style string-enum prop, where a caller's value picks between
// more than two mutually exclusive prose branches — `{{#if}}` alone only
// tests truthiness, not which value.
Handlebars.registerHelper("eq", (a, b) => a === b);

function splitFrontmatter(source, label) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`${label}: missing frontmatter block`);
  return { frontmatter: match[1], body: match[2] };
}

// Minimal parser for the flat `key: value` shape our frontmatter's `placeholders:`
// block actually uses — not a general YAML parser, deliberately.
function parsePlaceholders(frontmatterText) {
  const lines = frontmatterText.split("\n");
  const start = lines.findIndex((l) => l.trim() === "placeholders:");
  if (start === -1) return {};
  const out = {};
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!/^\s+\S/.test(line)) break;
    const m = line.match(/^\s+([a-zA-Z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2].trim().replace(/^["'](.*)["']$/, "$1");
    if (value === "true") value = true;
    else if (value === "false") value = false;
    out[key] = value;
  }
  return out;
}

function stripPlaceholdersBlock(frontmatterText) {
  return frontmatterText.replace(/\n?placeholders:\n(?:[ \t]+.*\n?)*/, "\n").trim();
}

function atomNames() {
  return readdirSync(ATOMS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

// --- the `styling` atom: the one atom whose context is computed, not supplied ---
//
// Every other atom's render context comes from either a consumer's hash-args
// (the real render) or its own `placeholders:` frontmatter (the dev-artifact
// render). `styling` has no consumer-supplied properties at all — its content
// is generated wholesale from design-system/well-tokens.css, the same source
// for both renders. `COMPUTED_CONTEXT` names that one exception once, instead
// of an `atom === "styling"` check repeated in every function that needs it.

const TOKENS_CSS = join(ROOT, "design-system/well-tokens.css");

/** Roles a composed view actually needs, in the order it needs them. */
const STYLING_ROLES = [
  ["Page background", "well-bg"],
  ["Card surface", "well-bg-subtle"],
  ["Border", "well-border"],
  ["Primary text", "well-text"],
  ["Secondary text", "well-text-2"],
  ["Accent", "well-accent"],
  ["Positive", "well-success"],
  ["Negative", "well-danger"],
];
const STYLING_SERIES = ["well-cat-1", "well-cat-2", "well-cat-3", "well-cat-4", "well-cat-5", "well-cat-6"];

function stylingContext() {
  const css = readFileSync(TOKENS_CSS, "utf8");
  const tokens = new Map();
  for (const [, name, value] of css.matchAll(/--(well-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    tokens.set(name, value.trim());
  }
  const need = (name) => {
    const value = tokens.get(name);
    if (!value) throw new Error(`design-system/well-tokens.css no longer defines --${name}`);
    return value;
  };
  return {
    roles: STYLING_ROLES.map(([label, name]) => ({ label, value: need(name) })),
    seriesJoined: STYLING_SERIES.map((name) => `\`${need(name)}\``).join(", "),
    radius: need("well-radius"),
    gap: need("well-gap"),
  };
}

const COMPUTED_CONTEXT = { styling: stylingContext };

// --- compiling atoms and consumers ---

function registerPartials() {
  for (const atom of atomNames()) {
    const path = join(ATOMS_DIR, atom, "CONTENT.md");
    const { body } = splitFrontmatter(readFileSync(path, "utf8"), `atoms/${atom}/CONTENT.md`);
    const compiled = Handlebars.compile(body, { strict: true, noEscape: true });
    const computeContext = COMPUTED_CONTEXT[atom];
    // A computed atom has no consumer-supplied properties, so it's rendered
    // once here and registered as a plain string — every {{> styling}} call
    // gets identical, already-resolved output regardless of context.
    Handlebars.registerPartial(atom, computeContext ? compiled(computeContext()) : compiled);
  }
}

function renderDevArtifacts() {
  return atomNames().map((atom) => {
    const label = `atoms/${atom}/SKILL.md`;
    const path = join(ATOMS_DIR, atom, "CONTENT.md");
    const { frontmatter, body } = splitFrontmatter(readFileSync(path, "utf8"), `atoms/${atom}/CONTENT.md`);
    const computeContext = COMPUTED_CONTEXT[atom];
    const context = computeContext ? computeContext() : parsePlaceholders(frontmatter);
    const rendered = Handlebars.compile(body, { strict: true, noEscape: true })(context);
    const content = `---\n${stripPlaceholdersBlock(frontmatter)}\n---\n${rendered}`;
    return { path: join(ATOMS_DIR, atom, "SKILL.md"), content, label };
  });
}

function renderConsumers() {
  if (!existsSync(SRC_DIR)) return [];
  return readdirSync(SRC_DIR)
    .filter((f) => f.endsWith(".hbs.md"))
    .map((file) => {
      const name = basename(file, ".hbs.md");
      const label = `skills/${name}/SKILL.md`;
      const source = readFileSync(join(SRC_DIR, file), "utf8");
      const rendered = Handlebars.compile(source, { strict: true, noEscape: true })({});
      return { path: join(SKILLS_DIR, name, "SKILL.md"), content: rendered, label };
    });
}

function runOnce({ check }) {
  registerPartials();
  // renderDevArtifacts() still runs in check mode — a CONTENT.md that fails to
  // compile (bad frontmatter, an undefined strict-mode prop) throws here and
  // fails CI either way. What it does NOT do below is get compared against
  // disk: atoms/*/SKILL.md is gitignored, so a fresh checkout never has one.
  const devArtifacts = renderDevArtifacts();
  const consumerArtifacts = renderConsumers();

  if (check) {
    const stale = consumerArtifacts.filter((o) => !existsSync(o.path) || readFileSync(o.path, "utf8") !== o.content);
    for (const o of stale) console.error(`stale: ${o.label}`);
    if (stale.length) {
      console.error(`\n${stale.length} file(s) behind their source. Run \`make compile\`.`);
      process.exitCode = 1;
      return;
    }
    console.log("atoms current");
    return;
  }

  const outputs = [...devArtifacts, ...consumerArtifacts];
  let wrote = 0;
  for (const o of outputs) {
    const current = existsSync(o.path) ? readFileSync(o.path, "utf8") : null;
    if (current !== o.content) {
      writeFileSync(o.path, o.content);
      console.log(`wrote ${o.label}`);
      wrote++;
    }
  }
  if (!wrote) console.log("atoms already current");
}

const check = process.argv.includes("--check");
const watchMode = process.argv.includes("--watch");

try {
  runOnce({ check });
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
}

if (watchMode) {
  let timer = null;
  const rerun = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        runOnce({ check: false });
      } catch (err) {
        console.error(err.message);
      }
    }, 150);
  };
  // Watch only the source globs — never the generated SKILL.md output paths,
  // or the compiler's own writes would re-trigger itself.
  watch(ATOMS_DIR, { recursive: true }, (_event, filename) => {
    if (filename && filename.endsWith("CONTENT.md")) rerun();
  });
  watch(SRC_DIR, { recursive: true }, (_event, filename) => {
    if (filename && filename.endsWith(".hbs.md")) rerun();
  });
  console.log("watching atoms/**/CONTENT.md and src/*.hbs.md ...");
}
