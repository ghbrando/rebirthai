import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Verifies the session server-side (RC-01). Redirects to sign-in when signed out. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  return { supabase, user };
}

/** requireUser + the caller's profile; redirects to onboarding if none yet. */
export async function requireProfile() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) redirect("/onboarding");
  return { supabase, user, profile: data as Profile };
}

/** For route handlers: returns null instead of redirecting. */
export async function getUserOrNull() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}
