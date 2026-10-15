import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { sanitizeSafeRedirectPath } from "@/lib/security";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");

  // Mitigate Open Redirect (CWE-601): strictly sanitize redirect path
  const safeNext = sanitizeSafeRedirectPath(rawNext, "/dashboard");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // In production and local, always use origin + safeNext to prevent host header poisoning
      const redirectUrl = new URL(safeNext, origin);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Return the user to login with an error message if code exchange fails
  const errorUrl = new URL("/login?error=email_verification_failed", origin);
  return NextResponse.redirect(errorUrl);
}
