/**
 * Script para gerar informações de versão do build
 * Executado automaticamente antes do build via npm prebuild
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function getGitCommit() {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

function getGitBranch() {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

const version = {
  version: process.env.npm_package_version || "1.0.0",
  buildDate: new Date().toISOString(),
  commit: getGitCommit(),
  branch: getGitBranch(),
  environment: process.env.NODE_ENV || "development",
  nodeVersion: process.version,
};

const outputPath = path.join(__dirname, "..", "public", "version.json");

fs.writeFileSync(outputPath, JSON.stringify(version, null, 2));

console.log("✓ Version file generated:", outputPath);
console.log("  Version:", version.version);
console.log("  Commit:", version.commit);
console.log("  Branch:", version.branch);
console.log("  Build Date:", version.buildDate);
