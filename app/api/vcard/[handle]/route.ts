import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildVCard } from "@/lib/vcard/build";
import { HANDLE_REGEX } from "@/lib/types";

const notFound = () => new NextResponse("Not found", { status: 404 });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle: raw } = await params;
  const handle = decodeURIComponent(raw).replace(/^@/, "").replace(/\.vcf$/, "").toLowerCase();
  if (!HANDLE_REGEX.test(handle)) return notFound();

  try {
    const supabase = await createClient();

    // Anonymous-safe: the view only exposes contact fields when share_contact is on.
    const { data: pub } = await supabase
      .from("public_profiles")
      .select("handle, display_name, share_contact, contact_phone, contact_email")
      .eq("handle", handle)
      .maybeSingle();

    let card = pub
      ? {
          handle: pub.handle as string,
          displayName: pub.display_name as string,
          shareContact: !!pub.share_contact,
          phone: pub.contact_phone as string | null,
          email: pub.contact_email as string | null,
        }
      : null;

    if (!card) {
      // The author may fetch their own card (e.g. before publishing) with their session.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: own } = await supabase
          .from("profiles")
          .select("handle, display_name, share_contact, contact_phone, contact_email")
          .eq("user_id", user.id)
          .eq("handle", handle)
          .maybeSingle();
        if (own)
          card = {
            handle: own.handle,
            displayName: own.display_name,
            shareContact: own.share_contact,
            phone: own.contact_phone,
            email: own.contact_email,
          };
      }
    }

    if (!card) {
      // Old handle -> redirect to the current one (RC-03).
      const { data: moved } = await supabase
        .from("handle_lookup")
        .select("new_handle")
        .eq("old_handle", handle)
        .maybeSingle();
      if (moved?.new_handle) {
        return NextResponse.redirect(
          new URL(`/api/vcard/${moved.new_handle}`, request.url),
          308,
        );
      }
      return notFound();
    }

    const body = buildVCard(card);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        "Content-Disposition": `attachment; filename="${card.handle}.vcf"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch {
    return new NextResponse("Unavailable", { status: 503 });
  }
}
