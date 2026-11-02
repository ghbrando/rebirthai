import { describe, expect, test } from "vitest";
import {
  AccountDeletionError,
  deleteAccount,
  NotSignedInError,
  PRIVATE_BUCKET,
  PUBLIC_BUCKET,
  type Bucket,
  type DeletionPorts,
} from "./delete";

const ME = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const MY_PROFILE = "33333333-3333-4333-8333-333333333333";
const MY_TESTIMONY = "44444444-4444-4444-8444-444444444444";
const OTHER_TESTIMONY = "55555555-5555-4555-8555-555555555555";

/** In-memory stand-in for Supabase: two users' rows and files. */
function fakeWorld() {
  const files: Record<Bucket, Set<string>> = {
    [PRIVATE_BUCKET]: new Set([
      `${ME}/${MY_TESTIMONY}/a.jpg`,
      `${ME}/${MY_TESTIMONY}/b.mp4`,
      `${OTHER}/${OTHER_TESTIMONY}/x.jpg`,
    ]),
    [PUBLIC_BUCKET]: new Set([
      `${MY_TESTIMONY}/m1.jpg`,
      `avatars/${ME}/me.png`,
      `${OTHER_TESTIMONY}/m9.jpg`,
      `avatars/${OTHER}/them.png`,
    ]),
  };
  const db = {
    profiles: new Map([
      [ME, MY_PROFILE],
      [OTHER, "other-profile"],
    ]),
    testimonies: new Map([
      [MY_PROFILE, { id: MY_TESTIMONY, published: true }],
      ["other-profile", { id: OTHER_TESTIMONY, published: true }],
    ]),
    coachMessages: new Set([MY_TESTIMONY, OTHER_TESTIMONY]),
    mediaRows: new Set([MY_TESTIMONY, OTHER_TESTIMONY]),
    authUsers: new Set([ME, OTHER]),
  };
  const calls: string[] = [];
  let failAt: string | null = null;

  const guard = (name: string) => {
    calls.push(name);
    if (failAt === name) {
      failAt = null; // fail once, then succeed on retry
      throw new Error(`boom at ${name}`);
    }
  };

  const ports: DeletionPorts = {
    async findOwnRows(userId) {
      guard("findOwnRows");
      const profileId = db.profiles.get(userId) ?? null;
      const t = profileId ? db.testimonies.get(profileId) : undefined;
      return { profileId, testimonyId: t?.id ?? null };
    },
    async unpublishTestimony(id) {
      guard("unpublishTestimony");
      for (const t of db.testimonies.values()) if (t.id === id) t.published = false;
    },
    async listFiles(bucket, prefix) {
      guard(`listFiles:${bucket}:${prefix}`);
      return [...files[bucket]].filter((p) => p.startsWith(`${prefix}/`));
    },
    async removeFiles(bucket, paths) {
      guard(`removeFiles:${bucket}`);
      for (const p of paths) files[bucket].delete(p);
    },
    async deleteCoachMessages(id) {
      guard("deleteCoachMessages");
      db.coachMessages.delete(id);
    },
    async deleteMediaRows(id) {
      guard("deleteMediaRows");
      db.mediaRows.delete(id);
    },
    async deleteTestimony(id) {
      guard("deleteTestimony");
      for (const [k, t] of db.testimonies) if (t.id === id) db.testimonies.delete(k);
    },
    async deleteProfile(id) {
      guard("deleteProfile");
      for (const [k, v] of db.profiles) if (v === id) db.profiles.delete(k);
    },
    async deleteAuthUser(id) {
      guard("deleteAuthUser");
      db.authUsers.delete(id);
    },
  };
  return { files, db, calls, ports, failOnce: (name: string) => (failAt = name) };
}

