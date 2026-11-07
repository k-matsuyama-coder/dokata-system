// app/api/current-organization/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin();

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return NextResponse.json(
        { error: "認証トークンがありません" },
        { status: 401 }
      );
    }

    const authStarted = performance.now();

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    const authMs = performance.now() - authStarted;

    if (userError || !user) {
      return NextResponse.json(
        { error: "ユーザー認証に失敗しました" },
        { status: 401 }
      );
    }

    const employeeStarted = performance.now();

    const { data: employee, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select("organization_id, role, company_name")
      .eq("auth_user_id", user.id)
      .single();

    const employeeMs = performance.now() - employeeStarted;

    if (employeeError || !employee?.organization_id) {
      return NextResponse.json(
        { error: "社員情報が見つかりません" },
        { status: 404 }
      );
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[会社情報APIの内訳]", {
        認証秒: Number((authMs / 1000).toFixed(3)),
        社員情報取得秒: Number((employeeMs / 1000).toFixed(3)),
      });
    }

    return NextResponse.json({
      organizationId: employee.organization_id,
      role: employee.role,
      companyName: employee.company_name,
      impersonating: false,
    });
  } catch (error) {
    console.error("current-organization error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "会社情報の取得に失敗しました",
      },
      { status: 500 }
    );
  }
}