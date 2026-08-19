#!/usr/bin/env node
/**
 * Refreshes the design-system kit from the published token package.
 *
 * The stylesheet under skills/well-design-system/assets/ is a copy of what
 * @wellapp-ai/design-tokens builds, so it goes stale whenever a token changes or a class
 * is added to @wellapp/ui or @wellapp/ai-elements. Copying it by hand is how a copy drifts
 * without anyone noticing, which is the failure the token package itself exists to end.
 *
 *   node scripts/refresh-design-system.mjs           # refresh from the published package
 *   node scripts/refresh-design-system.mjs --check   # fail if the copy is stale
 *
 * Reads the registry, so it needs a token for npm.pkg.github.com. Point --from at a local
 * platform checkout to skip that:
 *
 *   node scripts/refresh-design-system.mjs --from ../platform/packages/design-tokens/dist
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const PACKAGE = "@wellapp-ai/design-tokens";
const TARGET = resolve("skills/well-design-system/assets");
const FILES = ["well.css", "well-tokens.css"];

const args = process.argv.slice(2);
const check = args.includes("--check");
const fromIndex = args.indexOf("--from");
const localDir = fromIndex === -1 ? null : args[fromIndex + 1];

function sourceDir() {
  if (localDir) {
    const dir = resolve(localDir);
    if (!existsSync(dir)) throw new Error(`--from path does not exist: ${dir}`);
    return dir;
  }
  // `npm pack` writes a tarball of the published package; its dist/ is what we ship.
  const work = mkdtempSync(join(tmpdir(), "well-ds-"));
  execFileSync("npm", ["pack", PACKAGE, "--registry=https://npm.pkg.github.com"], {
    cwd: work,
    stdio: ["ignore", "pipe", "inherit"],
  });
  const tarball = readdirSync(work).find((f) => f.endsWith(".tgz"));
  if (!tarball) throw new Error(`npm pack produced no tarball for ${PACKAGE}`);
  execFileSync("tar", ["-xzf", tarball], { cwd: work });
  return join(work, "package", "dist");
}

const src = sourceDir();
let stale = [];
for (const file of FILES) {
  const from = join(src, file);
  if (!existsSync(from)) throw new Error(`${PACKAGE} ships no ${file} — expected at ${from}`);
  const to = join(TARGET, file);
  const differs = !existsSync(to) || readFileSync(from, "utf8") !== readFileSync(to, "utf8");
  if (!differs) continue;
  if (check) stale.push(file);
  else cpSync(from, to);
}

if (check) {
  if (stale.length) {
    console.error(`Design-system kit is stale: ${stale.join(", ")}`);
    console.error("Run: node scripts/refresh-design-system.mjs && make build");
    process.exit(1);
  }
  console.log("Design-system kit matches the published package.");
} else {
  console.log(stale.length === 0 ? "Refreshed the design-system kit." : "Refreshed.");
  console.log("Now run `make build` so the archives carry the new stylesheet.");
}
