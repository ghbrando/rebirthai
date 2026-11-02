#!/usr/bin/env node
// PreToolUse guard for Bash/PowerShell. Exit 2 blocks the command; stderr is the reason shown to Claude.
// Defense in depth for the trust boundary (GitHub rulesets are the real control; admins can bypass them):
//   - no push to protected branches, no force push (--force-with-lease is allowed)
//   - no approving or merging PRs into protected branches, including through `gh api`
//   - no reading secret env files from the shell (.env.example is fine)
// Protected branches: PROTECTED below, or env CLAUDE_GUARD_PROTECTED="main,staging". Best effort:
// it inspects command text, so deliberate obfuscation can still get past it.
import { execFileSync } from "node:child_process";

const PROTECTED = (process.env.CLAUDE_GUARD_PROTECTED || "main,staging").split(",").map((s) => s.trim().toLowerCase());

let input = "";
for await (const chunk of process.stdin) input += chunk;
let parsed = {};
try {
  parsed = JSON.parse(input || "{}");
} catch {
  process.stderr.write("Blocked by .claude/hooks/guard.mjs: could not read the command to check it.\n");
  process.exit(2);
}
const { tool_input = {}, cwd } = parsed;
const cmd = String(tool_input.command || "");

const block = (why) => {
  process.stderr.write(`Blocked by .claude/hooks/guard.mjs: ${why}\n`);
  process.exit(2);
};
const run = (file, args, dir = cwd) => {
  try {
    return execFileSync(file, args, { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
};
const isProtected = (ref) => PROTECTED.includes(String(ref).replace(/^refs\/heads\//i, "").toLowerCase());

// git global options that take a separate value (`git -C dir push`, `git -c k=v push`).
const GIT_OPTS_WITH_VALUE = new Set(["-C", "-c", "--git-dir", "--work-tree", "--namespace", "--exec-path", "--config-env"]);

// Look at each command in a chain (&&, ||, ;, |, newlines). Quotes are stripped so wrapped
// commands (`bash -c 'git push origin main'`) are inspected too.
for (const part of cmd.split(/&&|\|\||;|\||\n/).map((s) => s.trim()).filter(Boolean)) {
  const words = part.replace(/["'`]/g, " ").split(/\s+/).filter(Boolean);

  // git [global options] push
  for (let gi = words.indexOf("git"); gi !== -1; gi = words.indexOf("git", gi + 1)) {
    let i = gi + 1;
    let dir = cwd;
    while (i < words.length && words[i].startsWith("-")) {
      if (GIT_OPTS_WITH_VALUE.has(words[i])) {
        if (words[i] === "-C") dir = words[i + 1];
        i += 2;
      } else i += 1;
    }
    if (words[i] !== "push") continue;
    const args = words.slice(i + 1);
    if (args.some((a) => a === "--force" || a === "-f" || /^-[a-zA-Z]*f[a-zA-Z]*$/.test(a) || a.startsWith("+")))
      block("force push is not allowed (use --force-with-lease on your own feature branch).");
    if (args.includes("--mirror") || args.includes("--all")) block("pushing all branches is not allowed.");
    const current = () => run("git", ["rev-parse", "--abbrev-ref", "HEAD"], dir);
    const refs = args.filter((a) => !a.startsWith("-")).slice(1); // skip the remote
    const targets = refs
      .map((r) => (r.includes(":") ? r.split(":").pop() : r))
      .map((t) => (t === "HEAD" || t === "@" ? current() : t));
    if (targets.length === 0) targets.push(current());
    const hit = targets.find(isProtected);
    if (hit) block(`pushing to protected branch '${hit}'. Open a PR into dev; promotions are the owner's.`);
  }

  const hi = words.indexOf("gh");

  // gh pr merge / gh pr review --approve
  if (hi !== -1 && words[hi + 1] === "pr" && ["merge", "review"].includes(words[hi + 2])) {
    const sub = words[hi + 2];
    if (sub === "review" && !words.includes("--approve") && !words.includes("-a")) continue;
    const target = words.slice(hi + 3).find((a) => !a.startsWith("-")) || "";
    const base = run("gh", ["pr", "view", ...(target ? [target] : []), "--json", "baseRefName", "-q", ".baseRefName"]);
    if (!base) block(`could not confirm the PR's base branch before 'gh pr ${sub}'; check it and retry with the PR number.`);
    if (isProtected(base)) block(`'gh pr ${sub}' into protected branch '${base}' is the owner's decision.`);
  }

  // gh api writes that merge, approve or move refs (the API route around `gh pr merge`)
  if (hi !== -1 && words[hi + 1] === "api") {
    const mi = words.findIndex((w) => w === "-X" || w === "--method");
    const method = mi !== -1 ? (words[mi + 1] || "").toUpperCase() : "";
    const hasFields = words.some((w) => ["-f", "-F", "--field", "--raw-field", "--input"].includes(w));
    const write = (method && method !== "GET") || hasFields || words.includes("graphql");
    if (write && /\/merges?\b|\/git\/refs|\/reviews|mergePullRequest|updateRef|createRef|deleteRef|addPullRequestReview/i.test(part))
      block("merging, approving or moving branches through 'gh api' is not allowed; use a PR into dev.");
  }

  // reading secret env files from the shell
  if (/(^|[\s"'\/\\=<])\.env(\.(?!example\b|sample\b|template\b)[\w.-]+)?(?=$|[\s"'])/.test(part) &&
      /\b(cat|less|more|head|tail|type|get-content|gc|grep|rg|sed|awk|source|\.|cp|scp|curl|node|python3?|py|ruby|perl|base64|xxd|od|strings|nl|findstr|select-string|sls|readalltext)\b/i.test(part))
    block("reading .env secret files is not allowed (.env.example is fine).");
}
process.exit(0);
