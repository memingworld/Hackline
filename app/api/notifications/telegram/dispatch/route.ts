import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    // Verify CRON authorization to prevent spamming notification dispatch
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { success: false, error: "Unauthorized: Missing or invalid authorization token." },
          { status: 401 }
        );
      }
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { success: false, error: "TELEGRAM_BOT_TOKEN is not configured." },
        { status: 500 }
      );
    }

    const supabase = createAdminClient();
    const now = new Date();

    // Query active hackathons that haven't ended yet
    const { data: hackathons, error: hackathonsError } = await supabase
      .from("hackathons")
      .select("id, title, ends_at")
      .gt("ends_at", now.toISOString());

    if (hackathonsError) {
      return NextResponse.json({ success: false, error: hackathonsError.message }, { status: 500 });
    }

    if (!hackathons || hackathons.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active hackathons found.",
        dispatched: 0,
      });
    }

    let dispatchedCount = 0;

    for (const hackathon of hackathons) {
      if (!hackathon.ends_at) continue;

      const endsAt = new Date(hackathon.ends_at).getTime();
      const nowTime = now.getTime();
      const hoursRemaining = (endsAt - nowTime) / (1000 * 60 * 60);

      const isT24Window = hoursRemaining <= 24 && hoursRemaining > 2;
      const isT2Window = hoursRemaining <= 2 && hoursRemaining > 0;

      if (!isT24Window && !isT2Window) continue;

      const triggerType = isT2Window ? "T-2h" : "T-24h";

      // Fetch all participating team members for this hackathon
      const { data: teams } = await supabase
        .from("teams")
        .select(`
          id,
          name,
          members:team_members(
            user:profiles(
              id,
              full_name,
              telegram_chat_id,
              notify_t24,
              notify_t2
            )
          )
        `)
        .eq("hackathon_id", hackathon.id);

      if (!teams || teams.length === 0) continue;

      // Collect all unique users in these teams
      const processedUserIds = new Set<string>();

      for (const team of teams) {
        const members = (team.members as any[]) || [];

        for (const member of members) {
          const profile = member.user;
          if (!profile || !profile.telegram_chat_id) continue;
          if (processedUserIds.has(profile.id)) continue; // Avoid duplicate DMs if user in multiple contexts
          processedUserIds.add(profile.id);

          // Check user preference
          if (triggerType === "T-24h" && profile.notify_t24 === false) continue;
          if (triggerType === "T-2h" && profile.notify_t2 === false) continue;

          // Check if notification already dispatched to this user for this hackathon & trigger
          const { data: existing } = await supabase
            .from("telegram_notifications")
            .select("id")
            .eq("user_id", profile.id)
            .eq("hackathon_id", hackathon.id)
            .eq("trigger_type", triggerType)
            .limit(1);

          if (existing && existing.length > 0) continue;

          const userName = profile.full_name || "Developer";

          let message = "";
          if (triggerType === "T-24h") {
            message = `⚠️ *Hackline Urgent Alert [T-24h Remaining]*\n\nHey *${userName}*!\n\n24 hours remain until submission portal closes for *${hackathon.title}* (Squad: *${team.name}*)!\n\n• Finalize core feature branches\n• Prepare demo video link & pitch deck\n• Verify all team members are registered in portal`;
          } else {
            message = `🚨 *Hackline Code Freeze Warning [T-2h Remaining]*\n\nHey *${userName}*!\n\nFINAL 2 HOURS for *${hackathon.title}*!\n\n1️⃣ Push main branch & make GitHub repo public\n2️⃣ Upload Loom/YouTube demo & test permissions\n3️⃣ Complete pre-flight checklist gates & submit before portal closes!`;
          }

          // Direct private DM to user's Telegram
          const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: profile.telegram_chat_id,
              text: message,
              parse_mode: "Markdown",
            }),
          });

          const resData = await res.json();

          await supabase.from("telegram_notifications").insert({
            user_id: profile.id,
            hackathon_id: hackathon.id,
            trigger_type: triggerType,
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
