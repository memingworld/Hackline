"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { formatNotificationDeadline } from "@/lib/utils";
import { escapeTelegramMarkdown, generateTelegramConnectToken } from "@/lib/security";

export interface TelegramSettingsPayload {
  chatId?: string;
  enableT24: boolean;
  enableT2: boolean;
}

/**
 * Generates an HMAC-signed, time-bounded Telegram bot connection URL for the authenticated user.
 */
export async function getTelegramConnectLink(): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const token = generateTelegramConnectToken(user.id);
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "HacklineAlertsBot";
    const url = `https://t.me/${botUsername}?start=${token}`;

    return { success: true, url };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to generate connection link." };
  }
}

/**
 * Save personal Telegram notification settings and alert preferences on user profile.
 */
export async function saveTelegramSettings(payload: TelegramSettingsPayload) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const cleanChatId = payload.chatId?.trim() || null;

    const updatePayload: Record<string, any> = {
      notify_t24: payload.enableT24,
      notify_t2: payload.enableT2,
      updated_at: new Date().toISOString(),
    };

    if (cleanChatId) {
      updatePayload.telegram_chat_id = cleanChatId;
      updatePayload.telegram_connected_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save Telegram settings." };
  }
}

/**
 * Disconnect personal Telegram notifications from user profile.
 */
export async function disconnectTelegram() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        telegram_chat_id: null,
        telegram_connected_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to disconnect Telegram." };
  }
}

/**
 * Dispatch an instant test Telegram notification to verify connectivity.
 * Rate-limited and restricted exclusively to the authenticated user's own linked chat ID.
 */
export async function sendTestTelegramNotification(customChatId?: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    // Rate-limiting check: prevent notification spamming
    const recentWindow = new Date(Date.now() - 20000).toISOString();
    const { data: recentDispatches } = await supabase
      .from("telegram_notifications")
      .select("id")
      .eq("user_id", user.id)
      .eq("trigger_type", "test")
      .gte("created_at", recentWindow)
      .limit(1);

    if (recentDispatches && recentDispatches.length > 0) {
      return {
        success: false,
        error: "Rate limit reached. Please wait 20 seconds before dispatching another test alert.",
      };
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, telegram_chat_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: "Profile not found." };
    }

    // Target chat must strictly be the user's registered chat ID to prevent abuse against third parties
    const targetChatId = profile.telegram_chat_id;

    if (!targetChatId) {
      return {
        success: false,
        error: "No verified Telegram Chat ID found. Please connect your Telegram account first.",
      };
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return {
        success: false,
        error: "TELEGRAM_BOT_TOKEN is not configured in live deployment.",
      };
    }

    const userName = escapeTelegramMarkdown(profile.full_name || "Developer");

    const message = `🚨 *Hackline Alert [TEST DISPATCH]* 🚨\n\nHey *${userName}*!\n\n✅ Your personal Telegram notification pipeline is active! You will receive high-priority direct alerts on your phone at T-24h and T-2h before any of your hackathon submission gates close.`;

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.description || "Failed to dispatch Telegram message.",
      };
    }

    // Log the successful notification in database
    await supabase.from("telegram_notifications").insert({
      user_id: user.id,
      trigger_type: "test",
      message_text: message,
      status: "sent",
      telegram_message_id: data?.result?.message_id ? String(data.result.message_id) : null,
    });

    return {
      success: true,
      message: `Test alert dispatched to your Telegram chat (${targetChatId})!`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to send test alert.",
    };
  }
}

/**
 * Dispatch rich instant Telegram DMs to verified squad members upon hackathon deployment.
 * Never throws errors or breaks execution if bot token is missing or if members lack accounts.
 */
