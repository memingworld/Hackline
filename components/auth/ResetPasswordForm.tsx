"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, ShieldCheck, Check, Sparkles } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export function ResetPasswordForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const currentPassword = watch("password");

  // Calculate password strength score
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getPasswordStrength(currentPassword || "");

  const getStrengthLabel = (score: number) => {
    if (!currentPassword) return { label: "Enter password", color: "bg-zinc-800", text: "text-zinc-500" };
    if (score <= 1) return { label: "Weak", color: "bg-rose-500", text: "text-rose-400" };
    if (score === 2) return { label: "Fair", color: "bg-amber-500", text: "text-amber-400" };
    if (score === 3) return { label: "Good", color: "bg-blue-500", text: "text-blue-400" };
    return { label: "Bulletproof", color: "bg-emerald-500", text: "text-emerald-400" };
  };

  const strengthInfo = getStrengthLabel(strength);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        toast.error("Failed to reset password", {
          description: error.message,
        });
        return;
      }

      toast.success("Password updated successfully!", {
        description: "Redirecting to your Hackline Command Center...",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="relative">
        <Input
          label="New password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••••••"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[34px] text-zinc-500 hover:text-zinc-300 transition-colors"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {/* Real-time Password Strength Meter */}
      {currentPassword && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-500">Security Strength:</span>
            <span className={strengthInfo.text}>{strengthInfo.label}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 h-1">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`rounded-full transition-all duration-300 ${
                  strength >= step ? strengthInfo.color : "bg-zinc-800"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <Input
          label="Confirm new password"
          type={showConfirm ? "text" : "password"}
          placeholder="••••••••••••"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <button
          type="button"
          onClick={() => setShowConfirm(!showConfirm)}
          className="absolute right-3 top-[34px] text-zinc-500 hover:text-zinc-300 transition-colors"
          tabIndex={-1}
        >
          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3.5 space-y-2 text-xs text-zinc-400 font-mono">
        <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">
          Password Policy:
        </span>
        <div className="flex items-center gap-2 text-[11px]">
          <Check className={`h-3 w-3 ${currentPassword?.length >= 8 ? "text-emerald-400" : "text-zinc-600"}`} />
          <span>At least 8 characters long</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <Check className={`h-3 w-3 ${/[A-Z]/.test(currentPassword || "") ? "text-emerald-400" : "text-zinc-600"}`} />
          <span>At least one uppercase character</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <Check className={`h-3 w-3 ${/[0-9]/.test(currentPassword || "") ? "text-emerald-400" : "text-zinc-600"}`} />
          <span>At least one number</span>
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        loadingText="Updating credentials..."
        className="w-full mt-2"
      >
        <Sparkles className="h-4 w-4" />
        <span>Save New Password & Continue</span>
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
