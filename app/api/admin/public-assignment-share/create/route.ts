// app/api/admin/public-links/create/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type EmployeeRoleRow = {
  role: string | null;
  organization_id: string | null;
};

function createToken() {
  return crypto.randomBytes(32).toString("hex");
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "認証トークンがありません" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: "ユーザー認証に失敗しました" },
        { status: 401 }
      );
    }

    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("role, organization_id")
      .eq("auth_user_id", user.id)
      .single<EmployeeRoleRow>();

    if (employeeError || !employee) {
      return NextResponse.json(
        { success: false, message: "社員情報が見つかりません" },
        { status: 404 }
      );
    }

    if (employee.role !== "admin" && employee.role !== "super_admin") {
      return NextResponse.json(
        { success: false, message: "管理者のみ実行できます" },
        { status: 403 }
      );
    }

    if (!employee.organization_id) {
      return NextResponse.json(
        { success: false, message: "会社情報が取得できません" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const baseUrl =
      typeof body.baseUrl === "string" && body.baseUrl.trim()
        ? body.baseUrl.trim()
        : new URL(req.url).origin;

    const publicToken = createToken();
    const now = new Date();
    const expiresAt = addDays(now, 7).toISOString();

    const { error: insertError } = await supabase
      .from("public_assignment_links")
      .insert({
        organization_id: employee.organization_id,
        token: publicToken,
        expires_at: expiresAt,
        is_active: true,
        created_by: user.id,
      });

    if (insertError) {
      return NextResponse.json(
        { success: false, message: insertError.message },
        { status: 500 }
      );
    }

    const publicUrl = `${baseUrl}/public/assignments/${publicToken}`;

    return NextResponse.json({
      success: true,
      token: publicToken,
      publicUrl,
      expiresAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "公開URLの発行に失敗しました";

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}