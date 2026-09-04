/**
 * Compiles atoms/<brick>/CONTENT.md into a dev-only atoms/<brick>/SKILL.md test
 * artifact, and src/<name>.hbs.md into the shipped skills/<name>/SKILL.md.
 *
 * It also appends the rendered `voice` atom to every skills/<name>/SKILL.md that
 * has no src/<name>.hbs.md of its own, so the house tone reaches all three
 * install routes: the dist archive, the raw.githubusercontent fetch the docs
 * pages describe, and the marketplace plugin. The append first removes the copy
 * of the rendered block already in the file, so it is idempotent and an atom
 * edit propagates to every skill on the next compile. Ownership is explicit,
 * never inferred: the compiler wraps every body it renders in the
 * `<!-- voice:begin -->` / `<!-- voice:end -->` markers, on the template path as
 * well, and replaces only what sits between them. A Voice section without those
 * markers is left on disk and reported, because the appended section is always
 * last and its region runs to end of file, so a silent removal would destroy
 * whatever a maintainer added below it. Both compile and `--check` then assert
 * every shipped skill carries the block exactly once, whichever path composed
 * it.
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
const VOICE_BEGIN = "<!-- voice:begin -->";
const VOICE_END = "<!-- voice:end -->";

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

// For a prose branch two independent props each independently trigger — e.g.
// single-select cardinality, true under `mode="collect"` OR a purpose that
// implies it on its own. Keeps the two conditions readable inline rather than
// nesting an `{{#if}}` inside every branch that needs both.
Handlebars.registerHelper("or", (...args) => args.slice(0, -1).some(Boolean));

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
    // The voice partial carries the ownership markers too, so a template that
    // composes the atom itself emits the same bytes the append writes, and the
    // block count below still matches on both paths.
    if (atom === VOICE_ATOM) {
      Handlebars.registerPartial(atom, (context) => `\n${wrapVoiceBody(compiled(context).trim())}\n`);
      continue;
    }
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

// The markers that say which bytes the compiler owns. They render as nothing, so
// a reader of the shipped skill sees the tone prose alone.
function wrapVoiceBody(body) {
  return `${VOICE_BEGIN}\n${body}\n${VOICE_END}`;
}

// The house tone, rendered from its atom.
function renderVoiceBody() {
  const path = join(ATOMS_DIR, VOICE_ATOM, "CONTENT.md");
  const { body } = splitFrontmatter(readFileSync(path, "utf8"), `atoms/${VOICE_ATOM}/CONTENT.md`);
  return Handlebars.compile(body, { strict: true, noEscape: true })({}).trim();
}

// The rendered tone in the exact shape the `{{> voice}}` partial produces, so
// both composition paths emit the same bytes.
function renderVoiceSection(voiceBody) {
  return `\n${VOICE_HEADING}\n\n${wrapVoiceBody(voiceBody)}\n`;
}

// Split a hand-written skill into the prose the compiler keeps and the "## Voice"
// sections it owns, wherever they sit. A section runs from its heading to the
// next "## " heading or to end of file. A "## " line inside a fenced code block
// is sample text, not a heading, so the fence state gates the match here and in
// every other heading scan.
function splitVoiceSections(content) {
  const kept = [];
  const sections = [];
  let open = null;
  let inFence = false;
  for (const line of content.split("\n")) {
    if (/^```/.test(line)) inFence = !inFence;
    if (!inFence && /^## /.test(line)) {
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

// Whether this compiler wrote the Voice body on disk, and may therefore replace
// it. The markers it wraps every rendered body in are the proof, so an older
// render is still recognised and an atom edit propagates without a prompt. An
// unmarked body is recognised only when it matches the current rendering byte
// for byte, which is the state of every skill compiled before the markers
// existed; replacing that loses nothing. Anything else belongs to a maintainer.
function isCompilerWritten(body, voiceBody) {
  const lines = body.split("\n");
  const marked = lines[0].trim() === VOICE_BEGIN && lines[lines.length - 1].trim() === VOICE_END;
  return marked || body === voiceBody;
}

// The first line of an unrecognised section that the current rendering does not
// hold, so the error names the actual content at risk rather than the tone prose
// or the markers wrapped around it.
function unrecognisedLine(body, voiceBody) {
  const known = new Set([...voiceBody.split("\n").map((line) => line.trim()), VOICE_BEGIN, VOICE_END]);
  const lines = body.split("\n").map((line) => line.trim());
  const found = lines.find((line) => line && !known.has(line)) ?? lines.find(Boolean) ?? "";
  return found.length > 80 ? `${found.slice(0, 77)}...` : found;
}

function countVoiceHeadings(content) {
  let inFence = false;
  let count = 0;
  for (const line of content.split("\n")) {
    if (/^```/.test(line)) inFence = !inFence;
    else if (!inFence && line.trim() === VOICE_HEADING) count++;
  }
  return count;
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
    const headings = countVoiceHeadings(content);
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
// Voice section holds unmarked content yields an error and no artifact, so the
// run stops before anything overwrites that content.
function renderVoiceAppends(voiceSection, voiceBody) {
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

  const artifacts = [];
  const errors = [];
  for (const { path, label, base, bodies } of files) {
    const foreign = bodies.filter((body) => !isCompilerWritten(body, voiceBody));
    if (foreign.length) {
      errors.push(
        `${label}: the "${VOICE_HEADING}" section holds content this compiler does not own, starting at "${unrecognisedLine(foreign[0], voiceBody)}". The compiler replaces only what sits between "${VOICE_BEGIN}" and "${VOICE_END}", so the file was left alone. Either a maintainer wrote that content, and it belongs above the "${VOICE_HEADING}" heading; or the markers were stripped from an older render, and the whole section can go. Fix whichever it is, then run \`make compile\` again.`,
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
  const voiceBody = renderVoiceBody();
  const voiceSection = renderVoiceSection(voiceBody);
  const appends = renderVoiceAppends(voiceSection, voiceBody);
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
