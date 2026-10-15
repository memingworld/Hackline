import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { constantTimeCompare, sanitizePlainText } from "@/lib/security";

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      first_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      title?: string;
      type: string;
    };
    text?: string;
  };
}

async function sendTelegramMessage(botToken: string, chatId: number | string, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });
  } catch (err) {
    console.error("[Telegram Webhook] Failed to send Telegram reply:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify Telegram secret token to prevent spoofed webhook payloads
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (webhookSecret) {
      const incomingSecret = req.headers.get("x-telegram-bot-api-secret-token") || "";
      if (!constantTimeCompare(incomingSecret, webhookSecret)) {
        return NextResponse.json(
          { success: false, error: "Unauthorized: Invalid secret token." },
          { status: 401 }
        );
      }
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.warn("[Telegram Webhook] TELEGRAM_BOT_TOKEN is not configured.");
      return NextResponse.json({ ok: true });
    }

    const body: TelegramUpdate = await req.json();
    const message = body.message;

    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const rawText = message.text.trim();
    const supabase = createAdminClient();

    // 1. Handle 1-Click User Profile Connect: /start <user_id>
    if (rawText.startsWith("/start")) {
      const parts = rawText.split(" ");
      const userId = parts.length > 1 ? parts[1].trim() : null;

      if (userId) {
        // Query user profile from Supabase
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("id", userId)
          .single();

        if (profileError || !profile) {
          await sendTelegramMessage(
            botToken,
            chatId,
            `⚠️ *Account Not Found*\n\nCould not find a user profile with ID \`${userId}\`. Please verify your connection link in the Hackline dashboard.`
          );
          return NextResponse.json({ ok: true });
        }

        // Link profile to this Telegram chat
        await supabase
          .from("profiles")
          .update({
            telegram_chat_id: String(chatId),
            telegram_connected_at: new Date().toISOString(),
          })
          .eq("id", profile.id);

        const userName = profile.full_name || "Developer";

        await sendTelegramMessage(
          botToken,
          chatId,
          `🚀 *Hackline Connected!*\n\nHey *${userName}*! Your personal Telegram account is now linked to Hackline.\n\nWhenever any hackathon you participate in approaches its submission deadline (*T-24h* and *T-2h*), you will receive a direct 1-on-1 private alert right here on your phone.\n\nKeep building and stay locked in! 🔥`
        );

        return NextResponse.json({ ok: true });
      }

      // /start without user ID
      await sendTelegramMessage(
        botToken,
        chatId,
        `👋 *Welcome to Hackline Alert Bot!*\n\nTo link your personal account for automated deadline countdown warnings:\n\n1️⃣ Open your **Hackline Dashboard** $\\rightarrow$ **Settings & Alerts**.\n2️⃣ Click **"Connect via Telegram"** with 1-click.\n\nYour Telegram Chat ID: \`${chatId}\``
      );
      return NextResponse.json({ ok: true });
    }

    // 2. Handle /status command
    if (rawText === "/status") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, telegram_connected_at")
        .eq("telegram_chat_id", String(chatId))
        .single();

      if (!profile) {
        await sendTelegramMessage(
          botToken,
          chatId,
          `ℹ️ No Hackline account is currently linked to this Telegram chat.\n\nChat ID: \`${chatId}\`\nLink your account via Hackline Settings & Alerts.`
        );
        return NextResponse.json({ ok: true });
      }

      await sendTelegramMessage(
        botToken,
        chatId,
        `🟢 *Hackline Status: Connected*\n\nAccount: *${profile.full_name || profile.email}*\n\nYour personal 1-on-1 deadline alerts (T-24h and T-2h) are active.`
      );
      return NextResponse.json({ ok: true });
    }

    // 3. Handle /disconnect command
    if (rawText === "/disconnect") {
      await supabase
        .from("profiles")
        .update({
          telegram_chat_id: null,
          telegram_connected_at: null,
        })
        .eq("telegram_chat_id", String(chatId));

      await sendTelegramMessage(
        botToken,
        chatId,
        `🔌 Your Hackline account has been disconnected from this Telegram chat. You will no longer receive deadline alerts here.`
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[Telegram Webhook] Error processing update:", err);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    service: "Hackline Telegram User Webhook Receiver",
    timestamp: new Date().toISOString(),
  });
}
