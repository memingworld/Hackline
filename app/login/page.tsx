import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

import { sanitizeSafeRedirectPath } from "@/lib/security";

export const metadata: Metadata = {
  title: "Sign In — Hackline",
  description: "Access your hackathon squads, timeline monitors, and project vaults.",
};

export default async function LoginPage(props: {
  searchParams?: Promise<{ redirect?: string; next?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const rawTarget = searchParams.redirect || searchParams.next;
  const safeRedirect = sanitizeSafeRedirectPath(rawTarget, "/dashboard");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(safeRedirect);
  }

  return (
    <AuthLayout
      heading="Welcome back"
      subheading="Sign in with your verified credentials or team OAuth provider."
      alternateLink={{
        prompt: "Don't have a team account yet?",
        label: "Create one now",
        href: safeRedirect !== "/dashboard" ? `/signup?redirect=${encodeURIComponent(safeRedirect)}` : "/signup",
      }}
    >
      <LoginForm redirectPath={safeRedirect} />
    </AuthLayout>
  );
}
