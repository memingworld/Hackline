"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignupForm } from "@/components/auth/SignupForm";
import { CheckEmailCard } from "@/components/auth/CheckEmailCard";

export default function SignupPage() {
  const router = useRouter();
  const [verificationEmail, setVerificationEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/dashboard");
      }
    });
  }, [router]);

  return (
    <AuthLayout
      heading={verificationEmail ? "Check your inbox" : "Initialize your squad"}
      subheading={
        verificationEmail
          ? "We sent a secure one-click link to finalize your Hackline account."
          : "Join hundreds of developers dominating hackathons with automated command centers."
      }
      alternateLink={{
        prompt: "Already deployed an account?",
        label: "Sign in",
        href: "/login",
      }}
    >
      {verificationEmail ? (
        <CheckEmailCard
          email={verificationEmail}
          onReset={() => setVerificationEmail(null)}
        />
      ) : (
        <SignupForm
          onVerificationRequired={(email) => setVerificationEmail(email)}
        />
      )}
    </AuthLayout>
  );
}
