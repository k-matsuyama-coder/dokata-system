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
    const organizationId = body.organizationId;
    const title = body.title;
    const message = body.message;
    const url = new URL(body.url || "/reports/new", req.url).href;

    if (!employeeName || !organizationId || !title || !message) {
      return NextResponse.json(
        {
          success: false,
          message: "必要な情報が不足しています",
        },
        { status: 400 }
      );
    }

    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("employee_name", employeeName);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    if (!subscriptions?.length) {
      return NextResponse.json({
        success: false,
        message: "端末未登録",
      });
    }

    let sentCount = 0;

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
    sentCount++;
  } catch (e: any) {
    console.error("push送信失敗", e);
  }
}

if (sentCount === 0) {
  return NextResponse.json({
    success: false,
    message: "送信できる端末がありません",
  });
}

return NextResponse.json({
  success: true,
  sentCount,
});

  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
    });
  }
}