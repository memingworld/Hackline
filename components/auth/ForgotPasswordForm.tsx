"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail, ArrowRight, RefreshCw, CheckCircle2, ExternalLink, ArrowLeft } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [submittedEmail, setSubmittedEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);

  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      });

      if (error) {
        toast.error("Failed to send reset link", {
          description: error.message,
        });
        return;
      }

      setSubmittedEmail(values.email);
      setIsSubmitted(true);
      setResendCooldown(60);
      toast.success("Reset link dispatched", {
        description: `Check ${values.email} for password reset instructions.`,
      });
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !submittedEmail) return;
    setIsSubmitting(true);
    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(submittedEmail, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      });

      if (error) {
        toast.error("Could not resend reset link", { description: error.message });
      } else {
        toast.success("Reset link re-sent", {
          description: `A fresh link was sent to ${submittedEmail}.`,
        });
        setResendCooldown(60);
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEmailProviderLink = () => {
    if (submittedEmail.includes("@gmail.com")) return "https://mail.google.com";
    if (submittedEmail.includes("@outlook.com") || submittedEmail.includes("@hotmail.com"))
      return "https://outlook.live.com";
    if (submittedEmail.includes("@yahoo.com")) return "https://mail.yahoo.com";
    return null;
  };

  const providerUrl = getEmailProviderLink();

  if (isSubmitted) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/10 p-2 ring-1 ring-amber-500/20">
          <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
            <Mail className="h-8 w-8 text-white animate-bounce" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-white tracking-tight">
            Check your email inbox
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
            We sent a secure password reset link to:
          </p>
          <div className="inline-block rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-xs font-semibold text-amber-300">
            {submittedEmail}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4 space-y-2 text-xs text-zinc-400">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Click the password reset link inside the email.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>You will land on the secure "Set New Password" page to finalize your credentials.</span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {providerUrl && (
            <a
              href={providerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="primary" size="lg" className="w-full gap-2">
                <span>Open Webmail Inbox</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          )}

          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={resendCooldown > 0 || isSubmitting}
            onClick={handleResend}
            className="w-full gap-2 bg-zinc-950/40 border-zinc-800"
          >
            <RefreshCw className={`h-4 w-4 ${isSubmitting ? "animate-spin" : ""}`} />
            <span>
              {resendCooldown > 0
                ? `Resend available in ${resendCooldown}s`
                : "Resend Reset Link"}
            </span>
          </Button>

          <div className="text-center pt-2">
            <button
              onClick={() => setIsSubmitted(false)}
              className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Try a different email address</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Registered email address"
        type="email"
        placeholder="john.doe@example.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        loadingText="Dispatching reset link..."
        className="w-full mt-2"
      >
        <span>Send Password Reset Link</span>
        <ArrowRight className="h-4 w-4" />
      </Button>

      <div className="text-center pt-2">
        <Link
          href="/login"
          className="text-xs font-mono text-zinc-400 hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to sign in</span>
        </Link>
      </div>
    </form>
  );
}
