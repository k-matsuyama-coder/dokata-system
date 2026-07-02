// app/api/current-organization/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "認証トークンがありません" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "ユーザー認証に失敗しました" },
        { status: 401 }
      );
    }

    const { data: employee, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select("organization_id")
      .eq("auth_user_id", user.id)
      .single();

    if (employeeError || !employee?.organization_id) {
      return NextResponse.json(
        { error: "社員情報が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      organizationId: employee.organization_id,
      impersonating: false,
    });
  } catch (error) {
    console.error("current-organization error:", error);

    return NextResponse.json(
      { error: "会社情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}