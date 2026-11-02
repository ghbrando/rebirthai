import type { SupabaseClient } from "@supabase/supabase-js";
import type { Bucket, DeletionPorts } from "./delete";

const PAGE = 1000;

/**
 * Supabase-backed deletion ports.
 * - `session`: the caller's RLS client. Table rows are read and unpublished through it, so
 *   Postgres itself guarantees only the caller's rows are touched (RC-02). Rows are deleted by
 *   the ON DELETE CASCADE from auth.users when the sign-in account is deleted.
 * - `admin`: the service-role client (RC-07, server-only). Used only for storage (published
 *   testimony files are not writable by authors) and `auth.admin.deleteUser`.
 */
export function supabaseDeletionPorts(session: SupabaseClient, admin: SupabaseClient): DeletionPorts {
  const check = (error: { message: string } | null) => {
    if (error) throw new Error(error.message);
  };

  const listFiles = async (bucket: Bucket, prefix: string): Promise<string[]> => {
    const files: string[] = [];
    for (let offset = 0; ; offset += PAGE) {
      const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: PAGE, offset });
      check(error);
      const entries = data ?? [];
      for (const e of entries) {
        const path = `${prefix}/${e.name}`;
        // Folders come back without an id; descend into them.
        if (e.id === null) files.push(...(await listFiles(bucket, path)));
        else files.push(path);
      }
      if (entries.length < PAGE) break;
    }
    return files;
  };

  return {
    async findOwnRows(userId) {
      const { data: profile, error } = await session
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      check(error);
      if (!profile) return { profileId: null, testimonyId: null };
      const { data: t, error: tErr } = await session
        .from("testimonies")
        .select("id")
        .eq("profile_id", profile.id)
        .maybeSingle();
      check(tErr);
      return { profileId: profile.id as string, testimonyId: (t?.id as string | undefined) ?? null };
    },
    async unpublishTestimony(testimonyId) {
      const { error } = await session
        .from("testimonies")
        .update({ status: "unpublished", published_content: null, published_title: null, published_at: null })
        .eq("id", testimonyId);
      check(error);
    },
    async isPublished(testimonyId) {
      const { data, error } = await session.from("testimonies").select("status").eq("id", testimonyId).maybeSingle();
      check(error);
      return data?.status === "published";
    },
    listFiles,
    async removeFiles(bucket, paths) {
      for (let i = 0; i < paths.length; i += PAGE) {
        const { error } = await admin.storage.from(bucket).remove(paths.slice(i, i + PAGE));
        check(error);
      }
    },
    async deleteAuthUser(userId) {
      const { error } = await admin.auth.admin.deleteUser(userId);
      // Already gone (a retry after a lost response) counts as done.
      if (error && (error as { status?: number }).status !== 404) throw new Error(error.message);
    },
  };
}
