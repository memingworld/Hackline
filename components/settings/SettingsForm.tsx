"use client";

import * as React from "react";
import { Profile, Team, SubmissionChecklistItem } from "@/types/database";
import {
  User,
  MessageCircle,
  Bell,
  ShieldCheck,
  Send,
  Sparkles,
  Code2,
  Phone,
  Trash2,
  Plus,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  saveNotificationSettings,
  sendTestWhatsAppNotification,
} from "@/lib/actions/notifications";
import { createChecklistItem, deleteChecklistItem } from "@/lib/actions/checklist";
import { updateUserProfile, changeUserPassword } from "@/lib/actions/profile";
import { useRouter } from "next/navigation";

interface SettingsFormProps {
  profile: Profile | null;
  activeTeam: Team | null;
  checklistItems: SubmissionChecklistItem[];
  userEmail: string;
}

export function SettingsForm({
  profile,
  activeTeam,
  checklistItems,
  userEmail,
}: SettingsFormProps) {
  const router = useRouter();

  // Profile state
  const [fullName, setFullName] = React.useState(profile?.full_name || "");
  const [githubHandle, setGithubHandle] = React.useState(profile?.github_handle || "");
  const [primaryRole, setPrimaryRole] = React.useState(profile?.primary_role || "Full-Stack Developer");
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);

  // Password management state
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);

  // WhatsApp notification state
  const [phone, setPhone] = React.useState(profile?.phone_number || "");
  const [enableT24, setEnableT24] = React.useState(true);
  const [enableT2, setEnableT2] = React.useState(true);
  const [isSavingAlerts, setIsSavingAlerts] = React.useState(false);
  const [isTestingWhatsApp, setIsTestingWhatsApp] = React.useState(false);

  // Custom check state
  const [newGateTitle, setNewGateTitle] = React.useState("");
  const [isAddingGate, setIsAddingGate] = React.useState(false);

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
    if (!newPassword) return { label: "Enter password", color: "bg-zinc-800", text: "text-zinc-500" };
    if (score <= 1) return { label: "Weak", color: "bg-rose-500", text: "text-rose-400" };
    if (score === 2) return { label: "Fair", color: "bg-amber-500", text: "text-amber-400" };
    if (score === 3) return { label: "Good", color: "bg-blue-500", text: "text-blue-400" };
    return { label: "Bulletproof", color: "bg-emerald-500", text: "text-emerald-400" };
  };

  const strengthInfo = getStrengthLabel(strength);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await updateUserProfile({
        fullName,
        githubHandle,
        primaryRole,
        phoneNumber: phone,
      });

      if (res.success) {
        toast.success("Profile details updated successfully");
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
    if (!currentPassword) {
      toast.error("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changeUserPassword({
        currentPassword,
        newPassword,
      });

      if (res.success) {
        toast.success("Password changed successfully!", {
          description: "Your session credentials have been updated.",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error("Password update failed", { description: res.error });
      }
    } catch {
      toast.error("An unexpected error occurred while changing password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveAlerts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error("Please enter a WhatsApp phone number with country code.");
      return;
    }

    setIsSavingAlerts(true);
    try {
      const res = await saveNotificationSettings({
        phone: phone.trim(),
        enableT24,
        enableT2,
        teamId: activeTeam?.id,
        hackathonId: activeTeam?.hackathon_id,
        endsAt: activeTeam?.hackathon?.ends_at,
      });

      if (res.success) {
        toast.success("Notification preferences saved!", {
          description: "Automated alerts will trigger at T-24h and T-2h before the submission deadline.",
        });
        router.refresh();
      } else {
        toast.error("Failed to save notification settings", { description: res.error });
      }
    } catch {
      toast.error("Error saving alert preferences");
    } finally {
      setIsSavingAlerts(false);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!phone.trim()) {
      toast.error("Please enter a phone number to receive the test dispatch.");
      return;
    }

    setIsTestingWhatsApp(true);
    try {
      const res = await sendTestWhatsAppNotification(
        phone.trim(),
        activeTeam?.name || "Dream Squad",
        activeTeam?.hackathon?.title || "Upcoming Hackathon"
      );

      if (res.success) {
        toast.success(
          res.mode === "live"
            ? "WhatsApp message dispatched!"
            : "WhatsApp test alert sent!",
          {
            description: res.message,
          }
        );
      } else {
        toast.error("Failed to dispatch test alert", { description: res.error });
      }
    } catch {
      toast.error("Error dispatching test alert");
    } finally {
      setIsTestingWhatsApp(false);
    }
  };

  const handleAddGate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGateTitle.trim() || !activeTeam) return;
    setIsAddingGate(true);
    try {
      const res = await createChecklistItem(activeTeam.id, newGateTitle.trim());
      if (res.success) {
        toast.success("Custom verification gate added");
        setNewGateTitle("");
        router.refresh();
      } else {
        toast.error("Failed to add gate", { description: res.error });
      }
    } catch {
      toast.error("Error adding gate");
    } finally {
      setIsAddingGate(false);
    }
  };

  const handleDeleteGate = async (itemId: string, itemTitle: string) => {
    try {
      const res = await deleteChecklistItem(itemId);
      if (res.success) {
        toast.success(`Gate "${itemTitle}" removed`);
        router.refresh();
      } else {
        toast.error("Failed to delete gate");
      }
    } catch {
      toast.error("Error removing gate");
    }
  };

  return (
    <div className="space-y-10 max-w-4xl">
      {/* 1. Profile Settings */}
      <div className="rounded-[2rem] p-1.5 bg-white/5 border border-white/10 ring-1 ring-white/5 shadow-xl">
        <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-950 p-6 md:p-8">
          <div className="flex items-center gap-3 pb-5 border-b border-zinc-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Developer Identity & Profile
              </h2>
              <p className="text-xs text-zinc-400">
                Your profile details visible to squad members and invitees.
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Full Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Vance"
                  className="bg-zinc-900/60 border-zinc-800 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Email Address</label>
                <Input
                  value={userEmail}
                  disabled
                  className="bg-zinc-900/30 border-zinc-800/60 text-xs text-zinc-500 font-mono cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">GitHub Handle</label>
                <Input
                  value={githubHandle}
                  onChange={(e) => setGithubHandle(e.target.value)}
                  placeholder="e.g. alexvance"
                  className="bg-zinc-900/60 border-zinc-800 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Primary Specialization</label>
                <Input
                  value={primaryRole}
                  onChange={(e) => setPrimaryRole(e.target.value)}
                  placeholder="e.g. Next.js Frontend / AI Engineer"
                  className="bg-zinc-900/60 border-zinc-800 text-xs"
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
      </div>

      {/* 2. Security & Password Management (Logged In) */}
      <div className="rounded-[2rem] p-1.5 bg-white/5 border border-white/10 ring-1 ring-white/5 shadow-xl">
        <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-950 p-6 md:p-8">
          <div className="flex items-center gap-3 pb-5 border-b border-zinc-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Security & Password Management
              </h2>
              <p className="text-xs text-zinc-400">
                Update your login credentials. We verify your current password before committing changes.
              </p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Current Password */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-medium text-zinc-300">Current Password</label>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="bg-zinc-900/60 border-zinc-800 text-xs pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                    tabIndex={-1}
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-medium text-zinc-300">New Password</label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="bg-zinc-900/60 border-zinc-800 text-xs pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-medium text-zinc-300">Confirm New Password</label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="bg-zinc-900/60 border-zinc-800 text-xs pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
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
                  <span className="text-zinc-500">Password Strength:</span>
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

            <div className="flex items-center justify-between pt-3 border-t border-zinc-900">
              <span className="text-[11px] text-zinc-500 font-mono">
                Must be at least 8 characters with 1 uppercase & 1 number
              </span>

              <Button
                type="submit"
                variant="outline"
                disabled={isChangingPassword || !newPassword || !currentPassword}
                className="text-xs rounded-xl px-5 gap-1.5 hover:border-amber-500/40 hover:text-amber-400"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>{isChangingPassword ? "Updating..." : "Update Password"}</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* 3. Automated WhatsApp Notification Engine */}
      <div className="rounded-[2rem] p-1.5 bg-white/5 border border-white/10 ring-1 ring-white/5 shadow-xl">
        <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-950 p-6 md:p-8">
          <div className="flex items-center justify-between pb-5 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span>WhatsApp Deadline Alert Engine</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    T-24h &bull; T-2h Triggers
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Automated high-priority pings sent directly to your phone before portal submissions close.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveAlerts} className="mt-6 space-y-5">
            <div className="space-y-1.5 max-w-md">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-zinc-400" />
                <span>WhatsApp Phone Number (with Country Code)</span>
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+14155552671 or +919876543210"
                required
                className="bg-zinc-900/60 border-zinc-800 text-xs font-mono"
              />
              <p className="text-[11px] text-zinc-400 font-mono">
                Supports all formats: <code className="text-zinc-300">+91 9876543210</code>, <code className="text-zinc-300">+919876543210</code>, or standard 10-digit <code className="text-zinc-300">9876543210</code>.
              </p>
            </div>

            {/* Checkbox triggers */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/70 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enableT24}
                  onChange={(e) => setEnableT24(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-700 bg-zinc-950 text-indigo-500 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">
                    T-24h Emergency Warning (24 Hours Remaining)
                  </span>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    Alerts the team to lock in code features, initiate slide deck drafts, and verify teammate registrations.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/70 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enableT2}
                  onChange={(e) => setEnableT2(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-700 bg-zinc-950 text-indigo-500 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">
                    T-2h Final Code Freeze Alert (2 Hours Remaining)
                  </span>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    Final urgent call to push main branch, make repos public, upload Loom demo, and submit to portal.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-850">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestWhatsApp}
                disabled={isTestingWhatsApp}
                className="text-xs rounded-xl gap-1.5"
              >
                <Send className="h-3.5 w-3.5 text-emerald-400" />
                <span>{isTestingWhatsApp ? "Dispatching..." : "Send Test WhatsApp Alert"}</span>
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSavingAlerts}
                className="text-xs rounded-xl px-5"
              >
                {isSavingAlerts ? "Saving..." : "Save Notification Preferences"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* 4. Pre-Flight Verification Gate Rules */}
      {activeTeam && (
        <div className="rounded-[2rem] p-1.5 bg-white/5 border border-white/10 ring-1 ring-white/5 shadow-xl">
          <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-950 p-6 md:p-8">
            <div className="flex items-center justify-between pb-5 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Pre-Flight Submission Gate Configuration
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Mandatory checks enforced on the main dashboard for squad: {activeTeam.name}.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {checklistItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 text-xs"
                >
                  <span className="text-zinc-300 font-medium">{item.title}</span>
                  {item.item_key.startsWith("custom_") && (
                    <button
                      onClick={() => handleDeleteGate(item.id, item.title)}
                      className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title="Delete checkpoint"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add new gate */}
            <form onSubmit={handleAddGate} className="mt-4 flex items-center gap-2">
              <Input
                value={newGateTitle}
                onChange={(e) => setNewGateTitle(e.target.value)}
                placeholder="Add custom pre-flight checkpoint..."
                className="bg-zinc-900/60 border-zinc-800 text-xs"
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={isAddingGate || !newGateTitle.trim()}
                className="text-xs rounded-xl shrink-0 gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Gate</span>
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
