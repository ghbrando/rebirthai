/**
 * Account deletion (Issue #26, POLICY §7, RC-03).
 *
 * Order matters:
 * 1. Public-facing content goes first (unpublish, then public files), so a failure part-way
 *    never leaves the story or photo visible.
 * 2. Files, which the database cascade cannot reach.
 * 3. A re-check that the testimony was not published again meanwhile (e.g. from another tab).
 * 4. The sign-in account last. Its ON DELETE CASCADE removes profile, testimony, coach messages
 *    and media rows in one transaction, and the profiles BEFORE DELETE trigger retires the
 *    handles (migration 0002).
 * Until step 4 succeeds the profile still exists, so the author stays signed in with a working
 * Settings page and can retry. Every step is idempotent.
 */

/** The word the author types to confirm (checked again on the server). */
export const CONFIRM_WORD = "DELETE";

export const PRIVATE_BUCKET = "media-private";
export const PUBLIC_BUCKET = "media-public";

export type Bucket = typeof PRIVATE_BUCKET | typeof PUBLIC_BUCKET;

/** The caller's own rows, looked up through their session (RLS). Null when absent. */
export interface OwnRows {
  profileId: string | null;
  testimonyId: string | null;
}

export interface DeletionPorts {
  findOwnRows(userId: string): Promise<OwnRows>;
  /** Takes the testimony off the public page and drops the published copy. */
  unpublishTestimony(testimonyId: string): Promise<void>;
  /** True if the testimony is currently published. */
  isPublished(testimonyId: string): Promise<boolean>;
  /** Every file path under `prefix` (recursive). */
  listFiles(bucket: Bucket, prefix: string): Promise<string[]>;
  removeFiles(bucket: Bucket, paths: string[]): Promise<void>;
  /** Deletes the sign-in account; the database cascade removes all of the user's rows. */
  deleteAuthUser(userId: string): Promise<void>;
}

export type DeletionStep =
  | "find"
  | "unpublish"
  | "public-media"
  | "avatar"
  | "private-media"
  | "recheck"
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
 * Deletes everything that belongs to `userId`, ending with the sign-in account itself.
 * `userId` must come from the server-verified session (RC-01); callers never pass a user id
 * from the request body.
 */
export async function deleteAccount(
  userId: string | null | undefined,
  ports: DeletionPorts,
): Promise<{ steps: DeletionStep[] }> {
  if (!userId || !UUID.test(userId)) throw new NotSignedInError();

  const done: DeletionStep[] = [];
  const run = async (step: DeletionStep, fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (e) {
      throw e instanceof AccountDeletionError ? e : new AccountDeletionError(step, e);
    }
    done.push(step);
  };

  let rows: OwnRows = { profileId: null, testimonyId: null };
  await run("find", async () => {
    rows = await ports.findOwnRows(userId);
  });
  const { testimonyId } = rows;
  const prefixes = ownedPrefixes(userId, testimonyId);

  const clearFiles = async (bucket: Bucket, prefix: string) => {
    const paths = within(prefix, await ports.listFiles(bucket, prefix));
    if (paths.length) await ports.removeFiles(bucket, paths);
  };
  const clearPublicTestimony = async () => {
    if (prefixes.publicTestimony) await clearFiles(PUBLIC_BUCKET, prefixes.publicTestimony);
  };

  // 1. Public-facing first: the page goes dark before anything else is touched.
  if (testimonyId) await run("unpublish", () => ports.unpublishTestimony(testimonyId));
  if (testimonyId) await run("public-media", clearPublicTestimony);
  await run("avatar", () => clearFiles(PUBLIC_BUCKET, prefixes.avatar));

  // 2. Private files (the database cascade cannot reach storage).
  await run("private-media", () => clearFiles(PRIVATE_BUCKET, prefixes.private));

  // 3. Published again meanwhile (another tab)? Take it down again before the final step.
  if (testimonyId)
    await run("recheck", async () => {
      if (await ports.isPublished(testimonyId)) {
        await ports.unpublishTestimony(testimonyId);
        await clearPublicTestimony();
        if (await ports.isPublished(testimonyId)) throw new Error("testimony republished during deletion");
      }
    });

  // 4. The sign-in account; the cascade removes every row and retires the handles.
  await run("auth-user", () => ports.deleteAuthUser(userId));

  return { steps: done };
}