describe("deleteAccount", () => {
  test("refuses when there is no signed-in user", async () => {
    const w = fakeWorld();
    await expect(deleteAccount(null, w.ports)).rejects.toBeInstanceOf(NotSignedInError);
    await expect(deleteAccount(undefined, w.ports)).rejects.toBeInstanceOf(NotSignedInError);
    await expect(deleteAccount("", w.ports)).rejects.toBeInstanceOf(NotSignedInError);
    await expect(deleteAccount("../avatars", w.ports)).rejects.toBeInstanceOf(NotSignedInError);
    expect(w.calls).toEqual([]);
  });

  test("removes public content first and the sign-in account last", async () => {
    const w = fakeWorld();
    await deleteAccount(ME, w.ports);
    const order = w.calls.filter((c) => !c.startsWith("listFiles"));
    expect(order).toEqual([
      "findOwnRows",
      "unpublishTestimony",
      `removeFiles:${PUBLIC_BUCKET}`, // published testimony media
      `removeFiles:${PUBLIC_BUCKET}`, // profile photo
      `removeFiles:${PRIVATE_BUCKET}`,
      "deleteCoachMessages",
      "deleteMediaRows",
      "deleteTestimony",
      "deleteProfile",
      "deleteAuthUser",
    ]);
  });

  test("deletes all of the caller's data and nothing of anyone else's", async () => {
    const w = fakeWorld();
    await deleteAccount(ME, w.ports);
    expect([...w.files[PRIVATE_BUCKET]]).toEqual([`${OTHER}/${OTHER_TESTIMONY}/x.jpg`]);
    expect([...w.files[PUBLIC_BUCKET]].sort()).toEqual(
      [`${OTHER_TESTIMONY}/m9.jpg`, `avatars/${OTHER}/them.png`].sort(),
    );
    expect([...w.db.profiles.keys()]).toEqual([OTHER]);
    expect([...w.db.coachMessages]).toEqual([OTHER_TESTIMONY]);
    expect([...w.db.mediaRows]).toEqual([OTHER_TESTIMONY]);
    expect([...w.db.authUsers]).toEqual([OTHER]);
    expect(w.db.testimonies.get("other-profile")?.published).toBe(true);
  });

  test("only lists storage under the caller's own folders", async () => {
    const w = fakeWorld();
    await deleteAccount(ME, w.ports);
    const listed = w.calls.filter((c) => c.startsWith("listFiles")).sort();
    expect(listed).toEqual(
      [
        `listFiles:${PUBLIC_BUCKET}:${MY_TESTIMONY}`,
        `listFiles:${PUBLIC_BUCKET}:avatars/${ME}`,
        `listFiles:${PRIVATE_BUCKET}:${ME}`,
      ].sort(),
    );
  });

  test("never removes a listed path outside the caller's folder", async () => {
    const w = fakeWorld();
    const ports: DeletionPorts = {
      ...w.ports,
      // a misbehaving listing that leaks someone else's file
      listFiles: async (bucket, prefix) => [...(await w.ports.listFiles(bucket, prefix)), `${OTHER}/${OTHER_TESTIMONY}/x.jpg`],
    };
    await deleteAccount(ME, ports);
    expect(w.files[PRIVATE_BUCKET].has(`${OTHER}/${OTHER_TESTIMONY}/x.jpg`)).toBe(true);
  });

  test("hides the public page before a failure later on", async () => {
    const w = fakeWorld();
    w.failOnce("deleteCoachMessages");
    const err = await deleteAccount(ME, w.ports).catch((e) => e);
    expect(err).toBeInstanceOf(AccountDeletionError);
    expect((err as AccountDeletionError).step).toBe("coach-messages");
    expect(w.db.testimonies.get(MY_PROFILE)?.published).toBe(false);
    expect([...w.files[PUBLIC_BUCKET]].some((p) => p.includes(MY_TESTIMONY) || p.includes(ME))).toBe(false);
    expect(w.db.authUsers.has(ME)).toBe(true); // still signed in, so the author can retry
  });

  test.each([
    "findOwnRows",
    "unpublishTestimony",
    `removeFiles:${PUBLIC_BUCKET}`,
    `removeFiles:${PRIVATE_BUCKET}`,
    "deleteMediaRows",
    "deleteTestimony",
    "deleteProfile",
    "deleteAuthUser",
  ])("a retry after a failure at %s finishes the job", async (step) => {
    const w = fakeWorld();
    w.failOnce(step);
    await expect(deleteAccount(ME, w.ports)).rejects.toBeInstanceOf(AccountDeletionError);
    await deleteAccount(ME, w.ports);
    expect(w.db.profiles.has(ME)).toBe(false);
    expect(w.db.authUsers.has(ME)).toBe(false);
    expect([...w.files[PRIVATE_BUCKET]].some((p) => p.startsWith(`${ME}/`))).toBe(false);
    expect([...w.files[PUBLIC_BUCKET]].some((p) => p.includes(MY_TESTIMONY) || p.includes(ME))).toBe(false);
    expect(w.db.authUsers.has(OTHER)).toBe(true);
  });

  test("works for an account that never finished setting up a profile", async () => {
    const w = fakeWorld();
    w.db.profiles.delete(ME);
    const { steps } = await deleteAccount(ME, w.ports);
    expect(steps).toEqual(["find", "avatar", "private-media", "auth-user"]);
    expect(w.db.authUsers.has(ME)).toBe(false);
  });
});
