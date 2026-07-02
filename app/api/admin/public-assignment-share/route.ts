// app/api/admin/public-assignment-shares/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hasRole } from "@/app/types/auth";

type CreateShareRequest = {
  organizationId?: string;
  targetDate?: string;
};

type EmployeeRoleRow = {
  role: string | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function isValidDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function createErrorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return createErrorResponse("Supabase環境変数が不足しています", 500);
    }

    const authorization = req.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return createErrorResponse("認証トークンがありません", 401);
    }

    const token = authorization.replace("Bearer ", "").trim();

    const body = (await req.json()) as CreateShareRequest;
    const organizationId = body.organizationId?.trim();
    const targetDate = body.targetDate?.trim();

    if (!organizationId) {
      return createErrorResponse("organizationIdが必要です");
    }

    if (!targetDate) {
      return createErrorResponse("targetDateが必要です");
    }

    if (!isValidDateString(targetDate)) {
      return createErrorResponse("targetDateは YYYY-MM-DD 形式で指定してください");
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const serviceClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return createErrorResponse("ユーザー認証に失敗しました", 401);
    }

    const { data: employee, error: employeeError } = await serviceClient
      .from("employees")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("auth_user_id", user.id)
      .single<EmployeeRoleRow>();

    if (employeeError || !employee) {
      return createErrorResponse("社員情報が見つかりません", 403);
    }

    if (!hasRole(employee.role, "admin")) {
      return createErrorResponse("管理者のみ実行できます", 403);
    }

    const shareToken = crypto.randomUUID().replace(/-/g, "");
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error: insertError } = await serviceClient
      .from("public_assignment_shares")
      .insert({
        organization_id: organizationId,
        target_date: targetDate,
        token: shareToken,
        expires_at: expiresAt,
        is_active: true,
        created_by_auth_user_id: user.id,
      });

    if (insertError) {
      return createErrorResponse(
        `公開URLの保存に失敗しました: ${insertError.message}`,
        500
      );
    }

    const origin = new URL(req.url).origin;
    const shareUrl = `${origin}/public/assignments/${shareToken}`;

    return NextResponse.json({
      ok: true,
      token: shareToken,
      shareUrl,
      expiresAt,
      targetDate,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "不明なエラーが発生しました";

    return createErrorResponse(message, 500);
  }
}