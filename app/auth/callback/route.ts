import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { sanitizeSafeRedirectPath } from "@/lib/security";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");

  const requestUrl = new URL(request.url);
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  let effectiveOrigin = origin;

  if (configuredSiteUrl) {
    try {
      effectiveOrigin = new URL(configuredSiteUrl).origin;
    } catch {
      effectiveOrigin = origin;
    }
  } else {
    const hostHeader = request.headers.get("host") || "";
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") || "https";

    if (forwardedHost && hostHeader && forwardedHost.toLowerCase() === hostHeader.toLowerCase()) {
      effectiveOrigin = `${forwardedProto}://${forwardedHost}`;
    } else {
      effectiveOrigin = requestUrl.origin;
    }
  }

  // Mitigate Open Redirect (CWE-601): strictly sanitize redirect path
  const safeNext = sanitizeSafeRedirectPath(rawNext, "/dashboard");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const redirectUrl = new URL(safeNext, effectiveOrigin);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Return the user to login with an error message if code exchange fails
  const errorUrl = new URL("/login?error=email_verification_failed", effectiveOrigin);
  return NextResponse.redirect(errorUrl);
}
