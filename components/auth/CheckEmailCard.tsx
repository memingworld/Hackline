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
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#28231d] border border-[rgba(229,169,60,0.25)] text-[#e5a93c] shadow-sm">
        <Mail className="h-6 w-6 text-[#e5a93c]" />
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-[#fef3c7] tracking-tight">
          Verify your email address
        </h2>
        <p className="text-xs text-[#a89a8c] leading-relaxed max-w-sm mx-auto">
          We sent a single-use cryptographically signed activation link to:
        </p>
        <div className="inline-block rounded-md border border-[rgba(229,169,60,0.35)] bg-[#e5a93c]/15 px-3 py-1 font-mono text-xs font-semibold text-[#e5a93c]">
          {email}
        </div>
      </div>

      {/* Instruction Steps */}
      <div className="rounded-xl border border-[rgba(229,169,60,0.2)] bg-[#181410] p-4 space-y-2.5 text-xs text-[#a89a8c]">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-[#e5a93c] shrink-0 mt-0.5" />
          <span>Click the magic confirmation link in the verification email.</span>
        </div>
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-[#e5a93c] shrink-0 mt-0.5" />
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
            className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 text-xs font-semibold rounded-xl bg-[#e5a93c] text-[#14110e] hover:bg-[#d99b2e] transition-colors shadow-sm"
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
            className="flex-1 text-xs bg-[#181410] border-[rgba(229,169,60,0.2)] text-[#fef3c7] hover:border-[rgba(229,169,60,0.4)] hover:bg-[#28231d]"
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
            className="text-xs text-[#a89a8c] hover:text-[#fef3c7] hover:bg-[#28231d]"
          >
            <span>Change email</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
