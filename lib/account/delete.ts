/**
 * Account deletion (Issue #26, POLICY §7, RC-03).
 *
 * Order matters: public-facing content goes first, so a failure part-way never leaves the
 * story or photos visible. Every step is idempotent, so the whole run can simply be retried
 * after a failure (steps already done find nothing left to delete).
 */

/** The word the author types to confirm (checked again on the server). */
export const CONFIRM_WORD = "DELETE";

export const PRIVATE_BUCKET = "media-private";
export const PUBLIC_BUCKET = "media-public";

export type Bucket = typeof PRIVATE_BUCKET | typeof PUBLIC_BUCKET;

/** The caller's own rows, looked up through their session (RLS). Null when already gone. */
export interface OwnRows {
  profileId: string | null;
  testimonyId: string | null;
}

export interface DeletionPorts {
  findOwnRows(userId: string): Promise<OwnRows>;
  /** Takes the testimony off the public page and drops the published copy. */
  unpublishTestimony(testimonyId: string): Promise<void>;
  /** Every file path under `prefix` (recursive). */
  listFiles(bucket: Bucket, prefix: string): Promise<string[]>;
  removeFiles(bucket: Bucket, paths: string[]): Promise<void>;
  deleteCoachMessages(testimonyId: string): Promise<void>;
  deleteMediaRows(testimonyId: string): Promise<void>;
  deleteTestimony(testimonyId: string): Promise<void>;
  /** Deleting the profile retires its handle(s) in the database (migration 0002). */
  deleteProfile(profileId: string): Promise<void>;
  deleteAuthUser(userId: string): Promise<void>;
}

export type DeletionStep =
  | "find"
  | "unpublish"
  | "public-media"
  | "avatar"
  | "private-media"
  | "coach-messages"
  | "media-rows"
  | "testimony"
  | "profile"
  | "auth-user";

export class AccountDeletionError extends Error {
  constructor(
    readonly step: DeletionStep,
    readonly cause?: unknown,
  ) {
    super(`Account deletion stopped at step "${step}"`);
    this.name = "AccountDeletionError";
  }
}

export class NotSignedInError extends Error {
  constructor() {
    super("Not signed in");
    this.name = "NotSignedInError";
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Storage prefixes owned by this user (see storage policies in 0001_init.sql). */
export function ownedPrefixes(userId: string, testimonyId: string | null) {
  return {
    publicTestimony: testimonyId ? `${testimonyId}` : null, // media-public/{testimony_id}/...
    avatar: `avatars/${userId}`, // media-public/avatars/{user_id}/...
    private: `${userId}`, // media-private/{user_id}/{testimony_id}/...
  };
}

/** Removes only paths that sit inside `prefix/` — a guard against listing surprises. */
function within(prefix: string, paths: string[]) {
  return paths.filter((p) => p.startsWith(`${prefix}/`));
}

/**
 * Deletes everything that belongs to `userId`, then the sign-in account itself.
 * `userId` must come from the server-verified session (RC-01); callers never pass a user id
 * from the request body.
 */
export async function deleteAccount(
  userId: string | null | undefined,
  ports: DeletionPorts,
): Promise<{ steps: DeletionStep[] }> {
  if (!userId) throw new NotSignedInError();
  if (!UUID.test(userId)) throw new NotSignedInError();

  const done: DeletionStep[] = [];
  const run = async (step: DeletionStep, fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (e) {
      throw new AccountDeletionError(step, e);
    }
    done.push(step);
  };

  let rows: OwnRows = { profileId: null, testimonyId: null };
  await run("find", async () => {
    rows = await ports.findOwnRows(userId);
  });
  const { profileId, testimonyId } = rows;
  const prefixes = ownedPrefixes(userId, testimonyId);

  const clearFiles = async (bucket: Bucket, prefix: string) => {
    const paths = within(prefix, await ports.listFiles(bucket, prefix));
    if (paths.length) await ports.removeFiles(bucket, paths);
  };

  // 1. Public-facing first: the page goes dark before anything else is touched.
  if (testimonyId) await run("unpublish", () => ports.unpublishTestimony(testimonyId));
  if (prefixes.publicTestimony) {
    const prefix = prefixes.publicTestimony;
    await run("public-media", () => clearFiles(PUBLIC_BUCKET, prefix));
  }
  await run("avatar", () => clearFiles(PUBLIC_BUCKET, prefixes.avatar));

  // 2. Private files and rows.
  await run("private-media", () => clearFiles(PRIVATE_BUCKET, prefixes.private));
  if (testimonyId) {
    await run("coach-messages", () => ports.deleteCoachMessages(testimonyId));
    await run("media-rows", () => ports.deleteMediaRows(testimonyId));
    await run("testimony", () => ports.deleteTestimony(testimonyId));
  }
  if (profileId) await run("profile", () => ports.deleteProfile(profileId));

  // 3. The sign-in account last, so a failure above can be retried while still signed in.
  await run("auth-user", () => ports.deleteAuthUser(userId));

  return { steps: done };
}
