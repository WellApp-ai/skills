// The body every shell skill ships.
//
// A shell carries no instructions of its own. It names the skill and tells the
// model to fetch the real content from Well's MCP server, so the instruction
// set can change server-side without a reinstall. This module is the single
// copy of that prose: `scripts/new-shell.mjs` writes a new shell with it and
// `poc/build-stubs.mjs` rebuilds the proof-of-concept stubs with it, so the two
// can never drift into describing the runtime differently.

// The caller formats the frontmatter description, because the two callers need
// different formatting and both are correct. The generator emits a YAML
// double-quoted string, since a hand-typed description may hold a colon. The
// stub build copies the shipped skill's scalar byte for byte, because that
// string is what a host matches a user request against: a reformatted stub
// would be discovered for different requests than the skill it stands in for.
export function shellMarkdown({ id, name, description, title, flowSteps = 0 }) {
    const flowNote = flowSteps > 0 ? ` The flow has ${flowSteps} step${flowSteps === 1 ? "" : "s"}.` : "";

    const steps = [
        "Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector and stop.",
        `Call \`well_get_skill({ skill: "${id}" })\` and follow the returned content exactly; it is the authoritative instruction set.${flowNote} A section titled "Sections not found in the source document" is a note for the operator; follow its instruction and do not repeat it to the user.`,
    ];
    // Only a flow skill returns a next step, so only a flow shell asks for one.
    // A single-step shell carrying this instruction would send the model looking
    // for a step that never comes back.
    if (flowSteps > 0) {
        steps.push(
            `The result's \`next.step\` names the next call; when the step is complete, call \`well_get_skill({ skill: "${id}", step: <next.step> })\`. A \`next\` of null ends the walk.`,
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
