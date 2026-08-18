import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const failures = [];

function readJson(path) {
  return JSON.parse(readFileSync(resolve(root, path), "utf8"));
}

function readText(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function fail(message) {
  failures.push(message);
}

function isHttpsUrl(value) {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const policy = readJson("src/config/release-channel.json");

function validateReleaseChannel() {
  const tauri = readJson("crates/oac-desktop/tauri.conf.json");
  const capabilities = readJson("crates/oac-desktop/capabilities/default.json");
  const updater = tauri.plugins?.updater;
  const updaterEndpoints = updater?.endpoints ?? [];
  const permissions = capabilities.permissions ?? [];

  if (tauri.identifier !== "com.openagentconfig.app") {
    fail("Tauri identifier must use the OAC application identity");
  }

  if (policy.enabled) {
    if (!isHttpsUrl(policy.webReleaseApiUrl)) {
      fail("enabled release channel requires an HTTPS webReleaseApiUrl");
    }
    if (!isHttpsUrl(policy.webUpdateInstructionsUrl)) {
      fail("enabled release channel requires an HTTPS webUpdateInstructionsUrl");
    }
    if (!Array.isArray(updaterEndpoints) || updaterEndpoints.length === 0) {
      fail("enabled release channel requires at least one Tauri updater endpoint");
    }
    if (!updaterEndpoints.every(isHttpsUrl)) {
      fail("all Tauri updater endpoints must use HTTPS");
    }
    if (typeof updater?.pubkey !== "string" || updater.pubkey.trim() === "") {
      fail("enabled release channel requires a Tauri updater public key");
    }
    if (tauri.bundle?.createUpdaterArtifacts !== true) {
      fail("enabled release channel requires createUpdaterArtifacts=true");
    }
    for (const permission of ["updater:default", "process:allow-restart"]) {
      if (!permissions.includes(permission)) {
        fail(`enabled release channel requires capability ${permission}`);
      }
    }
  } else {
    if (policy.webReleaseApiUrl !== null) {
      fail("disabled release channel must not configure webReleaseApiUrl");
    }
    if (policy.webUpdateInstructionsUrl !== null) {
      fail("disabled release channel must not configure webUpdateInstructionsUrl");
    }
    if (updater !== undefined) {
      fail("disabled release channel must not configure the Tauri updater");
    }
    if (tauri.bundle?.createUpdaterArtifacts !== false) {
      fail("disabled release channel requires createUpdaterArtifacts=false");
    }
    for (const permission of ["updater:default", "process:allow-restart"]) {
      if (permissions.includes(permission)) {
        fail(`disabled release channel must not grant capability ${permission}`);
      }
    }
  }

  const configuredUrls = [
    policy.webReleaseApiUrl,
    policy.webUpdateInstructionsUrl,
    ...updaterEndpoints,
  ].filter((value) => typeof value === "string");

  if (
    configuredUrls.some((value) =>
      value.toLowerCase().includes("realzst/harnesskit"),
    )
  ) {
    fail("fork release channel must not point to RealZST/HarnessKit");
  }

  for (const path of ["install.sh", "install.ps1"]) {
    const installer = readText(path);
    if (/realzst\/harnesskit/i.test(installer)) {
      fail(`${path} must not download from the legacy upstream repository`);
    }
  }

  const releaseWorkflow = readText(".github/workflows/release.yml");
  if (/release\/hk(?:\.exe)?\b|\bhk-(?:macos|linux|windows)/i.test(releaseWorkflow)) {
    fail("release workflow must publish the oac binary and OAC-named assets");
  }
}

validateReleaseChannel();

if (failures.length > 0) {
  console.error("Release channel check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    `Release channel check passed: ${policy.enabled ? "enabled" : "disabled"}.`,
  );
}
