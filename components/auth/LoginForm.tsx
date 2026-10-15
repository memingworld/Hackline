"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { GithubIcon } from "@/components/icons/OAuthIcons";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import Link from "next/link";

interface LoginFormProps {
  onSuccess?: () => void;
  redirectPath?: string;
}

export function LoginForm({ onSuccess, redirectPath = "/dashboard" }: LoginFormProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isOauthLoading, setIsOauthLoading] = React.useState<"github" | "google" | null>(null);

  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        toast.error("Authentication failed", {
          description: error.message,
        });
        return;
      }

      if (data?.user) {
        // Check if email confirmed
        if (!data.user.email_confirmed_at) {
          toast.warning("Email not confirmed", {
            description: "Please check your inbox to verify your email before entering the dashboard.",
          });
          return;
        }

        toast.success("Welcome back!", {
          description: "Redirecting to your hackathon command center...",
        });

        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = redirectPath;
        }
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
        toast.error(`${provider} login failed`, {
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
      {/* OAuth Actions */}
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
          onSuccess={onSuccess}
          redirectPath={redirectPath}
        />
      </div>

      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[rgba(229,169,60,0.15)]" />
        </div>
        <span className="relative bg-[#1f1b16] px-3 text-[11px] font-mono uppercase tracking-wider text-[#a89a8c]">
          Or continue with email
        </span>
      </div>

      {/* Main Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email address"
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
            autoComplete="current-password"
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

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-[#a89a8c] hover:text-[#fef3c7]">
            <input
              type="checkbox"
              className="rounded border-[rgba(229,169,60,0.25)] bg-[#181410] text-[#e5a93c] focus:ring-[#e5a93c]/50 accent-[#e5a93c]"
            />
            <span>Remember for 30 days</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-[#a89a8c] hover:text-[#e5a93c] transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          loadingText="Authenticating session..."
          className="w-full mt-2"
        >
          <span>Sign In to Hackline</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
