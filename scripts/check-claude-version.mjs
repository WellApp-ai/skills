#!/usr/bin/env node
/**
 * Refuses to run `claude plugin validate` on a CLI too old to understand this repo.
 *
 * `claude plugin validate <dir>` changed in 2.1.233: before it, a directory without a
 * `.claude-plugin/` manifest was an error, so validating `./skills` — which is a skills
 * directory, not a plugin — failed. The failure names a missing manifest, which points the
 * reader at the repository rather than at their CLI, and `.githooks/pre-push` runs
 * `make validate`, so an old CLI blocks every push with a misleading reason. Bisected
 * across 2.1.230 through 2.1.241; the behaviour flips at 2.1.233.
 */
import { execFileSync } from "node:child_process";

const MINIMUM = [2, 1, 233];

function installed() {
  try {
    // `claude --version` prints e.g. "2.1.241 (Claude Code)".
    return execFileSync("claude", ["--version"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

const output = installed();
if (output === null) {
  console.error("The `claude` CLI is not on PATH. Install it, or skip with `make validate SKIP_CLAUDE=1`.");
  process.exit(1);
}

const match = output.match(/(\d+)\.(\d+)\.(\d+)/);
if (!match) {
  // An unparseable version is not a reason to block a push: report it and let the
  // validation itself decide, rather than guessing that an unknown format is too old.
  console.warn(`Could not read a version from \`claude --version\` (${output.trim()}); skipping the check.`);
  process.exit(0);
}

const found = match.slice(1, 4).map(Number);

/** Lexicographic, short-circuiting on the first differing component. */
function isOlder(a, b) {
  for (let i = 0; i < b.length; i += 1) {
    if (a[i] !== b[i]) return a[i] < b[i];
  }
  return false;
}

if (isOlder(found, MINIMUM)) {
  console.error(
    `claude ${found.join(".")} is too old for this repository — ${MINIMUM.join(".")} or newer is required.\n` +
      "Below that, `claude plugin validate ./skills` fails with \"No manifest found in directory\",\n" +
      "which describes the CLI rather than the repository. Upgrade, then re-run.",
  );
  process.exit(1);
}
