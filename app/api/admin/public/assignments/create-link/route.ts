import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type ViewMode = "week" | "next3days";

type CreateLinkRequestBody = {
  expiresInDays?: number;
  viewMode?: ViewMode;
  baseDate?: string;
};

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function createToken(length = 24) {
  return randomBytes(length).toString("hex");
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isValidDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace(/^Bearer\s+/i, "");

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "認証トークンがありません" },
        { status: 401 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as CreateLinkRequestBody;

    const expiresInDays =
      typeof body.expiresInDays === "number" &&
      Number.isFinite(body.expiresInDays) &&
      body.expiresInDays > 0
        ? Math.min(Math.floor(body.expiresInDays), 7)
        : 7;

    const viewMode: ViewMode =
      body.viewMode === "week" || body.viewMode === "next3days"
        ? body.viewMode
        : "next3days";

    const today = new Date();
    const fallbackBaseDate = today.toISOString().slice(0, 10);
    const baseDate =
      typeof body.baseDate === "string" && isValidDateString(body.baseDate)
        ? body.baseDate
        : fallbackBaseDate;

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "ユーザー認証に失敗しました" },
        { status: 401 }
      );
    }

    const { data: modeRow } = await supabaseAdmin
      .from("employee_modes")
      .select("organization_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    let organizationId = modeRow?.organization_id ?? null;

    if (!organizationId) {
      const { data: employeeRow } = await supabaseAdmin
        .from("employees")
        .select("organization_id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      organizationId = employeeRow?.organization_id ?? null;
    }

    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: "対象会社が未選択です" },
        { status: 400 }
      );
    }

    const { data: employee, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select("role, organization_id")
      .eq("auth_user_id", user.id)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (employeeError || !employee) {
      return NextResponse.json(
        { success: false, message: "社員情報が見つかりません" },
        { status: 404 }
      );
    }

    if (!["admin", "master", "super_admin"].includes(employee.role ?? "")) {
      return NextResponse.json(
        { success: false, message: "管理者のみ実行できます" },
        { status: 403 }
      );
    }

    const expiresAt = addDays(today, expiresInDays);
    const publicToken = createToken();

    const { data: existingActiveLink } = await supabaseAdmin
      .from("public_assignment_links")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .maybeSingle();

    if (existingActiveLink?.id) {
      await supabaseAdmin
        .from("public_assignment_links")
        .update({ is_active: false })
        .eq("id", existingActiveLink.id);
    }

    const { error: insertError } = await supabaseAdmin
      .from("public_assignment_links")
      .insert({
        organization_id: organizationId,
        token: publicToken,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        view_mode: viewMode,
        base_date: baseDate,
      });

    if (insertError) {
      return NextResponse.json(
        { success: false, message: insertError.message },
        { status: 500 }
      );
    }

    const origin = new URL(req.url).origin;
    const url = `${origin}/public/assignments/${publicToken}`;

    return NextResponse.json({
      success: true,
      token: publicToken,
      url,
      expiresAt: expiresAt.toISOString(),
      viewMode,
      baseDate,
    });
  } catch (error) {
    console.error("create public assignment link error", error);

    return NextResponse.json(
      { success: false, message: "公開URLの発行に失敗しました" },
      { status: 500 }
    );
  }
}