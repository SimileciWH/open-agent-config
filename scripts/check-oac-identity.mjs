import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const scriptPath = "scripts/check-oac-identity.mjs";

const kitMigrationFiles = new Set([
  "crates/oac-core/src/app_paths.rs",
  "crates/oac-core/src/kits/tests/service.rs",
  "src/lib/i18n/locales/en/kits.json",
  "src/lib/i18n/locales/zh-TW/kits.json",
  "src/lib/i18n/locales/zh/kits.json",
  "src/pages/kits.tsx",
]);

const browserMigrationFiles = new Set([
  "src/components/onboarding/onboarding.tsx",
  "src/components/shared/hint.tsx",
  "src/lib/__tests__/i18n.test.ts",
  "src/lib/__tests__/scope-store.test.ts",
  "src/lib/i18n/index.ts",
  "src/lib/transport.ts",
  "src/pages/__tests__/kits.test.tsx",
  "src/pages/kits.tsx",
  "src/pages/overview.tsx",
  "src/stores/__tests__/ui-store.test.ts",
  "src/stores/marketplace-store.ts",
  "src/stores/scope-store.ts",
  "src/stores/ui-store.ts",
  "src/stores/update-store.ts",
]);

function allowedLine(path, line) {
  if (
    path === "crates/oac-core/src/app_paths.rs" &&
    /\.harnesskit|harnesskit\.json|\.hk-kit\.zip/i.test(line)
  ) {
    return true;
  }

  if (
    path === "crates/oac-core/src/deployer.rs" &&
    /managed by HarnessKit|_hk_name/i.test(line)
  ) {
    return true;
  }

  if (
    path === "crates/oac-core/src/adapter/codex.rs" &&
    /_hk_name/i.test(line)
  ) {
    return true;
  }

  if (kitMigrationFiles.has(path) && /\.hk-kit\.zip/i.test(line)) {
    return true;
  }

  if (
    browserMigrationFiles.has(path) &&
    /harnesskit-tips-cache|\bhk[-:_]/i.test(line)
  ) {
    return true;
  }

  if (
    path === "ai-docs/modules/manager-deployer.md" &&
    /_hk_name/i.test(line)
  ) {
    return true;
  }

  if (
    path === "scripts/check-release-channel.mjs" &&
    (/realzst\\?\/harnesskit/i.test(line) ||
      /release\\?\/hk|hk-\(\?:macos\|linux\|windows\)/i.test(line))
  ) {
    return true;
  }

  return false;
}

function trackedAndUntrackedFiles() {
  const output = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: root },
  );

  return output.toString("utf8").split("\0").filter(Boolean);
}

function validateIdentity() {
  const failures = [];
  let allowedCount = 0;
  const legacyIdentity = /harness[ -]?kit|harnesskit|(?:^|[^a-z0-9])hk(?:$|[^a-z0-9])/i;

  for (const path of trackedAndUntrackedFiles()) {
    if (path === scriptPath) continue;

    const absolutePath = resolve(root, path);
    // Deleted tracked files remain in `git ls-files --cached` until commit.
    if (!existsSync(absolutePath)) continue;

    const buffer = readFileSync(absolutePath);
    if (buffer.includes(0)) continue;

    const lines = buffer.toString("utf8").split(/\r?\n/);
    for (const [index, originalLine] of lines.entries()) {
      // Hong Kong locale tags are unrelated to the retired product identity.
      const line = originalLine.replaceAll(/zh-hk/gi, "zh-locale");
      if (!legacyIdentity.test(line)) continue;

      if (allowedLine(path, originalLine)) {
        allowedCount += 1;
        continue;
      }

      failures.push(`${path}:${index + 1}: ${originalLine.trim()}`);
    }
  }

  if (failures.length > 0) {
    console.error("OAC identity check failed; unexpected legacy identity remains:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `OAC identity check passed: ${allowedCount} legacy migration or upstream-guard lines allowlisted.`,
  );
}

validateIdentity();
