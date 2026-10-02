import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

export const runtime = "nodejs";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  try {
    const token = request.headers
      .get("authorization")
      ?.match(/^Bearer\s+(.+)$/i)?.[1];

    if (!token) {
      return json({ error: "ログインしてください。" }, 401);
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!url || !serviceKey || !openaiKey) {
      return json(
        { error: "サーバーの環境変数が設定されていません。" },
        500
      );
    }

    const supabase = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return json(
        { error: "ログインし直してください。" },
        401
      );
    }

    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("organization_id, role")
      .eq("auth_user_id", user.id)
      .single();

    if (
      employeeError ||
      !employee?.organization_id ||
      employee.role !== "admin"
    ) {
      return json(
        { error: "管理者のみ利用できます。" },
        403
      );
    }

    const safetyIdentifier = createHash("sha256")
      .update(`${employee.organization_id}:${user.id}`)
      .digest("hex");

    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Safety-Identifier": safetyIdentifier,
        },
        body: JSON.stringify({
          session: {
            type: "realtime",
            model: "gpt-realtime-2.1",
            instructions: [
              "あなたは建設現場の番割作成を補助するアシスタントです。",
              "日本語で、短くわかりやすく会話してください。",
              "日付、現場、必要人数、重機の種類、オペレーター人数を整理してください。",
              "不足している情報は一度に一つずつ確認してください。",
              "実際のデータで確認できない従業員名や配置履歴を作らないでください。",
              "現時点では番割データの取得・保存機能は接続されていません。",
              "番割を登録した、保存した、反映したと発言しないでください。",
            ].join("\n"),
            audio: {
              output: {
                voice: "marin",
              },
            },
          },
        }),
        signal: AbortSignal.timeout(20_000),
      }
    );

    if (!response.ok) {
      const message =
        response.status === 429
          ? "AIの利用上限または混雑により接続できません。OpenAIの利用状況を確認してください。"
          : response.status === 401
            ? "OpenAIのAPIキーを確認してください。"
            : "AIへの接続に失敗しました。";

      return json({ error: message }, 502);
    }

    const data = await response.json();

    if (typeof data.value !== "string") {
      return json(
        { error: "音声会話の接続情報を取得できませんでした。" },
        502
      );
    }

    return json({
      value: data.value,
      expires_at: data.expires_at,
    });
  } catch {
    return json(
      { error: "接続処理に失敗しました。時間をおいて再度お試しください。" },
      500
    );
  }
}