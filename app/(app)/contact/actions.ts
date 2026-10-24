"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";

export type ContactState = { ok: boolean; message: string };

/** Saves which contact fields go on the card (RC-12). Name is always included. */
export async function saveContactFields(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const { supabase, profile } = await requireProfile(); // session check (RC-01)
  const includePhone = formData.get("includePhone") === "on";
  const includeEmail = formData.get("includeEmail") === "on";
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 40);
  const email = String(formData.get("email") ?? "").trim().slice(0, 254);

  if (includeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, message: "Enter a valid email address." };
  if (includePhone && !/^[+()\-.\s\d]{5,40}$/.test(phone))
    return { ok: false, message: "Enter a valid phone number." };

  const { error } = await supabase
    .from("profiles")
    .update({
      contact_phone: includePhone ? phone : null,
      contact_email: includeEmail ? email : null,
      share_contact: includePhone || includeEmail,
    })
    .eq("id", profile.id);
  if (error) return { ok: false, message: "Could not save. Please try again." };

  revalidatePath("/contact");
  revalidatePath("/share");
  return { ok: true, message: "Saved." };
}
