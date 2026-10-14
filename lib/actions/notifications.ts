"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface TelegramSettingsPayload {
  teamId: string;
  chatId?: string;
  enableT24: boolean;
  enableT2: boolean;
}

/**
 * Save Telegram notification settings and alert preferences for a squad.
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

    if (!payload.teamId) {
      return { success: false, error: "Active squad not found." };
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
      .from("teams")
      .update(updatePayload)
      .eq("id", payload.teamId);

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
 * Disconnect Telegram notifications from a squad.
 */
export async function disconnectTelegram(teamId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const { error } = await supabase
      .from("teams")
      .update({
        telegram_chat_id: null,
        telegram_connected_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", teamId);

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
export async function sendTestTelegramNotification(teamId: string, customChatId?: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    // Fetch team info
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id, name, telegram_chat_id, hackathon:hackathons(id, title)")
      .eq("id", teamId)
      .single();

    if (teamError || !team) {
      return { success: false, error: "Squad not found." };
    }

    const targetChatId = customChatId?.trim() || team.telegram_chat_id;

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

    const teamName = team.name || "Your Squad";
    const hackathonTitle = (team.hackathon as any)?.title || "Upcoming Hackathon";

    const message = `🚨 *Hackline Alert [TEST DISPATCH]* 🚨\n\nSquad: *${teamName}*\nEvent: *${hackathonTitle}*\n\n✅ Your Telegram notification channel is active! Your squad will receive automated T-24h and T-2h alerts before portal submission closes.`;

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

    // Log the successful notification in database if table exists
    if ((team.hackathon as any)?.id) {
      await supabase.from("telegram_notifications").insert({
        team_id: team.id,
        hackathon_id: (team.hackathon as any).id,
        trigger_type: "test",
        message_text: message,
        status: "sent",
        telegram_message_id: data?.result?.message_id ? String(data.result.message_id) : null,
      });
    }

    return {
      success: true,
      message: `Test alert dispatched to Telegram chat (${targetChatId})!`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to send test alert.",
    };
  }
}
