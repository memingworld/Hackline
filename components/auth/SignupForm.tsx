"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { GithubIcon } from "@/components/icons/OAuthIcons";
import { signupSchema, type SignupFormValues } from "@/lib/validations/auth";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

interface SignupFormProps {
  onVerificationRequired: (email: string) => void;
  redirectPath?: string;
}

export function SignupForm({ onVerificationRequired, redirectPath = "/dashboard" }: SignupFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isOauthLoading, setIsOauthLoading] = React.useState<"github" | "google" | null>(null);

  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password", "");

  const hasMinLength = passwordValue.length >= 8;
  const hasUppercase = /[A-Z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);

  const onSubmit = async (values: SignupFormValues) => {
    setIsSubmitting(true);
    try {
      const origin = window.location.origin;
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
          },
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
        },
      });

      if (error) {
        toast.error("Registration failed", {
          description: error.message,
        });
        return;
      }

      // If email confirmation is disabled, Supabase returns a session immediately
      if (data?.session) {
        toast.success("Welcome aboard!", {
          description: "Your account is live. Redirecting to command center...",
        });
        router.push(redirectPath);
        return;
      }

      // If email confirmation is required and email dispatched
      if (data?.user) {
        toast.success("Account initiated", {
          description: "Confirmation link dispatched to your email.",
        });
        // Transition smoothly to "Check Email" verification state
        onVerificationRequired(values.email);
      }
    } catch {
      toast.error("An unexpected error occurred", {
        description: "Please check your network connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthLogin = async (provider: "github" | "google") => {
    try {
      setIsOauthLoading(provider);
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
        },
      });

      if (error) {
        toast.error(`${provider} signup failed`, {
          description: error.message,
        });
      }
    } catch {
      toast.error("OAuth connection failed");
    } finally {
      setIsOauthLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* OAuth Fast Sign Up */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          size="md"
          isLoading={isOauthLoading === "github"}
          onClick={() => handleOAuthLogin("github")}
          className="w-full bg-[#181410] border-[rgba(229,169,60,0.2)] text-[#fef3c7] hover:border-[rgba(229,169,60,0.4)] hover:bg-[#28231d]"
        >
          <GithubIcon className="h-4 w-4" />
          <span className="text-xs font-medium">GitHub</span>
        </Button>

        <GoogleSignInButton
          isLoading={isOauthLoading === "google"}
          redirectPath={redirectPath}
        />
      </div>

      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[rgba(229,169,60,0.15)]" />
        </div>
        <span className="relative bg-[#1f1b16] px-3 text-[11px] font-mono uppercase tracking-wider text-[#a89a8c]">
          Or register with credentials
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name or Squad Handle"
          type="text"
          placeholder="John Doe"
          autoComplete="name"
          error={errors.fullName?.message}
          {...register("fullName")}
        />

        <Input
          label="Work / University Email"
          type="email"
          placeholder="john.doe@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••••••"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] text-[#a89a8c] hover:text-[#fef3c7] transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Live password criteria pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 border transition-colors ${
              hasMinLength
                ? "border-[rgba(229,169,60,0.4)] bg-[#e5a93c]/15 text-[#e5a93c] font-semibold"
                : "border-[rgba(229,169,60,0.12)] bg-[#181410] text-[#a89a8c]/50"
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            8+ chars
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 border transition-colors ${
              hasUppercase
                ? "border-[rgba(229,169,60,0.4)] bg-[#e5a93c]/15 text-[#e5a93c] font-semibold"
                : "border-[rgba(229,169,60,0.12)] bg-[#181410] text-[#a89a8c]/50"
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            1 uppercase
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 border transition-colors ${
              hasNumber
                ? "border-[rgba(229,169,60,0.4)] bg-[#e5a93c]/15 text-[#e5a93c] font-semibold"
                : "border-[rgba(229,169,60,0.12)] bg-[#181410] text-[#a89a8c]/50"
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            1 number
          </span>
        </div>

        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••••••"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <p className="text-[11px] text-[#a89a8c] leading-tight pt-1">
          By signing up, you agree to our terms of service and verify that you
          will receive an activation link to authenticate this device.
        </p>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          loadingText="Generating activation link..."
          className="w-full mt-2"
        >
          <span>Create Hackline Account</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
