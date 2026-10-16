"use client";

import * as React from "react";
import { Profile } from "@/types/database";
import {
  User,
  Bell,
  Send,
  Sparkles,
  Code2,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  ExternalLink,
  CheckCircle2,
  Unlink,
  Bot,
  Radio,
  Camera,
  Upload,
  Trash2,
  Loader2,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { THEME_LIST, ThemeId, DEFAULT_THEME, THEMES, isValidTheme } from "@/lib/theme";
import { setThemeAction } from "@/lib/actions/theme";
import {
  saveTelegramSettings,
  disconnectTelegram,
  sendTestTelegramNotification,
} from "@/lib/actions/notifications";
import {
  updateUserProfile,
  changeUserPassword,
  uploadAvatar,
  removeAvatar,
} from "@/lib/actions/profile";
import { useRouter } from "next/navigation";

interface SettingsFormProps {
  profile: Profile | null;
  userEmail: string;
  defaultAvatarUrl?: string | null;
  isOauthAvatar?: boolean;
  hasExistingPassword?: boolean;
  oauthProvider?: string | null;
}

export function SettingsForm({
  profile,
  userEmail,
  defaultAvatarUrl = null,
  isOauthAvatar = false,
  hasExistingPassword = true,
  oauthProvider = null,
}: SettingsFormProps) {
  const router = useRouter();

  // Password account type state
  const [hasPassword, setHasPassword] = React.useState(hasExistingPassword);

  // Profile state
  const [fullName, setFullName] = React.useState(profile?.full_name || "");
  const [githubHandle, setGithubHandle] = React.useState(profile?.github_handle || "");
  const [primaryRole, setPrimaryRole] = React.useState(profile?.primary_role || "Full-Stack Developer");
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(profile?.avatar_url || defaultAvatarUrl || null);
  const [isOauth, setIsOauth] = React.useState(isOauthAvatar && !profile?.avatar_url);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Password management state
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);

  // Personal Telegram notification state
  const [telegramChatId, setTelegramChatId] = React.useState(profile?.telegram_chat_id || "");
  const [enableT24, setEnableT24] = React.useState(profile?.notify_t24 ?? true);
  const [enableT2, setEnableT2] = React.useState(profile?.notify_t2 ?? true);
  const [isSavingTelegram, setIsSavingTelegram] = React.useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = React.useState(false);
  const [isDisconnecting, setIsDisconnecting] = React.useState(false);

  // Theme selection state & synchronization
  const [activeThemeId, setActiveThemeId] = React.useState<ThemeId>(() => {
    if (typeof window !== "undefined") {
      const domTheme = document.documentElement.getAttribute("data-theme");
      if (isValidTheme(domTheme)) return domTheme;
    }
    return isValidTheme(profile?.theme) ? profile.theme : DEFAULT_THEME;
  });

  React.useEffect(() => {
    const domTheme = document.documentElement.getAttribute("data-theme");
    if (isValidTheme(domTheme)) {
      setActiveThemeId(domTheme);
    }

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail && isValidTheme(customEvent.detail)) {
        setActiveThemeId(customEvent.detail);
      }
    };

    window.addEventListener("hackline-theme-changed", handleThemeChange);
    return () => window.removeEventListener("hackline-theme-changed", handleThemeChange);
  }, []);

  const handleThemeSelect = (themeId: ThemeId) => {
    if (themeId === activeThemeId) return;

    // 1. Instant optimistic visual update
    document.documentElement.setAttribute("data-theme", themeId);
    if (THEMES[themeId].category === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    setActiveThemeId(themeId);

    // 2. Broadcast to header switcher
    window.dispatchEvent(new CustomEvent("hackline-theme-changed", { detail: themeId }));

    // 3. Persist to 1-year cookie and Supabase profile
    setThemeAction(themeId).catch(() => {});

    toast.success(`Theme updated to ${THEMES[themeId].name}`);
  };

  // Calculate password strength
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getPasswordStrength(newPassword);

  const getStrengthLabel = (score: number) => {
    if (!newPassword) return { label: "Enter password", color: "bg-[#28231d]", text: "text-[#a89a8c]" };
    if (score <= 1) return { label: "Weak", color: "bg-rose-500", text: "text-rose-400" };
    if (score === 2) return { label: "Fair", color: "bg-[#e5a93c]/60", text: "text-[#e5a93c]" };
    if (score === 3) return { label: "Good", color: "bg-[#4a82a6]", text: "text-[#7bb4d6]" };
    return { label: "Bulletproof", color: "bg-[#e5a93c]", text: "text-[#e5a93c]" };
  };

  const strengthInfo = getStrengthLabel(strength);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large", {
        description: "Please select an image smaller than 5MB.",
      });
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid image format", {
        description: "Supported formats: JPG, PNG, WEBP, or GIF.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setIsUploadingAvatar(true);
    try {
      const res = await uploadAvatar(formData);
      if (res.success && res.avatarUrl) {
        setAvatarUrl(res.avatarUrl);
        setIsOauth(false);
        toast.success("Profile photo updated!", {
          description: "Your new avatar is now displayed across Hackline.",
        });
        router.refresh();
      } else {
        toast.error("Failed to upload avatar", {
          description: res.error || "Please try again.",
        });
      }
    } catch (err: any) {
      toast.error("Error uploading avatar", {
        description: err?.message || "An unexpected error occurred.",
      });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm("Are you sure you want to remove your profile photo?")) return;

    setIsRemovingAvatar(true);
    try {
      const res = await removeAvatar();
      if (res.success) {
        setAvatarUrl(null);
        setIsOauth(false);
        toast.success("Profile photo removed");
        router.refresh();
      } else {
        toast.error("Failed to remove avatar", {
          description: res.error,
        });
      }
    } catch (err: any) {
      toast.error("Error removing avatar", {
        description: err?.message,
      });
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await updateUserProfile({
        fullName,
        githubHandle,
        primaryRole,
        phoneNumber: profile?.phone_number || undefined,
      });

      if (res.success) {
        toast.success("Profile updated successfully!");
        router.refresh();
      } else {
        toast.error("Failed to update profile", { description: res.error });
      }
    } catch {
      toast.error("Error updating profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changeUserPassword({
        currentPassword: hasPassword ? currentPassword : undefined,
        newPassword,
      });
      if (res.success) {
        toast.success(
          res.isFirstPasswordSet || !hasPassword
            ? "Account password established! You can now sign in using either OAuth or email & password."
            : "Password changed successfully!",
          {
            description: "Your session credentials have been updated.",
          }
        );
        setHasPassword(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        router.refresh();
      } else {
        toast.error("Failed to update password", { description: res.error });
      }
    } catch {
      toast.error("Error updating password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTelegram(true);
    try {
      const res = await saveTelegramSettings({
        chatId: telegramChatId.trim(),
        enableT24,
        enableT2,
      });

      if (res.success) {
        toast.success("Personal Telegram preferences saved!", {
          description: "Direct countdown pings will trigger at T-24h and T-2h.",
        });
        router.refresh();
      } else {
        toast.error("Failed to save settings", { description: res.error });
      }
    } catch {
      toast.error("Error saving Telegram preferences");
    } finally {
      setIsSavingTelegram(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    setIsDisconnecting(true);
    try {
      const res = await disconnectTelegram();
      if (res.success) {
        toast.success("Personal Telegram alerts disconnected.");
        setTelegramChatId("");
        router.refresh();
      } else {
        toast.error("Failed to disconnect", { description: res.error });
      }
    } catch {
      toast.error("Error disconnecting Telegram");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleTestTelegram = async () => {
    const targetId = telegramChatId.trim() || profile?.telegram_chat_id;
    if (!targetId) {
      toast.error("Please connect via Telegram or enter a Chat ID first.");
      return;
    }

    setIsTestingTelegram(true);
    try {
      const res = await sendTestTelegramNotification(targetId);
      if (res.success) {
        toast.success("Telegram test alert dispatched!", {
          description: res.message,
        });
      } else {
        toast.error("Failed to dispatch test alert", { description: res.error });
      }
    } catch {
      toast.error("Error dispatching test alert");
    } finally {
      setIsTestingTelegram(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* 1. Profile Settings */}
      <div className="rounded-2xl bg-[#1f1b16] border border-[rgba(229,169,60,0.20)] p-5 sm:p-7 shadow-xl">
        <div className="flex items-center gap-3 pb-5 border-b border-[rgba(229,169,60,0.15)]">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#28231d] border border-[rgba(229,169,60,0.25)] text-[#e5a93c] shadow-sm">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#fef3c7] tracking-tight font-mono">
              Developer Identity & Profile
            </h2>
            <p className="text-xs text-[#a89a8c]">
              Your profile details visible to squad members and invitees.
            </p>
          </div>
        </div>

        {/* Avatar & Visual Representation */}
        <div className="mt-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-xl bg-[#181410] border border-[rgba(229,169,60,0.18)]">
          <div className="relative group shrink-0">
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden border-2 border-[rgba(229,169,60,0.30)] bg-[#28231d] shadow-md flex items-center justify-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName || "User Avatar"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-mono text-2xl font-black text-[#e5a93c]">
                  {fullName ? fullName.substring(0, 2).toUpperCase() : "ME"}
                </span>
              )}

              {/* Hover action overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar || isRemovingAvatar}
                className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-[#fef3c7] cursor-pointer disabled:cursor-not-allowed"
                title="Upload new photo"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-6 w-6 animate-spin text-[#e5a93c]" />
                ) : (
                  <>
                    <Camera className="h-5 w-5 text-[#e5a93c]" />
                    <span className="text-[10px] font-mono font-medium">Change</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-[#fef3c7] font-mono">Profile Avatar</h3>
                {avatarUrl && isOauth && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4a82a6]/20 border border-[rgba(74,130,166,0.35)] text-[#7bb4d6]">
                    OAuth Account Photo
                  </span>
                )}
                {avatarUrl && !isOauth && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#e5a93c]/15 border border-[rgba(229,169,60,0.30)] text-[#e5a93c]">
                    Custom Storage Avatar
                  </span>
                )}
              </div>
              <p className="text-xs text-[#a89a8c] mt-0.5">
                Upload a custom photo or avatar to represent your identity across squad rosters, hackathon teams, and navigation.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarFileChange}
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
              />
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar || isRemovingAvatar}
                className="text-xs h-8 px-3.5 rounded-xl gap-1.5"
              >
                {isUploadingAvatar ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Photo</span>
                  </>
                )}
              </Button>

              {avatarUrl && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleRemoveAvatar}
                  disabled={isUploadingAvatar || isRemovingAvatar}
                  className="text-xs h-8 px-3 rounded-xl gap-1.5 text-rose-400 border-rose-500/20 hover:bg-rose-950/30 hover:text-rose-300"
                >
                  {isRemovingAvatar ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  <span>Remove</span>
                </Button>
              )}

              <span className="text-[11px] font-mono text-[#a89a8c]/80 block w-full sm:w-auto">
                JPG, PNG, WEBP, or GIF (max 5MB)
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a89a8c] font-mono">Full Name</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Vance"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a89a8c] font-mono">Email Address</label>
              <Input
                value={userEmail}
                disabled
                className="opacity-60 cursor-not-allowed font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a89a8c] font-mono">GitHub Handle</label>
              <Input
                value={githubHandle}
                onChange={(e) => setGithubHandle(e.target.value)}
                placeholder="e.g. alexvance"
                className="font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a89a8c] font-mono">Primary Specialization</label>
              <Input
                value={primaryRole}
                onChange={(e) => setPrimaryRole(e.target.value)}
                placeholder="e.g. Next.js Frontend / AI Engineer"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <Button
              type="submit"
              variant="primary"
              disabled={isSavingProfile}
              className="text-xs rounded-xl px-5"
            >
              {isSavingProfile ? "Saving..." : "Save Profile Details"}
            </Button>
          </div>
        </form>
      </div>

      {/* 2. Interface Theme & Visual Style */}
      <div className="rounded-2xl bg-surface border border-surface-border p-5 sm:p-7 shadow-xl">
        <div className="flex items-center gap-3 pb-5 border-b border-surface-border">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-elevated border border-surface-border text-mustard shadow-sm">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-parchment tracking-tight font-mono">
                Interface Theme & Visual Style
              </h2>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border border-steel/30 bg-steel/15 text-steel">
                Cross-Device Sync
              </span>
            </div>
            <p className="text-xs text-clay mt-0.5">
              Choose your squad workspace aesthetic. Saved to your profile and preserved across devices and logouts.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {THEME_LIST.map((theme) => {
            const isSelected = theme.id === activeThemeId;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleThemeSelect(theme.id)}
                className={`relative flex flex-col justify-between p-4 rounded-xl border text-left transition-all duration-200 select-none ${
                  isSelected
                    ? "bg-surface-elevated border-mustard shadow-md ring-1 ring-mustard/40"
                    : "bg-surface-sunken/60 border-surface-border hover:border-mustard/40 hover:bg-surface-elevated/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-parchment font-mono">
                        {theme.name}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-mustard/15 text-mustard uppercase font-medium">
                        {theme.category}
                      </span>
                    </div>

                    <div
                      className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? "border-mustard bg-mustard text-canvas"
                          : "border-clay/40 bg-surface"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>

                  <p className="text-xs text-clay leading-relaxed mb-4">
                    {theme.description}
                  </p>
                </div>

                {/* 5 Swatches Preview Bar */}
                <div className="pt-3 border-t border-surface-border flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-clay/80 tracking-wider">
                    Palette
                  </span>
                  <div className="flex items-center gap-1.5">
                    {theme.swatches.map((color, i) => (
                      <span
                        key={i}
                        className="w-4 h-4 rounded-full border border-surface shadow-xs transition-transform hover:scale-125"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Security & Password Management */}
      <div className="rounded-2xl bg-[#1f1b16] border border-[rgba(229,169,60,0.20)] p-5 sm:p-7 shadow-xl">
        <div className="flex items-center gap-3 pb-5 border-b border-[rgba(229,169,60,0.15)]">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#28231d] border border-[rgba(229,169,60,0.25)] text-[#e5a93c] shadow-sm">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-[#fef3c7] tracking-tight font-mono">
                {hasPassword ? "Security & Password Management" : "Set Account Password"}
              </h2>
              {!hasPassword && (
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border border-[rgba(229,169,60,0.35)] bg-[#e5a93c]/15 text-[#e5a93c]">
                  Authenticated via {oauthProvider || "OAuth"}
                </span>
              )}
            </div>
            <p className="text-xs text-[#a89a8c] mt-0.5">
              {hasPassword
                ? "Update your login credentials. We verify your current password before committing changes."
                : `Your account was created via ${oauthProvider || "OAuth"}. Set a secure password below to enable direct email & password sign-in alongside your OAuth login.`}
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
          <div className={`grid grid-cols-1 ${hasPassword ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-4`}>
            {/* Current Password - Only shown if user has an existing password */}
            {hasPassword && (
              <div className="space-y-1.5 relative">
                <label className="text-xs font-medium text-[#a89a8c] font-mono">Current Password</label>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-2.5 text-[#a89a8c] hover:text-[#fef3c7]"
                    tabIndex={-1}
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* New Password */}
            <div className="space-y-1.5 relative">
              <label className="text-xs font-medium text-[#a89a8c] font-mono">
                {hasPassword ? "New Password" : "Create Password"}
              </label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-2.5 text-[#a89a8c] hover:text-[#fef3c7]"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5 relative">
              <label className="text-xs font-medium text-[#a89a8c] font-mono">
                {hasPassword ? "Confirm New Password" : "Confirm Password"}
              </label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-2.5 text-[#a89a8c] hover:text-[#fef3c7]"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Password Strength Meter */}
          {newPassword && (
            <div className="space-y-1.5 pt-1 max-w-sm">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#a89a8c]">Password Strength:</span>
                <span className={strengthInfo.text}>{strengthInfo.label}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 h-1">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`rounded-full transition-all duration-300 ${
                      strength >= step ? strengthInfo.color : "bg-[#28231d]"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[rgba(229,169,60,0.12)]">
            <span className="text-[11px] text-[#a89a8c] font-mono">
              Must be at least 8 characters with 1 uppercase & 1 number
            </span>

            <Button
              type="submit"
              variant="outline"
              disabled={isChangingPassword || !newPassword || !confirmPassword || (hasPassword && !currentPassword)}
              className="text-xs rounded-xl px-5 gap-1.5 border-[rgba(229,169,60,0.30)] hover:border-[#e5a93c] text-[#fef3c7]"
            >
              <KeyRound className="h-3.5 w-3.5 text-[#e5a93c]" />
              <span>
                {isChangingPassword
                  ? hasPassword
                    ? "Updating..."
                    : "Setting..."
                  : hasPassword
                  ? "Update Password"
                  : "Set Account Password"}
              </span>
            </Button>
          </div>
        </form>
      </div>

      {/* 3. Personal Telegram Deadline Alert Engine */}
      <div className="rounded-2xl bg-[#1f1b16] border border-[rgba(229,169,60,0.20)] p-5 sm:p-7 shadow-xl">
        <div className="flex items-center justify-between pb-5 border-b border-[rgba(229,169,60,0.15)] flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#28231d] border border-[rgba(74,130,166,0.35)] text-[#7bb4d6] shadow-sm">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#fef3c7] tracking-tight flex items-center gap-2 flex-wrap font-mono">
                <span>Personal Telegram Deadline Alerts</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[rgba(74,130,166,0.35)] bg-[#4a82a6]/15 text-[#7bb4d6]">
                  Direct 1-on-1 DMs &bull; Free Forever
                </span>
              </h2>
              <p className="text-xs text-[#a89a8c]">
                Instant push countdown warnings sent directly to your phone at T-24h and T-2h for all hackathons you join.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <div className="space-y-4">
            {/* Connection Status Card */}
            {profile?.telegram_chat_id ? (
              <div className="rounded-2xl border border-[rgba(229,169,60,0.30)] bg-[#28231d]/60 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e5a93c] opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#e5a93c]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#fef3c7]">
                        Personal Telegram Connected
                      </span>
                      <span className="text-[10px] font-mono bg-[#181410] border border-[rgba(229,169,60,0.20)] px-2 py-0.5 rounded text-[#e5a93c]">
                        Chat ID: {profile.telegram_chat_id}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#a89a8c] mt-0.5">
                      Your account is paired. You will receive private DMs with sound and push notifications for your hackathon deadlines.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnectTelegram}
                    disabled={isDisconnecting}
                    className="text-xs rounded-xl h-8 px-3 text-[#a89a8c] hover:text-rose-400 hover:border-rose-500/30"
                  >
                    <Unlink className="h-3.5 w-3.5 mr-1" />
                    <span>{isDisconnecting ? "Disconnecting..." : "Disconnect"}</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[rgba(74,130,166,0.35)] bg-[#4a82a6]/10 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-[#fef3c7] block">
                      Connect Your Telegram (1-Click)
                    </span>
                    <p className="text-[11px] text-[#a89a8c] mt-0.5">
                      Tap the button below to open Telegram and press <strong>Start</strong>. Your account links instantly to receive direct DMs on your phone.
                    </p>
                  </div>

                  <a
                    href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "HacklineAlertsBot"}?start=${profile?.id || ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#e5a93c] hover:bg-[#f3c768] text-[#14110e] font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shrink-0"
                  >
                    <Send className="h-3.5 w-3.5 fill-current" />
                    <span>Connect via Telegram</span>
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                </div>

                {/* Manual Chat ID Fallback */}
                <div className="pt-3 border-t border-[rgba(74,130,166,0.20)]">
                  <label className="text-[11px] font-medium text-[#fef3c7] block mb-1.5 font-mono">
                    Or enter your Telegram Chat ID manually:
                  </label>
                  <div className="flex items-center gap-2 max-w-md">
                    <Input
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      placeholder="e.g. 123456789"
                      className="font-mono h-9"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSaveTelegram}
                      disabled={isSavingTelegram || !telegramChatId.trim()}
                      className="text-xs rounded-xl h-9 shrink-0 border-[rgba(229,169,60,0.30)] text-[#fef3c7]"
                    >
                      {isSavingTelegram ? "Saving..." : "Pair Chat ID"}
                    </Button>
                  </div>
                  <p className="text-[10px] text-[#a89a8c] font-mono mt-1">
                    Tip: You can get your personal Chat ID from @userinfobot on Telegram or by pressing start on our bot.
                  </p>
                </div>
              </div>
            )}

            {/* Form for toggling T-24h / T-2h and sending test alert */}
            <form onSubmit={handleSaveTelegram} className="space-y-4 pt-2">
              <div className="space-y-2.5">
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[rgba(229,169,60,0.18)] bg-[#181410] hover:border-[rgba(229,169,60,0.35)] transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enableT24}
                    onChange={(e) => setEnableT24(e.target.checked)}
                    className="mt-0.5 rounded border-[rgba(229,169,60,0.30)] bg-[#28231d] text-[#e5a93c] focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-[#fef3c7] block">
                      T-24h Emergency Warning (24 Hours Remaining)
                    </span>
                    <span className="text-[11px] text-[#a89a8c] block mt-0.5">
                      Direct ping to freeze feature branches, initiate slide deck drafts, and verify teammate registrations.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[rgba(229,169,60,0.18)] bg-[#181410] hover:border-[rgba(229,169,60,0.35)] transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enableT2}
                    onChange={(e) => setEnableT2(e.target.checked)}
                    className="mt-0.5 rounded border-[rgba(229,169,60,0.30)] bg-[#28231d] text-[#e5a93c] focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-[#fef3c7] block">
                      T-2h Final Code Freeze Alert (2 Hours Remaining)
                    </span>
                    <span className="text-[11px] text-[#a89a8c] block mt-0.5">
                      Urgent direct DM to push main, make repo public, upload Loom demo, and complete portal submission gates.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[rgba(229,169,60,0.12)]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestTelegram}
                  disabled={isTestingTelegram || (!profile?.telegram_chat_id && !telegramChatId.trim())}
                  className="text-xs rounded-xl gap-1.5 border-[rgba(74,130,166,0.35)] text-[#7bb4d6] hover:bg-[#4a82a6]/15"
                >
                  <Send className="h-3.5 w-3.5 text-[#7bb4d6]" />
                  <span>{isTestingTelegram ? "Dispatching..." : "Send Test Telegram Alert"}</span>
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSavingTelegram}
                  className="text-xs rounded-xl px-5"
                >
                  {isSavingTelegram ? "Saving..." : "Save Notification Preferences"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
