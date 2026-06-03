#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const repoRoot = process.cwd();
const options = parseArgs(process.argv.slice(2));
const errors = [];
const warnings = [];

const paths = {
  manifest: "manifest.toml",
  cargo: "hil/Cargo.toml",
  hilMain: "hil/src/main.rs",
  updateGenerator: "scripts/generate-update-manifest.mjs",
  displayPatch: "changes/browser/config/version.patch",
  flatpakManifest: "org.gkdevstudio.Hilal.yml",
  flatpakMetainfo: "flatpak/org.gkdevstudio.Hilal.metainfo.xml",
  updateManifest: "dist/hilal-update-manifest.json",
};

const metadata = {
  manifestVersion: readTomlSectionValue(paths.manifest, "browser", "version"),
  cargoVersion: readTomlSectionValue(paths.cargo, "package", "version"),
  displayVersion: readDisplayVersion(paths.displayPatch),
  flatpakSourceTag: readFlatpakSourceTag(paths.flatpakManifest),
  flatpakRelease: readFlatpakRelease(paths.flatpakMetainfo),
  distUpdateManifest: readJsonIfExists(paths.updateManifest),
};

requireValue("manifest.toml [browser].version", metadata.manifestVersion);
requireValue("hil/Cargo.toml [package].version", metadata.cargoVersion);
requireValue("browser display version patch", metadata.displayVersion);
requireValue("Flatpak source tag", metadata.flatpakSourceTag);
requireValue("Flatpak metainfo latest release", metadata.flatpakRelease?.version);

checkManifestPaths();
checkHilCliVersionSource();
checkUpdateGeneratorSourcePath();
checkFlatpakScreenshotTags();

if (metadata.displayVersion && metadata.flatpakRelease?.version) {
  compareOrWarn(
    "browser display version",
    metadata.displayVersion,
    "Flatpak metainfo release version",
    metadata.flatpakRelease.version
  );
}

if (metadata.manifestVersion && metadata.displayVersion) {
  compareOrWarn(
    "manifest.toml browser.version",
    metadata.manifestVersion,
    "browser display version",
    metadata.displayVersion
  );
}

if (metadata.distUpdateManifest) {
  compareOrWarn(
    "dist update manifest version",
    metadata.distUpdateManifest.version,
    "browser display version",
    metadata.displayVersion
  );
  compareOrWarn(
    "dist update manifest displayVersion",
    metadata.distUpdateManifest.displayVersion,
    "browser display version",
    metadata.displayVersion
  );
  if (!isFirefoxAppVersion(metadata.distUpdateManifest.appVersion)) {
    warnings.push(
      `dist update manifest appVersion should be a Firefox/Gecko version, got ${metadata.distUpdateManifest.appVersion}.`
    );
  }
}

if (options.releaseVersion) {
  checkStrictRelease(options.releaseVersion, options.releaseTag);
}

printSummary();

