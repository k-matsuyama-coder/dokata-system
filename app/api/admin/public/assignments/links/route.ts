import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace(/^Bearer\s+/i, "");

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
          message: "ユーザー認証に失敗しました",
        },
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
        {
          success: false,
          message: "対象会社が未選択です",
        },
        { status: 400 }
      );
    }

    const { data: employee, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select("role")
      .eq("auth_user_id", user.id)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (employeeError || !employee) {
      return NextResponse.json(
        {
          success: false,
          message: "社員情報が見つかりません",
        },
        { status: 404 }
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

    const { data: links, error: linksError } = await supabaseAdmin
      .from("public_assignment_links")
      .select("id, token, expires_at, is_active, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (linksError) {
      return NextResponse.json(
        {
          success: false,
          message: linksError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      links: links ?? [],
    });
  } catch (error) {
    console.error("public assignment links GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "公開URL一覧の取得に失敗しました",
      },
      { status: 500 }
    );
  }
}