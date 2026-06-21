import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

webpush.setVapidDetails(
  "mailto:admin@dokata-system.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const employeeName = body.employeeName;
    const title = body.title;
    const message = body.message;
    const url = new URL(body.url || "/reports/new", req.url).href;

    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("employee_name", employeeName);

    if (!subscriptions?.length) {
      return NextResponse.json({
        success: false,
        message: "端末未登録",
      });
    }

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify({
            title,
            body: message,
            url,
          })
        );
    } catch (e: any) {
        console.error("push送信失敗", e);
      
        return NextResponse.json({
          success: false,
          message: e.message,
        });
      }
    }

    return NextResponse.json({
        success: true,
        sentCount: subscriptions.length,
      });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
    });
  }
}