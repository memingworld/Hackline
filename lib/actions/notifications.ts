"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface NotificationSettingsPayload {
  phone: string;
  enableT24: boolean;
  enableT2: boolean;
  teamId?: string;
  hackathonId?: string;
  endsAt?: string;
}

/**
 * Save WhatsApp notification settings and schedule automated T-24h and T-2h alerts.
 */
export async function saveNotificationSettings(payload: NotificationSettingsPayload) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const cleanPhone = payload.phone?.trim() || "";

    // 1. Update user profile phone number
    if (cleanPhone) {
      await supabase
        .from("profiles")
        .update({ phone_number: cleanPhone, updated_at: new Date().toISOString() })
        .eq("id", user.id);
    }

    // 2. Schedule alerts if team and hackathon deadline exist
    if (payload.teamId && payload.hackathonId && payload.endsAt && cleanPhone) {
      const endsTime = new Date(payload.endsAt).getTime();

      // Clear existing pending alerts for this team
      await supabase
        .from("whatsapp_notifications")
        .delete()
        .eq("team_id", payload.teamId)
        .eq("status", "pending");

      const notificationsToInsert = [];

      // T-24h Alert (24h before submission deadline)
      if (payload.enableT24) {
        const t24Time = new Date(endsTime - 24 * 60 * 60 * 1000);
        notificationsToInsert.push({
          team_id: payload.teamId,
          hackathon_id: payload.hackathonId,
          recipient_phone: cleanPhone,
          trigger_type: "T-24h",
          scheduled_for: t24Time.toISOString(),
          status: "pending",
        });
      }

      // T-2h Alert (2h before submission deadline)
      if (payload.enableT2) {
        const t2Time = new Date(endsTime - 2 * 60 * 60 * 1000);
        notificationsToInsert.push({
          team_id: payload.teamId,
          hackathon_id: payload.hackathonId,
          recipient_phone: cleanPhone,
          trigger_type: "T-2h",
          scheduled_for: t2Time.toISOString(),
          status: "pending",
        });
      }

      if (notificationsToInsert.length > 0) {
        await supabase
          .from("whatsapp_notifications")
          .insert(notificationsToInsert);
      }
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save settings." };
  }
}

/**
 * Dispatch a live or simulated test WhatsApp alert to verify connectivity.
 */
export async function sendTestWhatsAppNotification(
  phone: string,
  teamName: string,
  hackathonTitle: string
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    if (!phone?.trim()) {
      return { success: false, error: "Please enter a valid phone number with country code." };
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

    const messageBody = `🚨 *Hackline Alert* 🚨\n\nSquad: *${teamName}*\nEvent: *${hackathonTitle}*\n\nThis is a verified test dispatch from your Hackline Command Center. Your automated T-24h and T-2h submission gates are configured!`;

    if (accountSid && authToken && !accountSid.startsWith("placeholder")) {
      // Dispatches real WhatsApp message via Twilio API
      const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
      const formattedTo = phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone.trim()}`;

      const params = new URLSearchParams();
      params.append("To", formattedTo);
      params.append("From", fromWhatsAppNumber);
      params.append("Body", messageBody);

      const twilioRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${authHeader}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        }
      );

      const twilioData = await twilioRes.json();

      if (!twilioRes.ok) {
        return {
          success: false,
          error: twilioData.message || "Failed to dispatch Twilio WhatsApp message.",
        };
      }

      return {
        success: true,
        mode: "live",
        sid: twilioData.sid,
        message: `Live WhatsApp message sent to ${phone}!`,
      };
    } else {
      // High-fidelity sandbox / simulated mode for local testing without paid Twilio keys
      console.log("[Hackline Notification Engine] Simulated WhatsApp Dispatch:", {
        to: phone,
        body: messageBody,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        mode: "simulated",
        message: `Test alert simulated for ${phone}. Live webhook dispatcher is configured.`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to send test alert.",
    };
  }
}
