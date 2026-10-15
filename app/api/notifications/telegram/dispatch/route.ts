import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { constantTimeCompare } from "@/lib/security";
import { formatNotificationDeadline } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const isProd = process.env.NODE_ENV === "production";

    // Verify CRON authorization in production if CRON_SECRET is configured
    if (cronSecret) {
      const authHeader = req.headers.get("authorization") || "";
      const expected = `Bearer ${cronSecret}`;
      const urlSecret = req.nextUrl.searchParams.get("secret");

      const isHeaderValid = constantTimeCompare(authHeader, expected);
      const isQueryValid = urlSecret && constantTimeCompare(urlSecret, cronSecret);

      if (!isHeaderValid && !isQueryValid) {
        return NextResponse.json(
          { success: false, error: "Unauthorized: Missing or invalid authorization token." },
          { status: 401 }
        );
      }
    } else if (isProd) {
      // In production without CRON_SECRET, allow internal in-app ping or Vercel Cron user agent
      const internalHeader = req.headers.get("x-internal-dispatch");
      const userAgent = req.headers.get("user-agent") || "";
      const isVercelCron = userAgent.toLowerCase().includes("vercel-cron");
      if (!internalHeader && !isVercelCron) {
        return NextResponse.json(
          { success: false, error: "CRON_SECRET must be configured in production." },
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
    const nowTime = now.getTime();
    let dispatchedCount = 0;

    // Helper to send message and record idempotency
    const sendNotification = async (
      profile: { id: string; full_name?: string | null; telegram_chat_id: string },
      hackathonId: string,
      triggerKey: string,
      messageText: string
    ) => {
      // Check if already sent
      const { data: existing } = await supabase
        .from("telegram_notifications")
        .select("id")
        .eq("user_id", profile.id)
        .eq("trigger_type", triggerKey)
        .limit(1);

      if (existing && existing.length > 0) return false;

      // Dispatch Telegram Bot DM
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: profile.telegram_chat_id,
          text: messageText,
          parse_mode: "Markdown",
        }),
      });

      const resData = await res.json();

      await supabase.from("telegram_notifications").insert({
        user_id: profile.id,
        hackathon_id: hackathonId,
        trigger_type: triggerKey as any,
        message_text: messageText,
        status: res.ok ? "sent" : "failed",
        telegram_message_id: resData?.result?.message_id ? String(resData.result.message_id) : null,
        error_message: res.ok ? null : resData?.description || "Dispatch failed",
      });

      return res.ok;
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Process Timeline Milestone Gates (timeline_events)
    // ─────────────────────────────────────────────────────────────────────────
    const { data: timelineEvents } = await supabase
      .from("timeline_events")
      .select(`
        id,
        hackathon_id,
        team_id,
        title,
        deadline,
        is_completed,
        event_type,
        hackathon:hackathons(id, title)
      `)
      .eq("is_completed", false);

    if (timelineEvents && timelineEvents.length > 0) {
      for (const ev of timelineEvents) {
        if (!ev.deadline) continue;

        const deadlineTime = new Date(ev.deadline).getTime();
        if (isNaN(deadlineTime)) continue;

        const hoursRemaining = (deadlineTime - nowTime) / (1000 * 60 * 60);

        // Determine trigger window
        let triggerWindow: "T-24h" | "T-2h" | "overdue" | null = null;
        if (hoursRemaining <= 24 && hoursRemaining > 2) {
          triggerWindow = "T-24h";
        } else if (hoursRemaining <= 2 && hoursRemaining > 0) {
          triggerWindow = "T-2h";
        } else if (hoursRemaining <= 0 && hoursRemaining >= -6) {
          // Passed within the last 6 hours
          triggerWindow = "overdue";
        }

        if (!triggerWindow) continue;

        const triggerKey = `milestone_${ev.id}_${triggerWindow}`;
        const hackathonTitle = (ev.hackathon as any)?.title || "Hackathon Sprint";
        const cleanTitle = ev.title.replace(/\[@.*?\]/, "").trim();

        // Target recipients: team members or hackathon creators
        let candidateProfiles: any[] = [];

        if (ev.team_id) {
          const { data: teamData } = await supabase
            .from("teams")
            .select(`
              name,
              members:team_members(
                user:profiles(id, full_name, telegram_chat_id, phone_number, notify_t24, notify_t2)
              )
            `)
            .eq("id", ev.team_id)
            .maybeSingle();

          if (teamData?.members) {
            candidateProfiles = teamData.members.map((m: any) => ({
              ...m.user,
              teamName: teamData.name,
            }));
          }
        }

        if (candidateProfiles.length === 0) {
          // Fallback: Fetch all teams in this hackathon
          const { data: hackathonTeams } = await supabase
            .from("teams")
            .select(`
              name,
              members:team_members(
                user:profiles(id, full_name, telegram_chat_id, phone_number, notify_t24, notify_t2)
              )
            `)
            .eq("hackathon_id", ev.hackathon_id);

          (hackathonTeams || []).forEach((t: any) => {
            (t.members || []).forEach((m: any) => {
              if (m.user) {
                candidateProfiles.push({ ...m.user, teamName: t.name });
              }
            });
          });
        }

        for (const profile of candidateProfiles) {
          if (!profile || !profile.telegram_chat_id) continue;

          // Check user preferences
          if (triggerWindow === "T-24h" && profile.notify_t24 === false) continue;
          if (triggerWindow === "T-2h" && profile.notify_t2 === false) continue;

          const userName = profile.full_name || "Builder";
          const timeInfo = formatNotificationDeadline(ev.deadline, {
            phoneNumber: profile.phone_number,
            referenceTimeMs: nowTime,
          });

          let message = "";

          if (triggerWindow === "T-24h") {
            message = `⚠️ *Hackline Milestone Alert [T-24h]*\n\nHey *${userName}*!\n\n24 hours remaining for milestone *"${cleanTitle}"* on *${hackathonTitle}*!\n\n📅 Target Deadline: *${timeInfo.localizedDateTime}*\n⏳ Status: *${timeInfo.countdownText}*\n\n• Finalize core tasks & test deliverables\n• Check off submission gates in your dashboard`;
          } else if (triggerWindow === "T-2h") {
            message = `🚨 *Hackline Final Sprint Warning [T-2h]*\n\nHey *${userName}*!\n\nFINAL 2 HOURS for milestone *"${cleanTitle}"* on *${hackathonTitle}*!\n\n📅 Target Deadline: *${timeInfo.localizedDateTime}*\n⏳ Status: *${timeInfo.countdownText}*\n\n1️⃣ Freeze code and push commits\n2️⃣ Verify video demo and slide deck links\n3️⃣ Complete pre-flight checklist gates`;
          } else if (triggerWindow === "overdue") {
            message = `⏰ *Hackline Gate Alert [OVERDUE]*\n\nHey *${userName}*!\n\nThe deadline for milestone *"${cleanTitle}"* on *${hackathonTitle}* has elapsed!\n\n📅 Target Deadline: *${timeInfo.localizedDateTime}*\n⏳ Status: *${timeInfo.countdownText}*\n\nVerify your submission portal status and ensure all deliverable links are active in the Asset Hub!`;
          }

          const sent = await sendNotification(profile, ev.hackathon_id, triggerKey, message);
          if (sent) dispatchedCount++;
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Process Overall Hackathon End Deadlines (hackathons.ends_at)
    // ─────────────────────────────────────────────────────────────────────────
    const { data: hackathons } = await supabase
      .from("hackathons")
      .select("id, title, ends_at")
      .gt("ends_at", new Date(nowTime - 6 * 60 * 60 * 1000).toISOString());

    if (hackathons && hackathons.length > 0) {
      for (const hackathon of hackathons) {
        if (!hackathon.ends_at) continue;

        const endsAt = new Date(hackathon.ends_at).getTime();
        if (isNaN(endsAt)) continue;

        const hoursRemaining = (endsAt - nowTime) / (1000 * 60 * 60);

        let triggerWindow: "T-24h" | "T-2h" | "overdue" | null = null;
        if (hoursRemaining <= 24 && hoursRemaining > 2) {
          triggerWindow = "T-24h";
        } else if (hoursRemaining <= 2 && hoursRemaining > 0) {
          triggerWindow = "T-2h";
        } else if (hoursRemaining <= 0 && hoursRemaining >= -6) {
          triggerWindow = "overdue";
        }

        if (!triggerWindow) continue;

        const triggerKey = `hackathon_${hackathon.id}_${triggerWindow}`;

        const { data: teams } = await supabase
          .from("teams")
          .select(`
            name,
            members:team_members(
              user:profiles(id, full_name, telegram_chat_id, phone_number, notify_t24, notify_t2)
            )
          `)
          .eq("hackathon_id", hackathon.id);

        const processedUserIds = new Set<string>();

        for (const team of teams || []) {
          for (const member of (team.members as any[]) || []) {
            const profile = member.user;
            if (!profile || !profile.telegram_chat_id) continue;
            if (processedUserIds.has(profile.id)) continue;
            processedUserIds.add(profile.id);

            if (triggerWindow === "T-24h" && profile.notify_t24 === false) continue;
            if (triggerWindow === "T-2h" && profile.notify_t2 === false) continue;

            const userName = profile.full_name || "Builder";
            const timeInfo = formatNotificationDeadline(hackathon.ends_at, {
              phoneNumber: profile.phone_number,
              referenceTimeMs: nowTime,
            });

            let message = "";

            if (triggerWindow === "T-24h") {
              message = `⚠️ *Hackline Urgent Alert [T-24h Remaining]*\n\nHey *${userName}*!\n\n24 hours remain until submission portal closes for *${hackathon.title}* (Squad: *${team.name}*)!\n\n📅 Final Deadline: *${timeInfo.localizedDateTime}*\n⏳ Status: *${timeInfo.countdownText}*\n\n• Finalize core feature branches\n• Prepare demo video link & pitch deck\n• Verify all team members are registered in portal`;
            } else if (triggerWindow === "T-2h") {
              message = `🚨 *Hackline Code Freeze Warning [T-2h Remaining]*\n\nHey *${userName}*!\n\nFINAL 2 HOURS for *${hackathon.title}* (Squad: *${team.name}*)!\n\n📅 Final Deadline: *${timeInfo.localizedDateTime}*\n⏳ Status: *${timeInfo.countdownText}*\n\n1️⃣ Push main branch & make GitHub repo public\n2️⃣ Upload Loom/YouTube demo & test permissions\n3️⃣ Complete pre-flight checklist gates & submit before portal closes!`;
            } else if (triggerWindow === "overdue") {
              message = `🏁 *Hackline Sprint Concluded*\n\nHey *${userName}*!\n\nThe submission window for *${hackathon.title}* has concluded!\n\n📅 Concluded At: *${timeInfo.localizedDateTime}*\n⏳ Status: *${timeInfo.countdownText}*\n\nReview judging criteria, track submissions, and celebrate with your squad!`;
            }

            const sent = await sendNotification(profile, hackathon.id, triggerKey, message);
            if (sent) dispatchedCount++;
          }
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
