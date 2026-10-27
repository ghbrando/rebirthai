// Regression cases for guard.mjs. Run from the repo root: node .claude/hooks/guard.check.mjs
import { spawnSync } from "node:child_process";
const cases = [
  // [command, expectBlocked]
  ["git push origin main", true],
  ["git push origin staging", true],
  ["git -C . push origin main", true],
  ["git -c core.x=1 push origin main", true],
  ["git --no-pager push origin main", true],
  ["bash -c 'git push origin main'", true],
  ["git push origin HEAD:Main", true],
  ["git push origin HEAD:refs/heads/staging", true],
  ["git push --force origin feature/x", true],
  ["git push -fu origin feature/x", true],
  ["git push origin :main", true],
  ["gh api -X PUT repos/o/r/pulls/1/merge", true],
  ["gh api graphql -f query='mutation{mergePullRequest(input:{}){clientMutationId}}'", true],
  ["gh api -X PATCH repos/o/r/git/refs/heads/main -f sha=abc", true],
  ["cat .env", true],
  ["node -e \"require('fs').readFileSync('.env.local')\"", true],
  ["python -c \"open('.env').read()\"", true],
  ["git push origin feature/x", false],
  ["git push -u origin feature/x", false],
  ["git push --force-with-lease origin feature/x", false],
  ["git push origin HEAD:dev", false],
  ["git -C . status", false],
  ["git commit -m 'push to main later'", false],
  ["gh pr create --base dev", false],
  ["gh api repos/o/r/pulls/1/reviews", false],
  ["gh api repos/o/r/pulls/1/merge", false],
  ["cat .env.example", false],
  ["ls", false],
];
let bad = 0;
for (const [c, expect] of cases) {
  const r = spawnSync("node", [".claude/hooks/guard.mjs"], { input: JSON.stringify({ tool_input: { command: c }, cwd: "." }), encoding: "utf8" });
  const blocked = r.status === 2;
  if (blocked !== expect) { bad++; console.log(`WRONG expect=${expect ? "block" : "allow"} got=${blocked ? "block" : "allow"} :: ${c}`); }
}
const bogus = spawnSync("node", [".claude/hooks/guard.mjs"], { input: "not json", encoding: "utf8" });
if (bogus.status !== 2) { bad++; console.log("WRONG: invalid input not blocked"); }
console.log(bad ? `${bad} wrong` : `all ${cases.length + 1} cases correct`);
