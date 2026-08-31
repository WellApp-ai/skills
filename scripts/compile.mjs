/**
 * Compiles atoms/<brick>/CONTENT.md into a dev-only atoms/<brick>/SKILL.md test
 * artifact, and src/<name>.hbs.md into the shipped skills/<name>/SKILL.md.
 *
 * It also appends the rendered `voice` atom to every skills/<name>/SKILL.md that
 * has no src/<name>.hbs.md of its own, so the house tone reaches all three
 * install routes: the dist archive, the raw.githubusercontent fetch the docs
 * pages describe, and the marketplace plugin. The append first removes the copy
 * of the rendered block already in the file, so it is idempotent and an atom
 * edit propagates to every skill on the next compile. It removes only a block
 * this compiler wrote: a Voice section holding anything else is left on disk and
 * reported, because the appended section is always last and its region runs to
 * end of file, so a silent removal would destroy whatever a maintainer added
 * below it. Both compile and `--check` then assert every shipped skill carries
 * the block exactly once, whichever path composed it.
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
const VOICE_ATOM = "voice";
const VOICE_HEADING = "## Voice";

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

// The house tone, rendered from its atom and normalised to the exact shape the
// `{{> voice}}` partial produces, so both composition paths emit the same bytes.
function renderVoiceSection() {
  const path = join(ATOMS_DIR, VOICE_ATOM, "CONTENT.md");
  const { body } = splitFrontmatter(readFileSync(path, "utf8"), `atoms/${VOICE_ATOM}/CONTENT.md`);
  const rendered = Handlebars.compile(body, { strict: true, noEscape: true })({}).trim();
  return `\n${VOICE_HEADING}\n\n${rendered}\n`;
}

// Split a hand-written skill into the prose the compiler keeps and the "## Voice"
// sections it owns, wherever they sit. A section runs from its heading to the
// next "## " heading or to end of file.
function splitVoiceSections(content) {
  const kept = [];
  const sections = [];
  let open = null;
  for (const line of content.split("\n")) {
    if (/^## /.test(line)) {
      if (open) {
        sections.push(open.join("\n"));
        open = null;
      }
      if (line.trim() === VOICE_HEADING) {
        open = [line];
        continue;
      }
    }
    if (open) open.push(line);
    else kept.push(line);
  }
  if (open) sections.push(open.join("\n"));
  return { base: kept.join("\n"), sections };
}

function voiceSectionBody(section) {
  return section.split("\n").slice(1).join("\n").trim();
}

// Which Voice bodies on disk this compiler wrote, and may therefore replace.
// Two things qualify. The body it renders right now, the steady state. And a
// body two or more skills carry, because the append writes identical bytes into
// every hand-written skill, so a shared body is the output of an earlier compile
// run — that is how an edit to the atom propagates, and matching the current
// rendering alone would never allow it. A body only one skill carries is
// something else: content a maintainer put there, which the append would drop.
function compilerWrittenBodies(files, currentBody) {
  const counts = new Map();
  for (const { bodies } of files) {
    for (const body of new Set(bodies)) counts.set(body, (counts.get(body) ?? 0) + 1);
  }
  const written = new Set([currentBody]);
  for (const [body, count] of counts) if (count > 1) written.add(body);
  return written;
}

// The first line of an unrecognised section that the current rendering does not
// hold, so the error names the actual content at risk rather than the tone prose
// wrapped around it.
function unrecognisedLine(body, currentBody) {
  const known = new Set(currentBody.split("\n").map((line) => line.trim()));
  const lines = body.split("\n").map((line) => line.trim());
  const found = lines.find((line) => line && !known.has(line)) ?? lines.find(Boolean) ?? "";
  return found.length > 80 ? `${found.slice(0, 77)}...` : found;
}

// Count what each skill is about to ship: the rendered block, and the heading
// that introduces it. This guards the template path, where a dropped
// `{{> voice}}` call renders zero copies and still matches its own output on
// disk, and where a hand-written Voice section beside the partial ships two
// headings while the block count still reads one. On the hand-written path the
// compiler rewrites the block itself, so the count there is structurally one; a
// skill the compiler fell behind on is caught by `--check`'s staleness
// comparison instead.
function voiceCoverageErrors(artifacts, voiceSection) {
  const errors = [];
  for (const { label, content } of artifacts) {
    const blocks = content.split(voiceSection).length - 1;
    const headings = content.split("\n").filter((line) => line.trim() === VOICE_HEADING).length;
    if (blocks !== 1)
      errors.push(
        `${label}: carries the voice atom ${blocks} time(s), expected exactly 1. A template writes "${VOICE_HEADING}" and "{{> voice}}" on consecutive lines, with no blank line between them.`,
      );
    else if (headings !== 1) errors.push(`${label}: carries ${headings} "${VOICE_HEADING}" headings, expected exactly 1`);
  }
  return errors;
}

// A skill with a src/<name>.hbs.md composes the voice atom in its own template;
// every other skills/<name>/SKILL.md is hand-written, so the compiler owns its
// Voice section. The skip is derived from the source file's existence, never
// from whether the output happens to carry the heading already. A skill whose
// Voice section holds content this compiler did not write yields an error and no
// artifact, so the run stops before anything overwrites that content.
function renderVoiceAppends(voiceSection) {
  if (!existsSync(SKILLS_DIR)) return { artifacts: [], errors: [] };
  const files = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => !existsSync(join(SRC_DIR, `${name}.hbs.md`)))
    .map((name) => {
      const path = join(SKILLS_DIR, name, "SKILL.md");
      const { base, sections } = splitVoiceSections(readFileSync(path, "utf8"));
      return { path, label: `skills/${name}/SKILL.md`, base, bodies: sections.map(voiceSectionBody) };
    });

  const currentBody = voiceSectionBody(voiceSection);
  const written = compilerWrittenBodies(files, currentBody);
  const artifacts = [];
  const errors = [];
  for (const { path, label, base, bodies } of files) {
    const foreign = bodies.filter((body) => !written.has(body));
    if (foreign.length) {
      errors.push(
        `${label}: the "${VOICE_HEADING}" section holds content this compiler did not write, starting at "${unrecognisedLine(foreign[0], currentBody)}". The voice append would drop it, so the file was left alone. Move that content above the "${VOICE_HEADING}" heading, then run \`make compile\` again.`,
      );
      continue;
    }
    artifacts.push({ path, content: `${base.replace(/\s*$/, "")}\n${voiceSection}`, label });
  }
  return { artifacts, errors };
}

function runOnce({ check }) {
  registerPartials();
  // renderDevArtifacts() still runs in check mode — a CONTENT.md that fails to
  // compile (bad frontmatter, an undefined strict-mode prop) throws here and
  // fails CI either way. What it does NOT do below is get compared against
  // disk: atoms/*/SKILL.md is gitignored, so a fresh checkout never has one.
  const devArtifacts = renderDevArtifacts();
  const voiceSection = renderVoiceSection();
  const appends = renderVoiceAppends(voiceSection);
  const consumerArtifacts = [...renderConsumers(), ...appends.artifacts];

  // Checked before anything is written, so a skill that lost its Voice section,
  // or that holds content the append would drop, never reaches disk or dist/.
  const voiceErrors = [...appends.errors, ...voiceCoverageErrors(consumerArtifacts, voiceSection)];
  for (const message of voiceErrors) console.error(message);
  if (voiceErrors.length) {
    console.error(`\n${voiceErrors.length} skill(s) failed the voice atom check.`);
    process.exitCode = 1;
    return;
  }

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
