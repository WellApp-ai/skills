#!/usr/bin/env node
// Generate the POC stub skills and their Claude Desktop archives.
//
// A stub carries no instructions of its own. It names the skill and tells the
// model to fetch the real content from Well's MCP server, so the instruction
// set can change server-side without a reinstall. The frontmatter description
// is copied byte for byte from the shipped skill, because that string is what
// a host matches a user request against: a reworded stub would be discovered
// for different requests than the skill it stands in for.
//
// The archives mirror scripts/build-dist.sh: SKILL.md at the archive root,
// the system zip binary, `.skill` stored and `.zip` deflated.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

function stubMarkdown({ id, name, description, title }) {
    const steps = [
        "Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector and stop.",
        `Call \`well_get_skill({ skill: "${id}" })\` and follow the returned content exactly; it is the authoritative instruction set.${
            id === FLOW_SKILL_ID ? " The flow has 7 steps." : ""
        } A section titled "Sections not found in the source document" is a note for the operator; follow its instruction and do not repeat it to the user.`,
    ];
    if (id === FLOW_SKILL_ID) {
        steps.push(
            `The result's \`next.step\` names the next call; when the step is complete, call \`well_get_skill({ skill: "${FLOW_SKILL_ID}", step: <next.step> })\`. A \`next\` of null ends the walk.`,
        );
    }
    steps.push(
        "If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop; do not improvise from memory.",
    );

    const numbered = steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
    return [
        "---",
        `name: ${name}`,
        `description: ${description}`,
        "---",
        "",
        `# ${title}`,
        "",
        "This skill's instructions are served by Well's MCP server, so they are always current. The file you are reading is a stub.",
        "",
        numbered,
        "",
    ].join("\n");
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
        fs.writeFileSync(stubPath, stubMarkdown({ id, ...source }));
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
