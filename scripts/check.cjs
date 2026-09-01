const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { pathToFileURL } = require("node:url");

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

const appModuleCheck = spawnSync(process.execPath, [
  "--input-type=module",
  "--eval",
  `await import(${JSON.stringify(pathToFileURL(path.join(root, "js", "app.js")).href)});`
], { stdio: "inherit" });
if (appModuleCheck.status !== 0) process.exit(appModuleCheck.status || 1);

const missingReferences = [];
const pagesMissingHeader = [];
const pagesMissingTheme = [];
for (const name of fs.readdirSync(root).filter((file) => file.endsWith(".html"))) {
  const html = fs.readFileSync(path.join(root, name), "utf8");
  if (!html.includes('id="siteHeader"') || !html.includes('aria-label="Primary navigation"')) {
    pagesMissingHeader.push(name);
  }
  if (!html.includes('src="js/theme.js"') || !html.includes("data-theme-toggle")) {
    pagesMissingTheme.push(name);
  }
  const references = html.matchAll(/(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g);
  for (const [, reference] of references) {
    if (/^(?:https?:|mailto:|tel:|data:)/.test(reference)) continue;
    if (!fs.existsSync(path.resolve(root, reference))) missingReferences.push(`${name}: ${reference}`);
  }
}

if (pagesMissingHeader.length) {
  console.error(`Pages missing the shared navigation banner:\n${pagesMissingHeader.join("\n")}`);
  process.exit(1);
}

if (pagesMissingTheme.length) {
  console.error(`Pages missing dark-mode wiring:\n${pagesMissingTheme.join("\n")}`);
  process.exit(1);
}

if (missingReferences.length) {
  console.error(`Missing local references:\n${missingReferences.join("\n")}`);
  process.exit(1);
}

console.log(`Checked ${sourceFiles.length} scripts and all local HTML references.`);
