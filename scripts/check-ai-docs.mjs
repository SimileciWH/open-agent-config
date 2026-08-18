import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const docsRoot = resolve(root, "ai-docs");
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function repositoryFiles() {
  return execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" })
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
}

const files = repositoryFiles();
const sourceFiles = files.filter((file) => !file.startsWith("ai-docs/") && file !== "AGENTS.md");
const fileSet = new Set(files);

function patternToRegExp(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped.replaceAll("*", ".*")}$`);
}

function matchesSource(pattern) {
  if (!pattern.includes("*")) {
    return fileSet.has(pattern) || existsSync(resolve(root, pattern));
  }
  const expression = patternToRegExp(pattern);
  return files.some((file) => expression.test(file));
}

function parseFrontMatter(path) {
  const content = read(path);
  if (!content.startsWith("---\n")) {
    fail(`${path}: missing front matter`);
    return { content, values: {} };
  }
  const end = content.indexOf("\n---\n", 4);
  if (end < 0) {
    fail(`${path}: unterminated front matter`);
    return { content, values: {} };
  }
  const lines = content.slice(4, end).split("\n");
  const values = {};
  let arrayKey = null;
  for (const line of lines) {
    if (line.startsWith("  - ") && arrayKey) {
      values[arrayKey] ??= [];
      values[arrayKey].push(line.slice(4).trim());
      continue;
    }
    const match = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!match) {
      continue;
    }
    const [, key, rawValue] = match;
    if (rawValue) {
      values[key] = rawValue;
      arrayKey = null;
    } else {
      values[key] = [];
      arrayKey = key;
    }
  }
  return { content, values };
}

for (const required of [
  "ai-docs/README.md",
  "ai-docs/INDEX.md",
  "ai-docs/MAP.json",
  "ai-docs/ROADMAP.md",
  "ai-docs/WORKFLOW.md",
  "ai-docs/COVERAGE.md",
  "ai-docs/SYNC_LOG.md",
  "ai-docs/qa/golden.yaml",
]) {
  if (!existsSync(resolve(root, required))) {
    fail(`${required}: required file is missing`);
  }
}

let map;
try {
  map = JSON.parse(read("ai-docs/MAP.json"));
} catch (error) {
  fail(`ai-docs/MAP.json: invalid JSON (${error.message})`);
}

if (map) {
  const actual = {
    source_files: sourceFiles.length,
    rust_files: sourceFiles.filter((file) => file.endsWith(".rs")).length,
    typescript_and_tsx_files: sourceFiles.filter((file) => /\.(ts|tsx)$/.test(file)).length,
    workflow_files: sourceFiles.filter((file) => file.startsWith(".github/workflows/")).length,
  };
  for (const [key, expected] of Object.entries(actual)) {
    if (map.inventory?.[key] !== expected) {
      fail(`ai-docs/MAP.json: inventory.${key}=${map.inventory?.[key]} but actual=${expected}`);
    }
  }
  for (const module of map.modules ?? []) {
    const cardPath = `ai-docs/${module.card}`;
    if (!existsSync(resolve(root, cardPath))) {
      fail(`${cardPath}: module card from MAP.json is missing`);
    }
  }
}

const moduleCards = files
  .filter((file) => file.startsWith("ai-docs/modules/") && file.endsWith(".md"))
  .map((file) => file);

for (const path of moduleCards) {
  const { values } = parseFrontMatter(path);
  for (const required of ["id", "level", "status", "verified_commit", "last_verified"]) {
    if (!values[required]) {
      fail(`${path}: missing front matter field ${required}`);
    }
  }
  if (!/^L[0-4]$/.test(values.level ?? "")) {
    fail(`${path}: level must be L0-L4`);
  }
  if (!/^[0-9a-f]{40}$/.test(values.verified_commit ?? "")) {
    fail(`${path}: verified_commit must be a 40-character Git SHA`);
  }
  for (const source of values.source_paths ?? []) {
    if (!matchesSource(source)) {
      fail(`${path}: source path does not match tracked files: ${source}`);
    }
  }
  for (const anchor of values.stable_anchors ?? []) {
    const separator = anchor.indexOf("::");
    if (separator < 1) {
      fail(`${path}: invalid stable anchor: ${anchor}`);
      continue;
    }
    const sourcePath = anchor.slice(0, separator);
    const symbol = anchor.slice(separator + 2);
    if (!matchesSource(sourcePath)) {
      fail(`${path}: anchor source path does not exist: ${sourcePath}`);
      continue;
    }
    const matchingPaths = sourcePath.includes("*")
      ? files.filter((file) => patternToRegExp(sourcePath).test(file))
      : [sourcePath];
    if (!matchingPaths.some((file) => read(file).includes(symbol))) {
      fail(`${path}: symbol not found for anchor ${anchor}`);
    }
  }
}

const golden = read("ai-docs/qa/golden.yaml");
if (!golden.includes("cases:") || !golden.includes("Q-001") || !golden.includes("Q-008")) {
  fail("ai-docs/qa/golden.yaml: expected Golden QA cases are missing");
}

if (failures.length > 0) {
  console.error("AI Docs check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(`AI Docs check passed: ${moduleCards.length} module cards, ${files.length} tracked source/docs files indexed.`);
}