if (errors.length > 0) {
  console.error("\nRelease metadata check failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

if (warnings.length > 0) {
  console.log("\nWarnings:");
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}

console.log("\nRelease metadata check passed.");

function parseArgs(args) {
  const parsed = {
    checkDist: false,
    requireUpdateManifest: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    const next = args[i + 1];
    if (arg === "-h" || arg === "--help") {
      usage(0);
    } else if (arg === "--release-version") {
      parsed.releaseVersion = stripTagPrefix(requireArg(arg, next));
      i += 1;
    } else if (arg === "--release-tag") {
      parsed.releaseTag = requireArg(arg, next);
      i += 1;
    } else if (arg === "--check-dist") {
      parsed.checkDist = true;
    } else if (arg === "--require-update-manifest") {
      parsed.requireUpdateManifest = true;
    } else {
      console.error(`Unknown argument: ${arg}`);
      usage(1);
    }
  }

  return parsed;
}

function requireArg(arg, value) {
  if (!value || value.startsWith("--")) {
    console.error(`Missing value for ${arg}`);
    usage(1);
  }
  return value;
}

function usage(code) {
  console.error(`Usage:
  scripts/check-release-metadata.mjs
  scripts/check-release-metadata.mjs --release-version 0.3.0 --release-tag v0.3.0 --check-dist --require-update-manifest

Default mode validates fast repo guardrails. Release mode additionally requires
manifest, browser display version, Flatpak metadata, update manifest, and
optional dist artifact names to agree with one release version.`);
  process.exit(code);
}

function abs(file) {
  return resolve(repoRoot, file);
}

function readText(file) {
  return readFileSync(abs(file), "utf8");
}

function readTomlSectionValue(file, section, key) {
  if (!existsSync(abs(file))) {
    return "";
  }

  let currentSection = "";
  for (const rawLine of readText(file).split(/\r?\n/)) {
    const line = rawLine.trim();
    const sectionMatch = line.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      continue;
    }
    if (currentSection !== section) {
      continue;
    }
    const valueMatch = line.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"`));
    if (valueMatch) {
      return valueMatch[1];
    }
  }
  return "";
}

function readDisplayVersion(file) {
  if (!existsSync(abs(file))) {
    return "";
  }

  for (const line of readText(file).split(/\r?\n/)) {
    if (line.startsWith("+++") || !line.startsWith("+")) {
      continue;
    }
    const value = line.slice(1).trim();
    if (/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value)) {
      return value;
    }
  }
  return "";
}

function readFlatpakSourceTag(file) {
  if (!existsSync(abs(file))) {
    return "";
  }

  const text = readText(file);
  const yamlMatch = text.match(/^\s*tag:\s*["']?([^"'\s#]+)["']?/m);
  if (yamlMatch) {
    return yamlMatch[1];
  }

  const jsonMatch = text.match(/"tag"\s*:\s*"([^"]+)"/);
  return jsonMatch?.[1] || "";
}

function readFlatpakRelease(file) {
  if (!existsSync(abs(file))) {
    return null;
  }

  const releaseMatch = readText(file).match(/<release\s+([^>]+)>/);
  if (!releaseMatch) {
    return null;
  }

  const attrs = {};
  for (const attr of releaseMatch[1].matchAll(/([A-Za-z_:-]+)="([^"]*)"/g)) {
    attrs[attr[1]] = attr[2];
  }
  return attrs;
}

function readJsonIfExists(file) {
  if (!existsSync(abs(file))) {
    return null;
  }
  return JSON.parse(readText(file));
}

function requireValue(label, value) {
  if (!value) {
    errors.push(`Missing ${label}.`);
  }
}

function checkManifestPaths() {
  if (!existsSync(abs(paths.manifest))) {
    return;
  }

  const text = readText(paths.manifest);
  for (const match of text.matchAll(/^\s*path\s*=\s*"([^"]+)"/gm)) {
    const patchPath = match[1];
    if (!existsSync(abs(join("changes", patchPath)))) {
      errors.push(`manifest.toml declares missing path: changes/${patchPath}`);
    }
  }
}

function checkHilCliVersionSource() {
  if (!existsSync(abs(paths.hilMain))) {
    return;
  }

  const text = readText(paths.hilMain);
  if (/#\[command\([^\]]*version\s*=\s*"[^"]+"/s.test(text)) {
    errors.push("hil CLI version is hardcoded; use Cargo package metadata.");
  }
}

function checkUpdateGeneratorSourcePath() {
  if (!existsSync(abs(paths.updateGenerator))) {
    return;
  }

  const text = readText(paths.updateGenerator);
  if (text.includes('resolve("firefox/browser/config/version.txt")')) {
    errors.push(
      "update manifest generator still reads firefox/browser/config/version.txt; use HILAL_FIREFOX_SRC or engine/."
    );
  }
}

function checkFlatpakScreenshotTags() {
  if (!existsSync(abs(paths.flatpakMetainfo)) || !metadata.flatpakRelease?.version) {
    return;
  }

  const expectedTag = `v${metadata.flatpakRelease.version}`;
  for (const match of readText(paths.flatpakMetainfo).matchAll(
    /raw\.githubusercontent\.com\/VastSea0\/hilal-browser\/(v[^/]+)\//g
  )) {
    if (match[1] !== expectedTag) {
      errors.push(
        `Flatpak screenshot URL uses ${match[1]}, expected ${expectedTag}.`
      );
    }
  }
}

