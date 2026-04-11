#!/usr/bin/env node
/**
 * ESLint only files changed vs a base ref (CI / local).
 * @example BASE_REF=origin/main node scripts/lint-changed.mjs
 */
import { execSync, spawnSync } from "node:child_process";
import process from "node:process";

const EXT = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

function resolveBaseRef() {
  const env = process.env.BASE_REF?.trim();
  if (env) return env;
  const candidates = ["origin/main", "main", "origin/master", "master"];
  for (const ref of candidates) {
    try {
      execSync(`git rev-parse --verify ${ref}`, { stdio: "pipe" });
      return ref;
    } catch {
      /* try next */
    }
  }
  return null;
}

function getChangedFiles() {
  const base = resolveBaseRef();
  let names = "";
  try {
    if (base) {
      names = execSync(`git diff --name-only --diff-filter=ACMRT ${base}...HEAD`, {
        encoding: "utf8",
      });
    } else {
      names = execSync("git diff --name-only --diff-filter=ACMRT HEAD~1", {
        encoding: "utf8",
      });
    }
  } catch {
    console.error(
      "lint-changed: git diff failed (need commits or fetch origin/main)."
    );
    process.exit(1);
  }
  return names
    .split("\n")
    .map((s) => s.trim())
    .filter((f) => f && EXT.test(f));
}

const files = getChangedFiles();
if (files.length === 0) {
  console.log("lint-changed: no matching TS/JS files in diff — skip.");
  process.exit(0);
}

console.log(`lint-changed: running eslint on ${files.length} file(s)`);
const result = spawnSync("npx", ["eslint", ...files], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});
process.exit(result.status === null ? 1 : result.status);
