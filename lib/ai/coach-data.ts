import type { SupabaseClient } from "@supabase/supabase-js";
import type { CoachMessage, CoachSection, TestimonyContent } from "@/lib/types";

export const RATE_LIMIT_PER_HOUR = 60;

type TestimonyRow = { id: string; title: string; draft_content: TestimonyContent };

/** Finds (or lazily creates) the caller's testimony via the RLS client. */
export async function getOrCreateTestimony(
  supabase: SupabaseClient,
  userId: string,
): Promise<TestimonyRow | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!profile) return null;
  const existing = await supabase
    .from("testimonies")
    .select("id, title, draft_content")
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (existing.data) return existing.data as TestimonyRow;
  const created = await supabase
    .from("testimonies")
    .insert({ profile_id: profile.id })
    .select("id, title, draft_content")
    .single();
  return (created.data as TestimonyRow | null) ?? null;
}

/** Loads a testimony by id; RLS guarantees only the owner can see it. */
export async function getTestimonyById(
  supabase: SupabaseClient,
  id: string,
): Promise<TestimonyRow | null> {
  const { data } = await supabase
    .from("testimonies")
    .select("id, title, draft_content")
    .eq("id", id)
    .maybeSingle();
  return (data as TestimonyRow | null) ?? null;
}

export async function loadHistory(supabase: SupabaseClient, testimonyId: string) {
  const { data } = await supabase
    .from("coach_messages")
    .select("*")
    .eq("testimony_id", testimonyId)
    .order("created_at", { ascending: true });
  return (data ?? []) as CoachMessage[];
}

export async function recentUserMessageCount(supabase: SupabaseClient, testimonyId: string) {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("coach_messages")
    .select("id", { count: "exact", head: true })
    .eq("testimony_id", testimonyId)
    .eq("role", "user")
    .gte("created_at", since);
  return count ?? 0;
}

/** Arc sections the author has answered (assistant question tagged X followed by a user reply). */
export function coveredSections(history: CoachMessage[]): CoachSection[] {
  const covered = new Set<CoachSection>();
  for (let i = 0; i < history.length - 1; i++) {
    const m = history[i];
    if (m.role === "assistant" && m.section && history[i + 1].role === "user") {
      covered.add(m.section);
    }
  }
  return (["before", "turning_point", "after"] as const).filter((s) => covered.has(s));
}

export function lastSection(history: CoachMessage[]): CoachSection | null {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === "assistant" && history[i].section) return history[i].section;
  }
  return null;
}

export function blockText(node: unknown): string {
  const n = node as { content?: { text?: string }[] };
  return (n.content ?? []).map((t) => t.text ?? "").join("");
}

export function transcript(history: CoachMessage[]): string {
  return history
    .map((m) => `${m.role === "user" ? "AUTHOR" : "COACH"}: ${m.content}`)
    .join("\n\n");
}
