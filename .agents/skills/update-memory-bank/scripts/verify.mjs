#!/usr/bin/env node
// Verifies the acceptance criteria of the `update-memory-bank` skill.
// Usage: node .agents/skills/update-memory-bank/scripts/verify.mjs [--base <ref>]
// Exit code 0 = PASS, 1 = FAIL. Only uses Node built-ins and git.

import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const git = (cmd) =>
  execSync(`git ${cmd}`, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

const root = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
const MB = join(root, "memory-bank");

const REQUIRED = [
  "projectbrief.md",
  "productContext.md",
  "techContext.md",
  "systemPatterns.md",
  "activeContext.md",
  "progress.md",
];
const PRODUCT_DIRS = [
  "uis/", "services/", "packages/", "agents/", "skills/", "mcps/",
  "workflows/", "data/", "shared/", "infra/", "scripts/", "internal/",
];
const BUSINESS_FILES = ["memory-bank/projectbrief.md", "memory-bank/productContext.md"];
const PLACEHOLDERS = [/\bTODO\b/, /\bTBD\b/, /lorem ipsum/i, /<company[^>]*>/i, /\[placeholder\]/i, /\{\{[^}]*\}\}/];

// ---- args / base ----------------------------------------------------------
const args = process.argv.slice(2);
const baseArg = args.includes("--base") ? args[args.indexOf("--base") + 1] : null;
function resolveBase() {
  for (const ref of baseArg ? [baseArg] : ["origin/main", "main"]) {
    try { git(`rev-parse --verify --quiet ${ref}`); return ref; } catch { /* try next */ }
  }
  return null;
}
const base = resolveBase();

// ---- changed files (committed vs base + working tree) ---------------------
const changed = new Map(); // path -> status letter (A, M, D, R, ?)
let mergeBase = null;
if (base) {
  try {
    mergeBase = git(`merge-base ${base} HEAD`);
    for (const line of git(`diff --name-status ${mergeBase}`).split("\n").filter(Boolean)) {
      const parts = line.split("\t");
      changed.set(parts[parts.length - 1], parts[0][0]);
    }
  } catch { /* no common history */ }
}
for (const line of git("status --porcelain=v1 -uall").split("\n").filter(Boolean)) {
  const xy = line.slice(0, 2);
  let p = line.slice(3);
  if (p.includes(" -> ")) p = p.split(" -> ")[1];
  p = p.replace(/^"|"$/g, "");
  const status = xy === "??" ? "A" : (xy.trim()[0] || "M");
  if (!changed.has(p) || status === "A") changed.set(p, status);
}

// ---- checks ---------------------------------------------------------------
const results = [];
const pass = (id, msg) => results.push({ level: "PASS", id, msg });
const fail = (id, msg) => results.push({ level: "FAIL", id, msg });
const warn = (id, msg) => results.push({ level: "WARN", id, msg });

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
const mbFiles = existsSync(MB) ? readdirSync(MB).filter((f) => f.endsWith(".md")) : [];
const read = (f) => readFileSync(join(MB, f), "utf8");
const lastUpdated = (text) => (text.match(/^Last updated:\s*(\d{4}-\d{2}-\d{2})\s*$/m) || [])[1] || null;

// AC1 required-files
{
  const bad = REQUIRED.filter((f) => !existsSync(join(MB, f)) || statSync(join(MB, f)).size === 0);
  bad.length ? fail("required-files", `missing or empty: ${bad.join(", ")}`) : pass("required-files", `${REQUIRED.length} files present`);
}

// AC2 last-updated
{
  const bad = [];
  for (const f of mbFiles) {
    const d = lastUpdated(read(f));
    if (!d || Number.isNaN(Date.parse(d))) bad.push(`${f} (no valid 'Last updated: YYYY-MM-DD')`);
    else if (d > todayStr) bad.push(`${f} (${d} is in the future)`);
  }
  bad.length ? fail("last-updated", bad.join("; ")) : pass("last-updated", "all files dated");
}

// AC3 progress-updated
{
  const productChanges = [...changed.keys()].filter((p) => PRODUCT_DIRS.some((d) => p.startsWith(d)));
  if (productChanges.length === 0) {
    pass("progress-updated", "no product-folder changes on this branch");
  } else if (!changed.has("memory-bank/progress.md")) {
    fail("progress-updated", `${productChanges.length} product file(s) changed (e.g. ${productChanges[0]}) but memory-bank/progress.md was not updated`);
  } else {
    const d = existsSync(join(MB, "progress.md")) ? lastUpdated(read("progress.md")) : null;
    const baseDate = mergeBase ? git(`show -s --format=%cs ${mergeBase}`) : null;
    if (baseDate && d && d < baseDate) fail("progress-updated", `progress.md 'Last updated' ${d} is older than base commit ${baseDate}`);
    else pass("progress-updated", "progress.md updated alongside product changes");
  }
}

// AC4 new-projects-documented
{
  const tech = existsSync(join(MB, "techContext.md")) ? read("techContext.md") : "";
  const manifests = [...changed.entries()]
    .filter(([p, s]) => s === "A" && /(^|\/)(package\.json|pyproject\.toml)$/.test(p) && !p.includes("node_modules/"))
    .map(([p]) => dirname(p));
  const undocumented = manifests.filter((dir) => !tech.includes(dir));
  undocumented.length
    ? fail("new-projects-documented", `not mentioned in techContext.md: ${undocumented.join(", ")}`)
    : pass("new-projects-documented", manifests.length ? `${manifests.length} new project(s) documented` : "no new projects");
}

// AC5 no-placeholders
{
  const hits = [];
  for (const f of mbFiles) {
    read(f).split("\n").forEach((line, i) => {
      if (PLACEHOLDERS.some((re) => re.test(line))) hits.push(`${f}:${i + 1}`);
    });
  }
  hits.length ? fail("no-placeholders", hits.join(", ")) : pass("no-placeholders", "none found");
}

// AC6 links-resolve
{
  const broken = [];
  for (const f of mbFiles) {
    for (const m of read(f).matchAll(/\]\(([^)\s]+)\)/g)) {
      const target = m[1].split("#")[0];
      if (!target || /^[a-z]+:/i.test(target)) continue;
      if (!existsSync(resolve(MB, target))) broken.push(`${f} -> ${m[1]}`);
    }
  }
  broken.length ? fail("links-resolve", broken.join("; ")) : pass("links-resolve", "all relative links resolve");
}

// AC7 business facts changed -> needs confirmation
{
  const touched = BUSINESS_FILES.filter((p) => changed.has(p) && changed.get(p) !== "A");
  if (touched.length) warn("business-facts", `${touched.join(", ")} modified: cite the developer's confirmation in your report`);
}

// ---- report ---------------------------------------------------------------
console.log(`update-memory-bank verify  (base: ${base ?? "none"}, changed files: ${changed.size})`);
for (const r of results) console.log(`  ${r.level.padEnd(4)}  ${r.id.padEnd(24)} ${r.msg}`);
const failed = results.some((r) => r.level === "FAIL");
console.log(`RESULT: ${failed ? "FAIL" : "PASS"}`);
process.exit(failed ? 1 : 0);
