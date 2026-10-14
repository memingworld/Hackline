import { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password — Hackline",
  description: "Recover your Hackline account credentials via single-use reset link.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      heading="Reset your password"
      subheading="Enter the email associated with your account and we will send you a secure link to reset your credentials."
      alternateLink={{
        prompt: "Remember your password?",
        label: "Sign in instead",
        href: "/login",
      }}
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
