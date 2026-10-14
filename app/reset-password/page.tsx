import { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Set New Password — Hackline",
  description: "Configure new secure account credentials.",
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      heading="Set new password"
      subheading="Please choose a strong, unique password to secure your hackathon command center."
      alternateLink={{
        prompt: "Remembered your credentials?",
        label: "Sign in instead",
        href: "/login",
      }}
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}
