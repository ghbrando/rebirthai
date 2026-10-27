// Deliberately broken: proves the CI check fails. Removed in the next commit.
import { expect, test } from "vitest";
const n: number = "not a number";
test("ci proof", () => { expect(n).toBe(1); });
