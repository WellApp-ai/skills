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


// --- compiling atoms and consumers ---

function registerPartials() {
  for (const atom of atomNames()) {
    const path = join(ATOMS_DIR, atom, "CONTENT.md");
    const { body } = splitFrontmatter(readFileSync(path, "utf8"), `atoms/${atom}/CONTENT.md`);
    const compiled = Handlebars.compile(body, { strict: true, noEscape: true });
    Handlebars.registerPartial(atom, compiled);
  }
}

function renderDevArtifacts() {
  return atomNames().map((atom) => {
    const label = `atoms/${atom}/SKILL.md`;
    const path = join(ATOMS_DIR, atom, "CONTENT.md");
    const { frontmatter, body } = splitFrontmatter(readFileSync(path, "utf8"), `atoms/${atom}/CONTENT.md`);
    const context = parsePlaceholders(frontmatter);
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
