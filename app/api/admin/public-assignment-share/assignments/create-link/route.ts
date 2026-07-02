// app/api/admin/public/assignments/create-link/route.ts
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type CreateLinkRequestBody = {
  expiresInDays?: number;
};

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function createToken(length = 32) {
  return randomBytes(length).toString("hex");
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "認証トークンがありません",
        },
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

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "ユーザー認証に失敗しました",
        },
        { status: 401 }
      );
    }

    const { data: employee, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select("id, role, organization_id")
      .eq("auth_user_id", user.id)
      .single();

    if (employeeError || !employee?.organization_id) {
      return NextResponse.json(
        {
          success: false,
          message: "会社情報が取得できません",
        },
        { status: 404 }
      );
    }

    if (employee.role !== "admin" && employee.role !== "super_admin") {
      return NextResponse.json(
        {
          success: false,
          message: "管理者のみ実行できます",
        },
        { status: 403 }
      );
    }

    const organizationId = employee.organization_id;
    const now = new Date();
    const expiresAt = addDays(now, expiresInDays);
    const publicToken = createToken(24);

    const { error: insertError } = await supabaseAdmin
      .from("public_assignment_links")
      .insert({
        organization_id: organizationId,
        token: publicToken,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      });

    if (insertError) {
      return NextResponse.json(
        {
          success: false,
          message: insertError.message,
        },
        { status: 500 }
      );
    }

    const origin = new URL(req.url).origin;
    const publicUrl = `${origin}/public/assignments/${publicToken}`;

    return NextResponse.json({
      success: true,
      publicUrl,
      token: publicToken,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("create public assignment link error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "公開URLの発行に失敗しました",
      },
      { status: 500 }
    );
  }
}