export async function notifySquadDeployment(params: {
  teamId: string;
  hackathonId: string;
  hackathonTitle: string;
  sourcePlatform?: string;
  sourceUrl?: string | null;
  endsAt: string;
  captainName: string;
  squadName: string;
  deployedMembers: Array<{
    userId?: string | null;
    name: string;
    email: string;
    duty: string;
  }>;
}) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return { success: true, notifiedCount: 0 };
    }

    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    // Only target registered members who are not the captain themselves
    const candidateUserIds = params.deployedMembers
      .filter((m) => m.userId && m.userId !== currentUser?.id)
      .map((m) => m.userId as string);

    if (candidateUserIds.length === 0) {
      return { success: true, notifiedCount: 0 };
    }

    // Fetch teammate profiles to get telegram_chat_id
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, telegram_chat_id")
      .in("id", candidateUserIds);

    if (!profiles || profiles.length === 0) {
      return { success: true, notifiedCount: 0 };
    }

    const appBaseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://hackline.hartimeerror.xyz");

    const timeInfo = formatNotificationDeadline(params.endsAt, {
      referenceTimeMs: Date.now(),
    });

    let notifiedCount = 0;

    for (const profile of profiles) {
      if (!profile.telegram_chat_id) continue;

      const memberDuty =
        params.deployedMembers.find((m) => m.userId === profile.id)?.duty ||
        "Core Contributor";

      const safeCaptain = escapeTelegramMarkdown(params.captainName);
      const safeSquad = escapeTelegramMarkdown(params.squadName);
      const safeHackathon = escapeTelegramMarkdown(params.hackathonTitle);
      const safeMember = escapeTelegramMarkdown(profile.full_name || "Builder");
      const safeDuty = escapeTelegramMarkdown(memberDuty);
      const safePlatform = escapeTelegramMarkdown(params.sourcePlatform || "Sprint");

      const message =
        `🚀 *Hackline Sprint Deployment!* 🚀\n\n` +
        `Hey *${safeMember}*!\n\n` +
        `*[Captain ${safeCaptain}]* has deployed your squad (*${safeSquad}*) to:\n` +
        `🏆 *${safeHackathon}* (${safePlatform.toUpperCase()})\n\n` +
        `🎯 *Your Assigned Role:* \`${safeDuty}\`\n` +
        `⏳ *Submission Deadline:* ${timeInfo.displayString}\n\n` +
        `Your workspace, deliverables tracker, and pre-flight checklist are live. Tap below to inspect!`;

      const inlineKeyboard: any[] = [
        [
          {
            text: "🌐 Open Sprint Workspace",
            url: `${appBaseUrl}/dashboard/hackathons/${params.hackathonId}`,
          },
        ],
      ];

      if (params.sourceUrl) {
        inlineKeyboard.push([
          {
            text: "📋 Official Event Portal",
            url: params.sourceUrl,
          },
        ]);
      }

      try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: profile.telegram_chat_id,
            text: message,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: inlineKeyboard,
            },
          }),
        });

        const data = await res.json();
        if (res.ok) {
          notifiedCount++;
          // Log notification in database
          await supabase.from("telegram_notifications").insert({
            user_id: profile.id,
            team_id: params.teamId,
            hackathon_id: params.hackathonId,
            trigger_type: "deployment",
            message_text: message,
            status: "sent",
            telegram_message_id: data?.result?.message_id
              ? String(data.result.message_id)
              : null,
          });
        }
      } catch (sendErr) {
        console.error(`[Telegram Dispatch] Error pinging user ${profile.id}:`, sendErr);
      }
    }

    return { success: true, notifiedCount };
  } catch (err: any) {
    console.error("[Telegram Dispatch] Error in notifySquadDeployment:", err);
    return { success: false, error: err.message, notifiedCount: 0 };
  }
}

/**
 * Dispatch Telegram Bot DM when a teammate is assigned to a specific round / deadline.
 */
export async function notifyTeammateAssignment(params: {
  hackathonId: string;
  hackathonTitle: string;
  taskTitle: string;
  deadline: string;
  captainName: string;
  assignedUserId?: string | null;
  assignedName: string;
}) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken || !params.assignedUserId) {
      return { success: true, notified: false };
    }

    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, telegram_chat_id")
      .eq("id", params.assignedUserId)
      .maybeSingle();

    if (!profile || !profile.telegram_chat_id) {
      return { success: true, notified: false };
    }

    const appBaseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://hackline.hartimeerror.xyz");

    const timeInfo = formatNotificationDeadline(params.deadline, {
      referenceTimeMs: Date.now(),
    });

    const safeCaptain = escapeTelegramMarkdown(params.captainName);
    const safeHackathon = escapeTelegramMarkdown(params.hackathonTitle);
    const safeTask = escapeTelegramMarkdown(params.taskTitle);
    const safeName = escapeTelegramMarkdown(profile.full_name || params.assignedName);

    const message =
      `🎯 *Hackline Milestone Assigned!* 🎯\n\n` +
      `Hey *${safeName}*!\n\n` +
      `*[Captain ${safeCaptain}]* assigned you to an upcoming sprint milestone in:\n` +
      `🏆 *${safeHackathon}*\n\n` +
      `📌 *Milestone:* \`${safeTask}\`\n` +
      `⏳ *Target Deadline:* ${timeInfo.displayString}\n\n` +
      `Tap below to open your sprint workspace and track deliverables:`;

    const inlineKeyboard = [
      [
        {
          text: "🌐 Open Sprint Workspace",
          url: `${appBaseUrl}/dashboard/hackathons/${params.hackathonId}`,
        },
      ],
    ];

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: profile.telegram_chat_id,
        text: message,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      try {
        await supabase.from("telegram_notifications").insert({
          user_id: profile.id,
          hackathon_id: params.hackathonId,
          trigger_type: "task_assignment",
          message_text: message,
          status: "sent",
          telegram_message_id: data?.result?.message_id ? String(data.result.message_id) : null,
        });
      } catch {
        // Safe if table not yet migrated
      }
      return { success: true, notified: true };
    }

    return { success: true, notified: false };
  } catch (err: any) {
    console.error("[Telegram Dispatch] Error in notifyTeammateAssignment:", err);
    return { success: false, error: err.message, notified: false };
  }
}

