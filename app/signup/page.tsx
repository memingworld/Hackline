"use client";

import * as React from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignupForm } from "@/components/auth/SignupForm";
import { CheckEmailCard } from "@/components/auth/CheckEmailCard";

export default function SignupPage() {
  const [verificationEmail, setVerificationEmail] = React.useState<string | null>(null);

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
