#!/usr/bin/env node
// Generate the POC stub skills and their Claude Desktop archives.
//
// A stub carries no instructions of its own. It names the skill and tells the
// model to fetch the real content from Well's MCP server, so the instruction
// set can change server-side without a reinstall. The body prose comes from
// scripts/shell-markdown.mjs, shared with the `make new` generator. The
// frontmatter description is copied byte for byte from the shipped skill,
// because that string is what a host matches a user request against: a reworded
// stub would be discovered for different requests than the skill it stands in for.
//
// The archives mirror scripts/build-dist.sh: SKILL.md at the archive root,
// the system zip binary, `.skill` stored and `.zip` deflated.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { shellMarkdown } from "../scripts/shell-markdown.mjs";

const POC_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(POC_DIR, "..");
const SOURCE_SKILLS = path.join(ROOT, "skills");
const STUB_SKILLS = path.join(POC_DIR, "well-skills-poc", "skills");
const DIST_STUB = path.join(POC_DIR, "dist-stub");

// A host rejects a longer description at install time, so an overlong copy is
// reported rather than trimmed: a silently truncated description changes what
// the stub gets discovered for.
const DESCRIPTION_LIMIT = 1024;

const SKILL_IDS = [
    "fetch-missing-invoices",
    "define-workspace",
    "connect-tools",
    "connect-bank",
    "define-period",
    "categorize-counterparties",
    "show-missing-invoices",
    "deploy-agents",
];

// The one skill that walks the other seven in order. Its stub carries the extra
// step-chaining instruction; the single-step stubs must not, or the model would
// look for a next step that no single-step skill returns.
const FLOW_SKILL_ID = "fetch-missing-invoices";
const FLOW_STEPS = 7;

function readSource(id) {
    const file = path.join(SOURCE_SKILLS, id, "SKILL.md");
    const text = fs.readFileSync(file, "utf8");
    if (!text.startsWith("---\n")) throw new Error(`${file}: no frontmatter block`);
    const end = text.indexOf("\n---", 4);
    if (end === -1) throw new Error(`${file}: unterminated frontmatter block`);
    const frontmatter = text.slice(4, end);
    const body = text.slice(end + 4);

    const name = frontmatter.match(/^name: (.*)$/m);
    const description = frontmatter.match(/^description: (.*)$/m);
    const heading = body.match(/^# (.*)$/m);
    if (!name) throw new Error(`${file}: no name in frontmatter`);
    if (!description) throw new Error(`${file}: no description in frontmatter`);
    if (!heading) throw new Error(`${file}: no H1 heading in body`);

    return { file, name: name[1], description: description[1], title: heading[1] };
}

function zipStub(id, stubPath) {
    const stage = fs.mkdtempSync(path.join(DIST_STUB, `.stage-${id}-`));
    try {
        fs.copyFileSync(stubPath, path.join(stage, "SKILL.md"));
        for (const [file, flags] of [
            [`${id}.zip`, ["-r", "-X", "-q"]],
            [`${id}.skill`, ["-0r", "-X", "-q"]],
        ]) {
            const out = path.join(DIST_STUB, file);
            fs.rmSync(out, { force: true });
            const result = spawnSync("zip", [...flags, out, ".", "-x", ".DS_Store"], { cwd: stage });
            if (result.status !== 0) {
                throw new Error(`zip failed for ${file}: ${result.stderr?.toString() ?? result.status}`);
            }
        }
    } finally {
        fs.rmSync(stage, { recursive: true, force: true });
    }
}

function main() {
    fs.mkdirSync(DIST_STUB, { recursive: true });
    const overlong = [];

    for (const id of SKILL_IDS) {
        const source = readSource(id);
        if (source.name !== id) {
            throw new Error(`${source.file}: frontmatter name "${source.name}" does not match its folder "${id}"`);
        }
        const chars = [...source.description].length;
        if (chars > DESCRIPTION_LIMIT) {
            overlong.push({ id, chars });
        }

        const dir = path.join(STUB_SKILLS, id);
        fs.mkdirSync(dir, { recursive: true });
        const stubPath = path.join(dir, "SKILL.md");
        fs.writeFileSync(stubPath, shellMarkdown({ id, ...source, flowSteps: id === FLOW_SKILL_ID ? FLOW_STEPS : 0 }));
        zipStub(id, stubPath);
        console.log(`built skills/${id}/SKILL.md and dist-stub/${id}.{zip,skill} (description ${chars} chars)`);
    }

    if (overlong.length > 0) {
        console.error("");
        console.error(`✘ ${overlong.length} description(s) exceed the ${DESCRIPTION_LIMIT}-code-point limit and were copied whole:`);
        for (const { id, chars } of overlong) console.error(`    ${id}: ${chars} code points`);
        console.error("Shorten the source skill's description; this script never truncates one.");
        process.exit(1);
    }

    console.log(`✔ ${SKILL_IDS.length} stub(s) built`);
}

main();
