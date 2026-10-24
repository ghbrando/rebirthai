"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { HANDLE_REGEX } from "@/lib/types";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; saved?: boolean };

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

/** Live uniqueness check. Own handle (and own old handles) count as available. */
export async function checkHandle(handle: string): Promise<{ available: boolean; reason?: string }> {
  const { supabase, user } = await requireUser();
  if (!HANDLE_REGEX.test(handle)) {
    return { available: false, reason: "Use 3-30 characters: lowercase letters, numbers, underscore." };
  }
  const { data: mine } = await supabase.from("profiles").select("id,handle").eq("user_id", user.id).maybeSingle();
  if (mine?.handle === handle) return { available: true };
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { available: true }; // DB enforces on save
  const admin = createServiceClient();
  const [{ data: taken }, { data: redirected }] = await Promise.all([
    admin.from("profiles").select("id").eq("handle", handle).maybeSingle(),
    admin.from("handle_redirects").select("profile_id").eq("old_handle", handle).maybeSingle(),
  ]);
  if (taken) return { available: false, reason: "That handle is already in use." };
  if (redirected && redirected.profile_id !== mine?.id) {
    return { available: false, reason: "That handle is already in use." };
  }
  return { available: true };
}

function str(fd: FormData, k: string) {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
}

/** Creates (onboarding) or updates (settings) the caller's profile. */
export async function saveProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const mode = str(fd, "mode") === "update" ? "update" : "create";

  const handle = str(fd, "handle").toLowerCase();
  const display_name = str(fd, "display_name");
  const fieldErrors: Record<string, string> = {};
  if (!display_name) fieldErrors.display_name = "Please enter your name.";
  if (display_name.length > 100) fieldErrors.display_name = "Name is too long.";
  if (!HANDLE_REGEX.test(handle)) fieldErrors.handle = "Use 3-30 characters: lowercase letters, numbers, underscore.";
  const bio = str(fd, "bio").slice(0, 500) || null;
  const church = str(fd, "church").slice(0, 120) || null;
  const photo = str(fd, "photo_path");
  if (photo && !photo.startsWith(`avatars/${user.id}/`)) fieldErrors.photo = "Invalid photo.";
  const email = str(fd, "contact_email");
  const phone = str(fd, "contact_phone");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.contact_email = "Enter a valid email.";
  if (phone && !/^[0-9+()\-.\s]{5,30}$/.test(phone)) fieldErrors.contact_phone = "Enter a valid phone number.";
  // RC-12: nothing shared unless entered AND toggled on.
  const share_contact = fd.get("share_contact") === "on" && !!(email || phone);
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const row = {
    handle,
    display_name,
    bio,
    church,
    photo_path: photo || null,
    ...(mode === "update"
      ? { contact_email: email || null, contact_phone: phone || null, share_contact }
      : {}),
  };

  const res =
    mode === "create"
      ? await supabase.from("profiles").insert({ ...row, user_id: user.id })
      : await supabase.from("profiles").update(row).eq("user_id", user.id);

  if (res.error) {
    const msg = res.error.message ?? "";
    if (msg.includes("handle_unavailable") || res.error.code === "23505") {
      return { fieldErrors: { handle: "That handle is already in use." } };
    }
    return { error: "Could not save your profile. Please try again." };
  }
  if (mode === "create") redirect("/dashboard");
  return { saved: true };
}
