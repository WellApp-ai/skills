// The MCP server reads catalog.json and each flow's flow.json instead of holding the step
// order in its own code, and it strips the marked regions of a flow skill before it serves
// a step. Both contracts are data in this repository, so this check is what keeps them true.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const fail = (message) => errors.push(message);

const readJson = (relativePath) => {
  const absolute = join(root, relativePath);
  if (!existsSync(absolute)) {
    fail(`${relativePath}: the file does not exist.`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(absolute, "utf8"));
  } catch (error) {
    fail(`${relativePath}: the file is not valid JSON — ${error.message}`);
    return null;
  }
};

const ENTRY_KEYS = new Set(["kind", "skill", "atom", "flow"]);

const catalog = readJson("catalog.json");
if (catalog) {
  if (catalog.version !== 1) {
    fail(`catalog.json: version must be 1, found ${JSON.stringify(catalog.version)}.`);
  }
  if (!catalog.skills || typeof catalog.skills !== "object" || Array.isArray(catalog.skills)) {
    fail("catalog.json: skills must be an object of skill entries.");
  }
}

const entries = catalog && catalog.skills && typeof catalog.skills === "object" ? catalog.skills : {};

for (const [id, entry] of Object.entries(entries)) {
  const where = `catalog.json: ${id}`;
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    fail(`${where}: the entry must be an object.`);
    continue;
  }
  for (const key of Object.keys(entry)) {
    if (!ENTRY_KEYS.has(key)) fail(`${where}: the key "${key}" is not allowed.`);
  }
  if (entry.kind !== "flow" && entry.kind !== "brick") {
    fail(`${where}: kind must be "flow" or "brick", found ${JSON.stringify(entry.kind)}.`);
  }
  for (const key of ["skill", "atom", "flow"]) {
    if (entry[key] === undefined) continue;
    if (typeof entry[key] !== "string") {
      fail(`${where}: ${key} must be a path.`);
      continue;
    }
    if (!existsSync(join(root, entry[key]))) {
      fail(`${where}: ${key} points at ${entry[key]}, which does not exist on disk.`);
    }
  }
  if (typeof entry.skill !== "string") fail(`${where}: the entry needs a skill path.`);
  if (entry.kind === "flow" && typeof entry.flow !== "string") {
    fail(`${where}: a flow entry needs a flow path.`);
  }
  if (entry.kind === "brick" && entry.flow !== undefined) {
    fail(`${where}: a brick entry must carry no flow path.`);
  }
}

const paragraphsOf = (text) => text.split("\n");

const checkMarkers = (relativePath, lines) => {
  const open = /^\s*<!--\s*well:([a-z-]+)\s*-->\s*$/;
  const close = /^\s*<!--\s*\/well:([a-z-]+)\s*-->\s*$/;
  const regions = [];
  let current = null;
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const opened = open.exec(line);
    const closed = close.exec(line);
    if (opened) {
      if (current) {
        fail(`${relativePath}:${lineNumber}: the marker well:${current.name} opened at line ${current.start} is still open.`);
      }
      current = { name: opened[1], start: lineNumber };
      return;
    }
    if (closed) {
      if (!current) {
        fail(`${relativePath}:${lineNumber}: the marker /well:${closed[1]} closes nothing.`);
        return;
      }
      if (current.name !== closed[1]) {
        fail(`${relativePath}:${lineNumber}: /well:${closed[1]} closes well:${current.name}, opened at line ${current.start}.`);
      }
      regions.push({ name: current.name, start: current.start, end: lineNumber });
      current = null;
    }
  });
  if (current) {
    fail(`${relativePath}:${current.start}: the marker well:${current.name} is opened and never closed.`);
  }
  return regions;
};

const sectionRange = (lines, heading) => {
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start < 0) return null;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s/.test(lines[index])) {
      end = index;
      break;
    }
  }
  return { start: start + 1, end };
};

for (const [id, entry] of Object.entries(entries)) {
  if (entry?.kind !== "flow" || typeof entry.flow !== "string" || typeof entry.skill !== "string") continue;
  if (!existsSync(join(root, entry.flow)) || !existsSync(join(root, entry.skill))) continue;

  const flow = readJson(entry.flow);
  const skillLines = paragraphsOf(readFileSync(join(root, entry.skill), "utf8"));
  const regions = checkMarkers(entry.skill, skillLines);

  const tooling = sectionRange(skillLines, "## Tooling");
  if (!tooling) {
    fail(`${entry.skill}: the file carries no "## Tooling" section.`);
  } else if (!regions.some((region) => region.name === "bans" && region.start > tooling.start && region.end <= tooling.end)) {
    fail(`${entry.skill}: the Tooling section carries no <!-- well:bans --> block.`);
  }

  const inFallback = (lineNumber) =>
    regions.some((region) => region.name === "inline-fallback" && lineNumber > region.start && lineNumber < region.end);
  skillLines.forEach((line, index) => {
    if (!line.trim().startsWith("**Inline fallback")) return;
    if (!inFallback(index + 1)) {
      fail(`${entry.skill}:${index + 1}: this inline fallback paragraph sits outside a <!-- well:inline-fallback --> block.`);
    }
  });

  if (!flow) continue;
  if (flow.version !== 1) fail(`${entry.flow}: version must be 1, found ${JSON.stringify(flow.version)}.`);
  if (flow.skill !== id) {
    fail(`${entry.flow}: skill is ${JSON.stringify(flow.skill)}, but the catalogue lists this flow as "${id}".`);
  }
  if (!Array.isArray(flow.steps) || flow.steps.length === 0) {
    fail(`${entry.flow}: steps must be a non-empty array.`);
    continue;
  }

  flow.steps.forEach((step, index) => {
    const position = index + 1;
    const where = `${entry.flow}: step ${position}`;
    if (step.step !== position) {
      fail(`${where}: the steps must be numbered 1..${flow.steps.length} in order, found ${JSON.stringify(step.step)}.`);
    }
    const brick = entries[step.brick];
    if (!brick) {
      fail(`${where}: the brick "${step.brick}" is not a catalogue entry.`);
    } else if (brick.kind !== "brick") {
      fail(`${where}: the brick "${step.brick}" is a catalogue entry of kind "${brick.kind}".`);
    }
    if (step.atomProps !== undefined) {
      for (const [name, value] of Object.entries(step.atomProps)) {
        if (typeof value !== "string" && typeof value !== "boolean") {
          fail(`${where}: atomProps.${name} must be a string or a boolean.`);
        }
      }
    }
    const heading = `### Step ${step.step} — `;
    const found = skillLines.find((line) => line.startsWith(heading));
    if (!found) {
      fail(`${where}: ${entry.skill} carries no "${heading.trim()}" heading.`);
      return;
    }
    const title = found.slice(heading.length).trim();
    if (title !== step.title) {
      fail(`${where}: the title is ${JSON.stringify(step.title)}, but the heading reads ${JSON.stringify(title)}.`);
    }
  });
}

if (errors.length) {
  console.error("The catalogue and the flow map are inconsistent:");
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}

const flowCount = Object.values(entries).filter((entry) => entry?.kind === "flow").length;
console.log(`catalog.json: ${Object.keys(entries).length} skills, ${flowCount} flow map(s) consistent`);
