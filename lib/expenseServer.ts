import "server-only";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export class ExpenseError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export function expenseJson(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function expenseError(error: unknown) {
  return expenseJson(
    {
      error:
        error instanceof ExpenseError
          ? error.message
          : "経費の処理に失敗しました。",
    },
    error instanceof ExpenseError ? error.status : 500
  );
}

export async function getExpenseContext(request: Request) {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    throw new ExpenseError("ログインしてください。", 401);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new ExpenseError("サーバー設定を確認してください。", 500);
  }

  const client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: auth, error: authError } =
    await client.auth.getUser(token);

  if (authError || !auth.user) {
    throw new ExpenseError("ログインし直してください。", 401);
  }

  const { data: employee, error: employeeError } = await client
    .from("employees")
    .select("id, name, organization_id, company_name, role")
    .eq("auth_user_id", auth.user.id)
    .single();

  if (
    employeeError ||
    !employee?.organization_id ||
    !employee.company_name?.trim() ||
    !["admin", "worker"].includes(employee.role)
  ) {
    throw new ExpenseError("社員情報を確認できません。", 403);
  }

  const { data: settings, error: settingsError } = await client
    .from("expense_settings")
    .select("company_name")
    .eq("organization_id", employee.organization_id)
    .maybeSingle();

  if (settingsError) {
    throw new ExpenseError("会社設定を取得できませんでした。", 500);
  }

  if (!settings) {
    throw new ExpenseError("管理者が経費の利用開始設定を行ってください。", 403);
  }

  if (settings.company_name !== employee.company_name) {
    throw new ExpenseError("経費申請は自社社員のみ利用できます。", 403);
  }

  return {
    client,
    employee,
    organizationId: employee.organization_id as string,
    companyName: settings.company_name as string,
    isAdmin: employee.role === "admin",
  };
}