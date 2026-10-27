#!/usr/bin/env node
// PreToolUse guard for Bash/PowerShell. Exit 2 blocks the command; stderr is the reason shown to Claude.
// Enforces the trust boundary even for sessions with admin rights (rulesets can be bypassed by admins):
//   - no push to protected branches, no force push (--force-with-lease is allowed)
//   - no approving or merging PRs into protected branches
//   - no reading secret env files from the shell (.env.example is fine)
// Protected branches: PROTECTED below, or env CLAUDE_GUARD_PROTECTED="main,staging".
import { execFileSync } from "node:child_process";

const PROTECTED = (process.env.CLAUDE_GUARD_PROTECTED || "main,staging").split(",").map((s) => s.trim());

let input = "";
for await (const chunk of process.stdin) input += chunk;
const { tool_input = {}, cwd } = JSON.parse(input || "{}");
const cmd = String(tool_input.command || "");

const block = (why) => {
  process.stderr.write(`Blocked by .claude/hooks/guard.mjs: ${why}\n`);
  process.exit(2);
};
const run = (file, args) => {
  try {
    return execFileSync(file, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
};
const isProtected = (ref) => PROTECTED.includes(String(ref).replace(/^refs\/heads\//, ""));

// Look at each command in a chain (&&, ||, ;, |, newlines).
for (const part of cmd.split(/&&|\|\||;|\||\n/).map((s) => s.trim()).filter(Boolean)) {
  const words = part.split(/\s+/);

  // git push
  const gi = words.indexOf("git");
  if (gi !== -1 && words[gi + 1] === "push") {
    const args = words.slice(gi + 2);
    if (args.some((a) => a === "--force" || a === "-f" || /^-[a-zA-Z]*f[a-zA-Z]*$/.test(a) || a.startsWith("+")))
      block("force push is not allowed (use --force-with-lease on your own feature branch).");
    if (args.includes("--mirror") || args.includes("--all")) block("pushing all branches is not allowed.");
    const refs = args.filter((a) => !a.startsWith("-")).slice(1); // skip the remote
    const targets = refs.map((r) => (r.includes(":") ? r.split(":").pop() : r));
    if (targets.length === 0) targets.push(run("git", ["rev-parse", "--abbrev-ref", "HEAD"]));
    const hit = targets.find(isProtected);
    if (hit) block(`pushing to protected branch '${hit}'. Open a PR into dev; promotions are the owner's.`);
  }

  // gh pr merge / gh pr review --approve
  const hi = words.indexOf("gh");
  if (hi !== -1 && words[hi + 1] === "pr" && ["merge", "review"].includes(words[hi + 2])) {
    const sub = words[hi + 2];
    if (sub === "review" && !words.includes("--approve") && !words.includes("-a")) continue;
    const target = words.slice(hi + 3).find((a) => !a.startsWith("-")) || "";
    const base = run("gh", ["pr", "view", ...(target ? [target] : []), "--json", "baseRefName", "-q", ".baseRefName"]);
    if (!base) block(`could not confirm the PR's base branch before 'gh pr ${sub}'; check it and retry with the PR number.`);
    if (isProtected(base)) block(`'gh pr ${sub}' into protected branch '${base}' is the owner's decision.`);
  }

  // reading secret env files from the shell
  if (/(^|[\s"'\/\\=])\.env(\.(?!example\b|sample\b|template\b)[\w.-]+)?(?=$|[\s"'])/.test(part) &&
      /\b(cat|less|more|head|tail|type|get-content|gc|grep|rg|sed|awk|source|\.|cp|scp|curl)\b/i.test(part))
    block("reading .env secret files is not allowed (.env.example is fine).");
}
process.exit(0);
