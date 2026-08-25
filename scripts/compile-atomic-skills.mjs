/**
 * Compiles atomic/<brick>/CONTENT.md into a dev-only atomic/<brick>/SKILL.md test
 * artifact, and templates/<name>.hbs.md into the shipped skills/<name>/SKILL.md.
 *
 * Each atomic brick's CONTENT.md body is registered as one Handlebars partial,
 * named after the brick. A consumer template calls it inline with hash args
 * (`{{> define-workspace purpose="..."}}`) — no separate data file. `strict: true`
 * makes a missing property throw instead of rendering blank, so a typo'd or
 * forgotten property fails loud at compile time rather than shipping a silently
 * incomplete skill.
 *
 * Run through `make compile` (or `node scripts/compile-atomic-skills.mjs`).
 * `--check` fails instead of writing, for CI and `make validate`. `--watch`
 * recompiles on every source change (never watches its own output paths).
 */
import Handlebars from "handlebars";
import { existsSync, readdirSync, readFileSync, watch, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ATOMIC_DIR = join(ROOT, "atomic");
const TEMPLATES_DIR = join(ROOT, "templates");
const SKILLS_DIR = join(ROOT, "skills");

Handlebars.registerHelper("list", (value) =>
  String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

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

function brickNames() {
  return readdirSync(ATOMIC_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

function registerPartials() {
  for (const brick of brickNames()) {
    const path = join(ATOMIC_DIR, brick, "CONTENT.md");
    const { body } = splitFrontmatter(readFileSync(path, "utf8"), `atomic/${brick}/CONTENT.md`);
    Handlebars.registerPartial(brick, Handlebars.compile(body, { strict: true, noEscape: true }));
  }
}

function renderDevArtifacts() {
  return brickNames().map((brick) => {
    const label = `atomic/${brick}/SKILL.md`;
    const path = join(ATOMIC_DIR, brick, "CONTENT.md");
    const { frontmatter, body } = splitFrontmatter(readFileSync(path, "utf8"), `atomic/${brick}/CONTENT.md`);
    const context = parsePlaceholders(frontmatter);
    const rendered = Handlebars.compile(body, { strict: true, noEscape: true })(context);
    const content = `---\n${stripPlaceholdersBlock(frontmatter)}\n---\n${rendered}`;
    return { path: join(ATOMIC_DIR, brick, "SKILL.md"), content, label };
  });
}

// scripts/generate-style-blocks.mjs owns this exact marker pair inside
// fx-exposure/rank-clients-by-ltv — it rewrites the region in place on the
// committed skills/*/SKILL.md. This compiler renders those same files wholesale
// from their template, so a naive overwrite would erase that generator's work
// (and --check would then flag the file as permanently stale, since the
// template always renders the region empty). Preserve whatever's already on
// disk in that region across every render.
const STYLE_BLOCK_BEGIN = "<!-- generated: well tokens — edit design-system/well-tokens.css, then `make refresh` -->";
const STYLE_BLOCK_END = "<!-- /generated -->";

function preserveStyleBlock(rendered, existingPath) {
  const renderedStart = rendered.indexOf(STYLE_BLOCK_BEGIN);
  if (renderedStart === -1 || !existsSync(existingPath)) return rendered;
  const renderedEnd = rendered.indexOf(STYLE_BLOCK_END, renderedStart);
  if (renderedEnd === -1) return rendered;
  const existing = readFileSync(existingPath, "utf8");
  const existingStart = existing.indexOf(STYLE_BLOCK_BEGIN);
  const existingEnd = existing.indexOf(STYLE_BLOCK_END, existingStart);
  if (existingStart === -1 || existingEnd === -1) return rendered;
  const existingRegion = existing.slice(existingStart, existingEnd + STYLE_BLOCK_END.length);
  return rendered.slice(0, renderedStart) + existingRegion + rendered.slice(renderedEnd + STYLE_BLOCK_END.length);
}

function renderConsumers() {
  if (!existsSync(TEMPLATES_DIR)) return [];
  return readdirSync(TEMPLATES_DIR)
    .filter((f) => f.endsWith(".hbs.md"))
    .map((file) => {
      const name = basename(file, ".hbs.md");
      const label = `skills/${name}/SKILL.md`;
      const outPath = join(SKILLS_DIR, name, "SKILL.md");
      const source = readFileSync(join(TEMPLATES_DIR, file), "utf8");
      const rendered = Handlebars.compile(source, { strict: true, noEscape: true })({});
      return { path: outPath, content: preserveStyleBlock(rendered, outPath), label };
    });
}

function runOnce({ check }) {
  registerPartials();
  const outputs = [...renderDevArtifacts(), ...renderConsumers()];

  if (check) {
    const stale = outputs.filter((o) => !existsSync(o.path) || readFileSync(o.path, "utf8") !== o.content);
    for (const o of stale) console.error(`stale: ${o.label}`);
    if (stale.length) {
      console.error(`\n${stale.length} file(s) behind their source. Run \`make compile\`.`);
      process.exitCode = 1;
      return;
    }
    console.log("atomic skills current");
    return;
  }

  let wrote = 0;
  for (const o of outputs) {
    const current = existsSync(o.path) ? readFileSync(o.path, "utf8") : null;
    if (current !== o.content) {
      writeFileSync(o.path, o.content);
      console.log(`wrote ${o.label}`);
      wrote++;
    }
  }
  if (!wrote) console.log("atomic skills already current");
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
  watch(ATOMIC_DIR, { recursive: true }, (_event, filename) => {
    if (filename && filename.endsWith("CONTENT.md")) rerun();
  });
  watch(TEMPLATES_DIR, { recursive: true }, (_event, filename) => {
    if (filename && filename.endsWith(".hbs.md")) rerun();
  });
  console.log("watching atomic/**/CONTENT.md and templates/*.hbs.md ...");
}
