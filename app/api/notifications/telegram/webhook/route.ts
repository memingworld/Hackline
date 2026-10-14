import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

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
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.warn("[Telegram Webhook] TELEGRAM_BOT_TOKEN is not configured.");
      return NextResponse.json({ ok: true }); // Always return 200 to Telegram
    }

    const body: TelegramUpdate = await req.json();
    const message = body.message;

    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const rawText = message.text.trim();
    const supabase = createAdminClient();

    // 1. Handle 1-Click Squad Connect: /start <team_id>
    if (rawText.startsWith("/start")) {
      const parts = rawText.split(" ");
      const teamId = parts.length > 1 ? parts[1].trim() : null;

      if (teamId) {
        // Query team from Supabase
        const { data: team, error: teamError } = await supabase
          .from("teams")
          .select("id, name, hackathon:hackathons(title, ends_at)")
          .eq("id", teamId)
          .single();

        if (teamError || !team) {
          await sendTelegramMessage(
            botToken,
            chatId,
            `⚠️ *Squad Not Found*\n\nCould not find a squad with ID \`${teamId}\`. Please check your team link in the Hackline dashboard.`
          );
          return NextResponse.json({ ok: true });
        }

        // Link team to this Telegram chat
        await supabase
          .from("teams")
          .update({
            telegram_chat_id: String(chatId),
            telegram_connected_at: new Date().toISOString(),
          })
          .eq("id", team.id);

        const hackathonTitle = (team.hackathon as any)?.title || "your active hackathon";

        await sendTelegramMessage(
          botToken,
          chatId,
          `🚀 *Hackline Command Center Linked!*\n\nSquad: *${team.name}*\nEvent: *${hackathonTitle}*\n\n✅ This chat is now connected to your Hackline workspace. Automated *T-24h* and *T-2h* submission deadline alerts will be dispatched here for your entire squad.\n\nKeep building and stay locked in!`
        );

        return NextResponse.json({ ok: true });
      }

      // /start without team ID
      await sendTelegramMessage(
        botToken,
        chatId,
        `👋 *Welcome to Hackline Alert Bot!*\n\nTo link your hackathon squad for automated deadline countdown warnings:\n\n1️⃣ Open your **Hackline Dashboard** $\\rightarrow$ **Settings & Alerts**.\n2️⃣ Click **"Connect via Telegram"** with 1-click.\n\nYour Telegram Chat ID: \`${chatId}\``
      );
      return NextResponse.json({ ok: true });
    }

    // 2. Handle /status command
    if (rawText === "/status") {
      const { data: teams } = await supabase
        .from("teams")
        .select("id, name, telegram_connected_at, hackathon:hackathons(title, ends_at)")
        .eq("telegram_chat_id", String(chatId));

      if (!teams || teams.length === 0) {
        await sendTelegramMessage(
          botToken,
          chatId,
          `ℹ️ No Hackline squads are currently linked to this chat.\n\nChat ID: \`${chatId}\`\nLink your squad via the Hackline Settings dashboard.`
        );
        return NextResponse.json({ ok: true });
      }

      const teamList = teams
        .map((t) => {
          const title = (t.hackathon as any)?.title || "Hackathon";
          return `• *${t.name}* (${title})`;
        })
        .join("\n");

      await sendTelegramMessage(
        botToken,
        chatId,
        `🟢 *Hackline Squad Status: Connected*\n\nLinked Squads:\n${teamList}\n\nAutomated T-24h and T-2h alert pipelines are active.`
      );
      return NextResponse.json({ ok: true });
    }

    // 3. Handle /disconnect command
    if (rawText === "/disconnect") {
      await supabase
        .from("teams")
        .update({
          telegram_chat_id: null,
          telegram_connected_at: null,
        })
        .eq("telegram_chat_id", String(chatId));

      await sendTelegramMessage(
        botToken,
        chatId,
        `🔌 Squad disconnected from this Telegram chat. You will no longer receive Hackline deadline alerts here.`
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[Telegram Webhook] Error processing update:", err);
    return NextResponse.json({ ok: true }); // Always 200 so Telegram doesn't retry infinitely on error
  }
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    service: "Hackline Telegram Webhook Receiver",
    timestamp: new Date().toISOString(),
  });
}
