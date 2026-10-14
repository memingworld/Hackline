"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface TelegramSettingsPayload {
  chatId?: string;
  enableT24: boolean;
  enableT2: boolean;
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

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, telegram_chat_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: "Profile not found." };
    }

    const targetChatId = customChatId?.trim() || profile.telegram_chat_id;

    if (!targetChatId) {
      return {
        success: false,
        error: "No Telegram Chat ID found. Click 'Connect via Telegram' or enter a Chat ID first.",
      };
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return {
        success: false,
        error: "TELEGRAM_BOT_TOKEN is not configured in Vercel / environment variables.",
      };
    }

    const userName = profile.full_name || "Developer";

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
