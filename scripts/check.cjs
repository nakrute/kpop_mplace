const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const sourceFiles = [
  ...fs.readdirSync(path.join(root, "js"), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => path.join(root, "js", entry.name)),
  path.join(root, "scripts", "serve.cjs"),
  ...fs.readdirSync(path.join(root, "server"), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".cjs"))
    .map((entry) => path.join(root, "server", entry.name))
];

for (const file of sourceFiles) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}

const missingReferences = [];
for (const name of fs.readdirSync(root).filter((file) => file.endsWith(".html"))) {
  const html = fs.readFileSync(path.join(root, name), "utf8");
  const references = html.matchAll(/(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g);
  for (const [, reference] of references) {
    if (/^(?:https?:|mailto:|tel:|data:)/.test(reference)) continue;
    if (!fs.existsSync(path.resolve(root, reference))) missingReferences.push(`${name}: ${reference}`);
  }
}

if (missingReferences.length) {
  console.error(`Missing local references:\n${missingReferences.join("\n")}`);
  process.exit(1);
}

console.log(`Checked ${sourceFiles.length} scripts and all local HTML references.`);
