import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/** Demo-only sign-in (hackathon). Disabled unless DEMO_MODE=1; signs in as DEMO_EMAIL with no email step. */
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  const email = process.env.DEMO_EMAIL;
  if (process.env.DEMO_MODE !== "1" || !email) return new NextResponse("Not found", { status: 404 });

  const { data, error } = await createServiceClient().auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties?.hashed_token) return NextResponse.redirect(`${origin}/sign-in?error=auth_failed`);

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: data.properties.hashed_token,
    type: "magiclink",
  });
  if (verifyError) return NextResponse.redirect(`${origin}/sign-in?error=auth_failed`);
  return NextResponse.redirect(`${origin}/dashboard`);
}
