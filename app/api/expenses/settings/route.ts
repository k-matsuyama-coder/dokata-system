import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

class ExpenseError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function handleError(error: unknown) {
  if (error instanceof ExpenseError) {
    return json({ error: error.message }, error.status);
  }

  return json(
    { error: "経費の設定を確認できませんでした。" },
    500
  );
}

// ログイン中の社員情報をサーバー側で取得
async function getContext(request: Request) {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    throw new ExpenseError("ログインしてください。", 401);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new ExpenseError(
      "サーバーの環境変数が設定されていません。",
      500
    );
  }

  const client = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser(token);

  if (authError || !user) {
    throw new ExpenseError(
      "ログインし直してください。",
      401
    );
  }

  const { data: employee, error: employeeError } = await client
    .from("employees")
    .select("id, organization_id, company_name, role")
    .eq("auth_user_id", user.id)
    .single();

  if (
    employeeError ||
    !employee?.organization_id ||
    !["admin", "worker"].includes(employee.role)
  ) {
    throw new ExpenseError(
      "社員情報を確認できません。",
      403
    );
  }

  if (!employee.company_name?.trim()) {
    throw new ExpenseError(
      "社員情報に所属会社を設定してください。",
      403
    );
  }

  return { client, employee };
}

type Context = Awaited<ReturnType<typeof getContext>>;

// 設定済みの自社と所属会社が一致するか確認
async function getSettings(context: Context) {
  const { client, employee } = context;

  const { data: settings, error } = await client
    .from("expense_settings")
    .select("company_name")
    .eq("organization_id", employee.organization_id)
    .maybeSingle();

  if (error) {
    throw new ExpenseError(
      "経費の会社設定を取得できませんでした。",
      500
    );
  }

  if (!settings) {
    if (employee.role !== "admin") {
      throw new ExpenseError(
        "経費精算はまだ利用できません。管理者に確認してください。",
        403
      );
    }

    return {
      needsSetup: true,
      isAdmin: true,
      companyName: employee.company_name,
    };
  }

  if (settings.company_name !== employee.company_name) {
    throw new ExpenseError(
      "経費精算は自社社員のみ利用できます。",
      403
    );
  }

  return {
    needsSetup: false,
    isAdmin: employee.role === "admin",
    companyName: settings.company_name,
  };
}

// メニューや画面から利用可否を確認
export async function GET(request: Request) {
  try {
    const context = await getContext(request);
    return json(await getSettings(context));
  } catch (error) {
    return handleError(error);
  }
}

// 管理者の所属会社を、自社として初回登録
export async function POST(request: Request) {
  try {
    const context = await getContext(request);
    const { client, employee } = context;

    if (employee.role !== "admin") {
      throw new ExpenseError(
        "会社設定は管理者のみ操作できます。",
        403
      );
    }

    const current = await getSettings(context);

    if (!current.needsSetup) {
      return json(current);
    }

    // 会社名・組織IDは画面から受け取らず、
    // 認証済みの社員情報を使用する
    const { error } = await client
      .from("expense_settings")
      .insert({
        organization_id: employee.organization_id,
        company_name: employee.company_name,
      });

    // 同時登録時は既存設定を再確認する
    if (error && error.code !== "23505") {
      throw new ExpenseError(
        "自社の設定を保存できませんでした。",
        500
      );
    }

    return json(await getSettings(context));
  } catch (error) {
    return handleError(error);
  }
}