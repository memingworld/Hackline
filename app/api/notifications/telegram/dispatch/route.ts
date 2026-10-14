import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { success: false, error: "TELEGRAM_BOT_TOKEN is not configured." },
        { status: 500 }
      );
    }

    const supabase = createAdminClient();
    const now = new Date();

    // Query teams that have connected a Telegram chat and have an associated hackathon
    const { data: teams, error } = await supabase
      .from("teams")
      .select(`
        id,
        name,
        telegram_chat_id,
        notify_t24,
        notify_t2,
        hackathon:hackathons(
          id,
          title,
          ends_at
        )
      `)
      .not("telegram_chat_id", "is", null);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!teams || teams.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No squads with connected Telegram chats found.",
        dispatched: 0,
      });
    }

    let dispatchedCount = 0;

    for (const team of teams) {
      const hackathon = team.hackathon as any;
      if (!hackathon || !hackathon.ends_at) continue;

      const endsAt = new Date(hackathon.ends_at).getTime();
      const nowTime = now.getTime();

      // Only check hackathons that haven't expired yet
      if (nowTime > endsAt) continue;

      const hoursRemaining = (endsAt - nowTime) / (1000 * 60 * 60);

      // Check T-24h trigger (between 2h and 24h remaining)
      if (team.notify_t24 !== false && hoursRemaining <= 24 && hoursRemaining > 2) {
        // Check if already dispatched
        const { data: existing } = await supabase
          .from("telegram_notifications")
          .select("id")
          .eq("team_id", team.id)
          .eq("hackathon_id", hackathon.id)
          .eq("trigger_type", "T-24h")
          .limit(1);

        if (!existing || existing.length === 0) {
          const message = `⚠️ *Hackline Urgent Alert [T-24h Remaining]*\n\nSquad: *${team.name}*\nEvent: *${hackathon.title}*\n\n24 hours remain until submission portal closes!\n• Finalize core features\n• Begin presentation deck & architecture diagram\n• Verify teammate registrations in portal`;

          const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: team.telegram_chat_id,
              text: message,
              parse_mode: "Markdown",
            }),
          });

          const resData = await res.json();

          await supabase.from("telegram_notifications").insert({
            team_id: team.id,
            hackathon_id: hackathon.id,
            trigger_type: "T-24h",
            message_text: message,
            status: res.ok ? "sent" : "failed",
            telegram_message_id: resData?.result?.message_id ? String(resData.result.message_id) : null,
            error_message: res.ok ? null : resData?.description || "Dispatch failed",
          });

          if (res.ok) dispatchedCount++;
        }
      }

      // Check T-2h trigger (within final 2 hours)
      if (team.notify_t2 !== false && hoursRemaining <= 2 && hoursRemaining > 0) {
        const { data: existing } = await supabase
          .from("telegram_notifications")
          .select("id")
          .eq("team_id", team.id)
          .eq("hackathon_id", hackathon.id)
          .eq("trigger_type", "T-2h")
          .limit(1);

        if (!existing || existing.length === 0) {
          const message = `🚨 *Hackline Code Freeze Warning [T-2h Remaining]*\n\nSquad: *${team.name}*\nEvent: *${hackathon.title}*\n\nFINAL 2 HOURS! Portal closing imminently:\n1️⃣ Push main branch & make GitHub repo public\n2️⃣ Upload Loom demo video & verify permissions\n3️⃣ Complete pre-flight checklist gates & submit early!`;

          const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: team.telegram_chat_id,
              text: message,
              parse_mode: "Markdown",
            }),
          });

          const resData = await res.json();

          await supabase.from("telegram_notifications").insert({
            team_id: team.id,
            hackathon_id: hackathon.id,
            trigger_type: "T-2h",
            message_text: message,
            status: res.ok ? "sent" : "failed",
            telegram_message_id: resData?.result?.message_id ? String(resData.result.message_id) : null,
            error_message: res.ok ? null : resData?.description || "Dispatch failed",
          });

          if (res.ok) dispatchedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      dispatched: dispatchedCount,
      evaluated_teams: teams.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process dispatches" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
