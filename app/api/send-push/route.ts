import { NextResponse } from "next/server";
import webpush from "web-push";
import { supabaseAdmin } from "@/app/api/_lib/supabaseAdmin";

export const runtime = "nodejs";

webpush.setVapidDetails(
  "mailto:admin@dokata-system.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

type PushRequestBody = {
  employeeName?: unknown;
  organizationId?: unknown;
  title?: unknown;
  message?: unknown;
  url?: unknown;
};

const adminRoles = new Set([
  "admin",
  "master",
  "super_admin",
]);

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("authorization");
    const accessToken = authorization?.replace(
      /^Bearer\s+/i,
      ""
    );

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          message: "認証トークンがありません",
        },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "ログイン情報を確認できません",
        },
        { status: 401 }
      );
    }

    const body = (await req.json()) as PushRequestBody;

    const employeeName =
      typeof body.employeeName === "string"
        ? body.employeeName.trim()
        : "";

    const organizationId =
      typeof body.organizationId === "string"
        ? body.organizationId
        : "";

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    if (
      !employeeName ||
      !organizationId ||
      !title ||
      !message
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "必要な情報が不足しています",
        },
        { status: 400 }
      );
    }

    if (title.length > 100 || message.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          message: "通知内容が長すぎます",
        },
        { status: 400 }
      );
    }

    const { data: sender, error: senderError } =
      await supabaseAdmin
        .from("employees")
        .select("role, organization_id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    if (
      senderError ||
      !sender ||
      sender.organization_id !== organizationId
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "この会社の通知を送信する権限がありません",
        },
        { status: 403 }
      );
    }

    const { data: targetEmployee, error: targetError } =
      await supabaseAdmin
        .from("employees")
        .select("role")
        .eq("organization_id", organizationId)
        .eq("name", employeeName)
        .limit(1)
        .maybeSingle();

    if (targetError || !targetEmployee) {
      return NextResponse.json(
        {
          success: false,
          message: "送信対象の社員が見つかりません",
        },
        { status: 404 }
      );
    }

    const senderIsAdmin = adminRoles.has(
      sender.role ?? ""
    );

    const targetIsAdmin = adminRoles.has(
      targetEmployee.role ?? ""
    );

    if (!senderIsAdmin && !targetIsAdmin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "一般社員から一般社員へは通知できません",
        },
        { status: 403 }
      );
    }

    const requestedUrl =
      typeof body.url === "string" &&
      body.url.startsWith("/") &&
      !body.url.startsWith("//")
        ? body.url
        : "/reports/new";

    const url = new URL(requestedUrl, req.url).href;

    const { data: subscriptions, error } =
      await supabaseAdmin
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
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

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify({
            title,
            body: message,
            url,
          })
        );

        sentCount++;
      } catch (error) {
        console.error("Push通知送信失敗:", error);
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
    console.error("Push通知APIエラー:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Push通知の送信に失敗しました",
      },
      { status: 500 }
    );
  }
}