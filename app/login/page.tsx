import { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In — Hackline",
  description: "Access your hackathon squads, timeline monitors, and project vaults.",
};

export default function LoginPage() {
  return (
    <AuthLayout
      heading="Welcome back"
      subheading="Sign in with your verified credentials or team OAuth provider."
      alternateLink={{
        prompt: "Don't have a team account yet?",
        label: "Create one now",
        href: "/signup",
      }}
    >
      <LoginForm />
    </AuthLayout>
  );
}
