"use client";

import * as React from "react";
import { Mail, ArrowRight, RefreshCw, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface CheckEmailCardProps {
  email: string;
  onReset: () => void;
}

export function CheckEmailCard({ email, onReset }: CheckEmailCardProps) {
  const [isResending, setIsResending] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const supabase = createClient();

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
        },
      });

      if (error) {
        toast.error("Could not resend email", {
          description: error.message,
        });
      } else {
        toast.success("Verification link dispatched", {
          description: `A fresh activation token was sent to ${email}.`,
        });
        setResendCooldown(60);
      }
    } catch {
      toast.error("Failed to connect to auth server");
    } finally {
      setIsResending(false);
    }
  };

  const getEmailProviderLink = () => {
    if (email.includes("@gmail.com")) return "https://mail.google.com";
    if (email.includes("@outlook.com") || email.includes("@hotmail.com"))
      return "https://outlook.live.com";
    if (email.includes("@yahoo.com")) return "https://mail.yahoo.com";
    return null;
  };

  const providerUrl = getEmailProviderLink();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Icon Container */}
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-white shadow-sm">
        <Mail className="h-6 w-6 text-zinc-200" />
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-white tracking-tight">
          Verify your email address
        </h2>
        <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
          We sent a single-use cryptographically signed activation link to:
        </p>
        <div className="inline-block rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1 font-mono text-xs font-medium text-zinc-200">
          {email}
        </div>
      </div>

      {/* Instruction Steps */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-2.5 text-xs text-zinc-400">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>Click the magic confirmation link in the verification email.</span>
        </div>
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>You will be securely redirected to your Hackline squad dashboard.</span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="space-y-3 pt-2">
        {providerUrl && (
          <a
            href={providerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 text-xs font-semibold rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 transition-colors shadow-sm"
          >
            <span>Open Email Inbox</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            isLoading={isResending}
            disabled={resendCooldown > 0}
            onClick={handleResend}
            className="flex-1 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${resendCooldown > 0 ? "animate-spin" : ""}`} />
            <span>
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend Verification"}
            </span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onReset}
            className="text-xs text-zinc-400 hover:text-zinc-200"
          >
            <span>Change email</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
