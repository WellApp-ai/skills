#!/usr/bin/env node
// Create one shell skill: skills/<slug>/SKILL.md, whose body tells the model to
// fetch its real instructions from Well's MCP server. The instructions
// themselves live in the platform package and are served by `well_get_skill`,
// so nothing about them belongs in this repository.
//
// The generated file is not finished until the compiler appends the house voice
// atom, which every shipped skill carries and `scripts/compile.mjs --check`
// enforces. So this runs `scripts/compile.mjs` at the end rather than writing a
// second copy of that prose, and a fresh folder passes the repository's own
// checks the moment it exists.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { shellMarkdown } from "./shell-markdown.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = path.join(ROOT, "skills");

// The slug is the folder name, the frontmatter name, and the `skill` argument
// the model passes to `well_get_skill`. All three are matched exactly, so the
// pattern is anchored and tested against the whole string; a slug that merely
// contains a legal run is rejected, not trimmed.
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,63}$/;

// A host rejects a longer description at install time. The value measured is
// the one written to disk, quotes and escapes included, which is also what
// scripts/check-skill-frontmatter.js measures.
const DESCRIPTION_LIMIT = 1024;

const USAGE = [
    'usage: node scripts/new-shell.mjs <slug> --description "<text>" [--title "<Title>"] [--flow --steps <n>] [--force]',
    "",
    "  <slug>          folder and frontmatter name, matching /^[a-z0-9][a-z0-9-]{1,63}$/",
    "  --description   one line a host matches a user request against, at most 1024 characters",
    '  --title         H1 of the generated file; defaults to the slug in title case plus " with Well"',
    "  --flow          the skill walks other skills in order; requires --steps",
    "  --steps <n>     how many steps the flow has",
    "  --force         overwrite an existing skills/<slug>/SKILL.md",
].join("\n");

function fail(message) {
    console.error(message);
    process.exit(1);
}

function parseArgs(argv) {
    const options = { slug: null, description: null, title: null, flow: false, steps: null, force: false };
    const valueFlags = { "--description": "description", "--title": "title", "--steps": "steps" };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === "--flow") {
            options.flow = true;
        } else if (arg === "--force") {
            options.force = true;
        } else if (arg in valueFlags) {
            const value = argv[++i];
            if (value === undefined) fail(`${arg} needs a value.\n\n${USAGE}`);
            options[valueFlags[arg]] = value;
        } else if (arg.startsWith("-")) {
            fail(`unknown option "${arg}".\n\n${USAGE}`);
        } else if (options.slug === null) {
            options.slug = arg;
        } else {
            fail(`unexpected argument "${arg}"; pass one slug.\n\n${USAGE}`);
        }
    }
    return options;
}

const ESCAPES = { "\\": "\\\\", '"': '\\"', "\n": "\\n", "\r": "\\r", "\t": "\\t" };

// YAML reads a bare colon-space inside an unquoted value as the start of a
// nested mapping, which is the bug scripts/check-skill-frontmatter.js exists to
// catch. Quoting every description keeps the caller free to write one naturally
// instead of remembering the rule.
function yamlDoubleQuoted(value) {
    const escaped = value.replace(
        /[\\"\u0000-\u001f\u007f]/g,
        (character) => ESCAPES[character] ?? `\\u${character.codePointAt(0).toString(16).padStart(4, "0")}`,
    );
    return `"${escaped}"`;
}

function titleFromSlug(slug) {
    const words = slug
        .split("-")
        .filter(Boolean)
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(" ");
    return `${words} with Well`;
}

function main() {
    const options = parseArgs(process.argv.slice(2));

    if (options.slug === null) fail(`no slug given.\n\n${USAGE}`);
    if (!SLUG_PATTERN.test(options.slug)) {
        fail(
            `"${options.slug}" is not a valid slug. Use 2 to 64 lowercase letters, digits, and hyphens, starting with a letter or a digit.`,
        );
    }
    if (options.description === null) fail(`--description is required.\n\n${USAGE}`);
    if (options.description.trim() === "") fail("--description is empty. Write the line a host matches a user request against.");

    if (options.flow && options.steps === null) fail("--flow needs --steps <n>, the number of steps the flow walks.");
    if (!options.flow && options.steps !== null) fail("--steps only applies with --flow.");
    let flowSteps = 0;
    if (options.flow) {
        flowSteps = Number(options.steps);
        if (!Number.isInteger(flowSteps) || flowSteps < 1) {
            fail(`--steps must be a whole number of 1 or more, not "${options.steps}".`);
        }
    }

    const description = yamlDoubleQuoted(options.description);
    const written = [...description].length;
    if (written > DESCRIPTION_LIMIT) {
        const raw = [...options.description].length;
        fail(
            `description is ${raw} characters, ${written} once quoted, over the ${DESCRIPTION_LIMIT}-character limit a host enforces at install time. Shorten it.`,
        );
    }

    const file = path.join(SKILLS_DIR, options.slug, "SKILL.md");
    if (fs.existsSync(file) && !options.force) {
        fail(`skills/${options.slug}/SKILL.md already exists. Pass --force to overwrite it.`);
    }

    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(
        file,
        shellMarkdown({
            id: options.slug,
            name: options.slug,
            description,
            title: options.title ?? titleFromSlug(options.slug),
            flowSteps,
        }),
    );
    console.log(`wrote skills/${options.slug}/SKILL.md`);

    const compile = spawnSync(process.execPath, [path.join(ROOT, "scripts", "compile.mjs")], { cwd: ROOT, encoding: "utf8" });
    if (compile.status !== 0) {
        process.stdout.write(compile.stdout ?? "");
        process.stderr.write(compile.stderr ?? "");
        fail(
            `the voice atom could not be appended, so skills/${options.slug}/SKILL.md is incomplete. Fix the error above and run \`make compile\`.`,
        );
    }

    console.log(`✔ skills/${options.slug}/SKILL.md is ready. Add it to .claude-plugin/plugin.json and README.md before you ship it.`);
}

main();
