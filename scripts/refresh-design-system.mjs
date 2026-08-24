#!/usr/bin/env node
/**
 * Refreshes the design-system kit from the published token package.
 *
 * The token file under design-system/ is a copy of what @wellapp-ai/design-tokens builds,
 * so it goes stale whenever a token moves. It is not shipped as a skill: the values are
 * generated into the skills that compose a visual, by scripts/generate-style-blocks.mjs.
 * Copying it by hand is how a copy drifts without anyone noticing, which is the failure
 * the token package itself exists to end.
 *
 *   node scripts/refresh-design-system.mjs           # refresh from the published package
 *   node scripts/refresh-design-system.mjs --check   # fail if the copy is stale
 *   node scripts/refresh-design-system.mjs --from <dir>   # copy from a local build instead
 *
 * The default path reads npm.pkg.github.com and needs a token; it fails closed without one.
 *
 * Everything this writes ends up inside a published archive, so the source is treated as
 * untrusted: only regular files are copied, symlinks are resolved rather than re-created,
 * and every extracted path is contained to the extraction root.
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, lstatSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE = "@wellapp-ai/design-tokens";
// Resolved against this file, not the shell's cwd: running from scripts/ used to create a
// shadow assets tree there and report success while the real assets stayed stale.
const TARGET = resolve(dirname(fileURLToPath(import.meta.url)), "../design-system");
const FILES = ["well-tokens.css"];

const args = process.argv.slice(2);
const check = args.includes("--check");
const fromIndex = args.indexOf("--from");
let localDir = null;
if (fromIndex !== -1) {
  const operand = args[fromIndex + 1];
  if (!operand || operand.startsWith("--")) {
    console.error("--from needs a directory operand.");
    process.exit(2);
  }
  localDir = operand;
}

/** Refuses a path that escapes its root, so a crafted tarball entry cannot reach outside. */
function contained(root, candidate) {
  const full = resolve(root, candidate);
  if (full !== root && !full.startsWith(root + sep)) {
    throw new Error(`Path escapes the extraction root: ${candidate}`);
  }
  return full;
}

function withSource(use) {
  if (localDir) {
    const dir = resolve(localDir);
    if (!existsSync(dir)) throw new Error(`--from path does not exist: ${dir}`);
    return use(dir);
  }
  const work = mkdtempSync(join(tmpdir(), "well-ds-"));
  try {
    execFileSync("npm", ["pack", PACKAGE, "--registry=https://npm.pkg.github.com", "--ignore-scripts"], {
      cwd: work,
      stdio: ["ignore", "pipe", "inherit"],
    });
    const tarball = readdirSync(work).find((f) => f.endsWith(".tgz"));
    if (!tarball) throw new Error(`npm pack produced no tarball for ${PACKAGE}`);
    execFileSync("tar", ["-xzf", tarball], { cwd: work });
    return use(contained(resolve(work), join("package", "dist")));
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

const result = withSource((src) => {
  // Validate every file before writing any, so a partial source cannot leave a mismatched pair.
  const pairs = FILES.map((file) => {
    const from = join(src, file);
    if (!existsSync(from)) throw new Error(`${PACKAGE} ships no ${file} — expected at ${from}`);
    if (!lstatSync(from).isFile()) throw new Error(`${from} is not a regular file`);
    return { file, from, to: join(TARGET, file) };
  });

  const stale = pairs.filter(({ from, to }) => {
    if (!existsSync(to)) return true;
    if (!lstatSync(to).isFile()) return true;
    // Byte compare: a utf8 decode maps distinct invalid bytes to the same replacement
    // character and would report a clean match on files that differ.
    return Buffer.compare(readFileSync(from), readFileSync(to)) !== 0;
  });

  if (!check) {
    // dereference: a symlink copied as a link is stored by zip as its TARGET's content,
    // which would publish an arbitrary local file inside the archive.
    for (const { from, to } of stale) cpSync(from, to, { dereference: true });
  }
  return { stale: stale.map((p) => p.file), local: Boolean(localDir) };
});

if (check) {
  if (result.stale.length) {
    console.error(`Design-system kit is stale: ${result.stale.join(", ")}`);
    console.error("Run: make refresh");
    process.exit(1);
  }
  console.log(`Design-system kit matches the ${result.local ? "local build" : "published package"}.`);
} else if (result.stale.length) {
  console.log(`Refreshed: ${result.stale.join(", ")}.`);
  // `make build` alone would package the old token blocks: the values live inside the
  // composing skills, and only generate-style-blocks.mjs rewrites them.
  console.log("Now run `make refresh` so the composing skills and the archives carry the new values.");
} else {
  console.log("Design-system kit was already up to date; nothing copied.");
}
