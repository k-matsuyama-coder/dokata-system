// app/api/admin/public/assignments/revoke-link/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "認証トークンがありません",
        },
        { status: 401 }
      );
    }

    const body = (await req.json()) as { id?: string };
    const id = body.id;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "idが必要です",
        },
        { status: 400 }
      );
    }

    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
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
      .select("role, organization_id")
      .eq("auth_user_id", user.id)
      .single();

    if (employeeError || !employee?.organization_id) {
      return NextResponse.json(
        {
          success: false,
          message: "会社情報が取得できません",
        },
        { status: 403 }
      );
    }

    if (!["admin", "master", "super_admin"].includes(employee.role ?? "")) {
      return NextResponse.json(
        {
          success: false,
          message: "管理者のみ実行できます",
        },
        { status: 403 }
      );
    }

    const { data: targetLink, error: targetError } = await supabaseAdmin
      .from("public_assignment_links")
      .select("id, organization_id, is_active")
      .eq("id", id)
      .single();

    if (targetError || !targetLink) {
      return NextResponse.json(
        {
          success: false,
          message: "公開URLが見つかりません",
        },
        { status: 404 }
      );
    }

    if (targetLink.organization_id !== employee.organization_id) {
      return NextResponse.json(
        {
          success: false,
          message: "この公開URLを操作する権限がありません",
        },
        { status: 403 }
      );
    }

    if (!targetLink.is_active) {
      return NextResponse.json({
        success: true,
        message: "すでに無効化されています",
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from("public_assignment_links")
      .update({
        is_active: false,
      })
      .eq("id", id)
      .eq("organization_id", employee.organization_id);

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          message: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "公開URLを無効化しました",
    });
  } catch (error) {
    console.error("public assignment revoke POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "公開URLの無効化に失敗しました",
      },
      { status: 500 }
    );
  }
}