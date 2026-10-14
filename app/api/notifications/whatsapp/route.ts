import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Fetch pending notifications scheduled for now or earlier
    const { data: pendingNotifications, error } = await supabase
      .from("whatsapp_notifications")
      .select(`
        *,
        team:teams(name),
        hackathon:hackathons(title, ends_at)
      `)
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .limit(20);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending WhatsApp notifications to dispatch.",
        processed: 0,
      });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

    let successCount = 0;

    for (const notif of pendingNotifications) {
      const teamName = notif.team?.name || "Your Squad";
      const hackathonTitle = notif.hackathon?.title || "Hackathon";
      const triggerLabel = notif.trigger_type; // 'T-24h' or 'T-2h'

      const messageBody = `🚨 *Hackline Alert [${triggerLabel}]* 🚨\n\nSquad: *${teamName}*\nEvent: *${hackathonTitle}*\n\nAttention! Your deadline is approaching. Ensure your repository is public, demo video is recorded, and pitch deck is submitted before time runs out!`;

      let isSent = false;
      let errorMsg: string | null = null;

      if (accountSid && authToken && !accountSid.startsWith("placeholder")) {
        try {
          const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
          const formattedTo = notif.recipient_phone.startsWith("whatsapp:")
            ? notif.recipient_phone
            : `whatsapp:${notif.recipient_phone.trim()}`;

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

          if (twilioRes.ok) {
            isSent = true;
          } else {
            const errData = await twilioRes.json();
            errorMsg = errData.message || "Twilio API error";
          }
        } catch (err: any) {
          errorMsg = err.message;
        }
      } else {
        // Fallback simulation mode
        console.log(`[WhatsApp Webhook Dispatcher] Simulated ${triggerLabel} to ${notif.recipient_phone}`);
        isSent = true;
      }

      // Update notification status in database
      await supabase
        .from("whatsapp_notifications")
        .update({
          status: isSent ? "sent" : "failed",
          sent_at: isSent ? new Date().toISOString() : null,
          error_message: errorMsg,
        })
        .eq("id", notif.id);

      if (isSent) successCount++;
    }

    return NextResponse.json({
      success: true,
      processed: successCount,
      total: pendingNotifications.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    service: "Hackline WhatsApp Notification Dispatcher",
    timestamp: new Date().toISOString(),
  });
}
