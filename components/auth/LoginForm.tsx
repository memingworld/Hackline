"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { GithubIcon, GoogleIcon } from "@/components/icons/OAuthIcons";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import Link from "next/link";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
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
          window.location.href = "/dashboard";
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
          redirectTo: `${origin}/auth/callback?next=/dashboard`,
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
          className="w-full bg-zinc-950/40 border-zinc-800 hover:border-zinc-700"
        >
          <GithubIcon className="h-4 w-4" />
          <span className="text-xs font-medium">GitHub</span>
        </Button>

        <GoogleSignInButton
          isLoading={isOauthLoading === "google"}
          onSuccess={onSuccess}
        />
      </div>

      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-800" />
        </div>
        <span className="relative bg-zinc-900/90 px-3 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
          Or continue with email
        </span>
      </div>

      {/* Main Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          placeholder="hacker@hackline.dev"
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
            className="absolute right-3 top-[34px] text-zinc-500 hover:text-zinc-300 transition-colors"
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
          <label className="flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-zinc-300">
            <input
              type="checkbox"
              className="rounded border-zinc-700 bg-zinc-800 text-indigo-500 focus:ring-indigo-500/50"
            />
            <span>Remember for 30 days</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-zinc-400 hover:text-indigo-400 transition-colors"
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