function compareOrWarn(leftLabel, left, rightLabel, right) {
  if (left !== right) {
    warnings.push(`${leftLabel} (${left}) differs from ${rightLabel} (${right}).`);
  }
}

function checkStrictRelease(version, releaseTag) {
  const expectedTag = releaseTag || `v${version}`;

  requireEqual("manifest.toml [browser].version", metadata.manifestVersion, version);
  requireEqual("browser display version", metadata.displayVersion, version);
  requireEqual("Flatpak source tag", metadata.flatpakSourceTag, expectedTag);
  requireEqual("Flatpak metainfo release version", metadata.flatpakRelease?.version, version);

  if (isPrerelease(version)) {
    requireEqual("Flatpak metainfo release type", metadata.flatpakRelease?.type, "development");
  } else if (metadata.flatpakRelease?.type === "development") {
    errors.push("Stable release metadata must not be marked type=\"development\".");
  }

  if (metadata.distUpdateManifest) {
    requireEqual("dist update manifest version", metadata.distUpdateManifest.version, version);
    requireEqual(
      "dist update manifest displayVersion",
      metadata.distUpdateManifest.displayVersion,
      version
    );
    if (!isFirefoxAppVersion(metadata.distUpdateManifest.appVersion)) {
      errors.push(
        `dist update manifest appVersion must be a Firefox/Gecko version, got ${metadata.distUpdateManifest.appVersion}.`
      );
    }
  } else if (options.requireUpdateManifest) {
    errors.push("Missing dist/hilal-update-manifest.json.");
  }

  if (options.checkDist) {
    checkDistArtifactNames(version);
  }
}

function requireEqual(label, actual, expected) {
  if (actual !== expected) {
    errors.push(`${label} is ${actual || "<missing>"}, expected ${expected}.`);
  }
}

function checkDistArtifactNames(version) {
  const distDir = abs("dist");
  if (!existsSync(distDir)) {
    errors.push("dist/ does not exist.");
    return;
  }

  for (const name of readdirSync(distDir)) {
    if (!/(hilal|Hilal-Browser)/.test(name) || !/\d+\.\d+\.\d+/.test(name)) {
      continue;
    }
    if (!name.includes(version) && !name.includes(`v${version}`)) {
      errors.push(`dist artifact ${name} does not include release version ${version}.`);
    }
  }
}

function stripTagPrefix(version) {
  return String(version).replace(/^v/i, "");
}

function isPrerelease(version) {
  return /(?:alpha|beta|rc|nightly|dev)/i.test(version);
}

function isFirefoxAppVersion(version) {
  return /^\d+(?:\.\d+)*(?:(?:a|b)\d+|esr)?$/i.test(String(version || ""));
}

function printSummary() {
  const rows = [
    ["manifest.toml browser.version", metadata.manifestVersion],
    ["hil/Cargo.toml package.version", metadata.cargoVersion],
    ["browser display version", metadata.displayVersion],
    ["Flatpak source tag", metadata.flatpakSourceTag],
    [
      "Flatpak metainfo release",
      metadata.flatpakRelease
        ? `${metadata.flatpakRelease.version} (${metadata.flatpakRelease.type || "no type"})`
        : "",
    ],
    [
      "dist update manifest",
      metadata.distUpdateManifest
        ? `${metadata.distUpdateManifest.version} display=${metadata.distUpdateManifest.displayVersion} app=${metadata.distUpdateManifest.appVersion}`
        : "not present",
    ],
  ];

  console.log("Release metadata summary:");
  for (const [label, value] of rows) {
    console.log(`- ${label}: ${value || "<missing>"}`);
  }

  if (options.releaseVersion) {
    console.log(`- strict release version: ${options.releaseVersion}`);
    console.log(`- strict release tag: ${options.releaseTag || `v${options.releaseVersion}`}`);
  }
}
