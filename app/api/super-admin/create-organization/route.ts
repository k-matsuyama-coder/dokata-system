import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return Response.json({ error: "認証情報がありません" }, { status: 401 });
    }

    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: userData } = await supabaseUser.auth.getUser();

    if (!userData.user) {
      return Response.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: superAdminUser } = await supabaseAdmin
  .from("super_admin_users")
  .select("id")
  .eq("auth_user_id", userData.user.id)
  .maybeSingle();

if (!superAdminUser) {
  return Response.json(
    { error: "Super Adminのみ実行できます" },
    { status: 403 }
  );
}

    const body = await req.json();
    const { organizationName, adminLastName, adminFirstName, adminEmail } = body;

    if (!organizationName || !adminFirstName || !adminEmail) {
      return Response.json(
        { error: "会社名・管理者名・メールアドレスは必須です" },
        { status: 400 }
      );
    }

    const password = Math.random().toString(36).slice(-10);
    const adminName = [adminLastName, adminFirstName].filter(Boolean).join(" ");

    const { data: organization, error: orgError } = await supabaseAdmin
      .from("organizations")
      .insert({
        name: organizationName,
      })
      .select("id, name")
      .single();

    if (orgError || !organization) {
      return Response.json(
        { error: orgError?.message || "会社作成失敗" },
        { status: 500 }
      );
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      return Response.json(
        { error: authError?.message || "ログインアカウント作成失敗" },
        { status: 500 }
      );
    }

    const { error: employeeError } = await supabaseAdmin
  .from("employees")
  .insert({
    auth_user_id: authData.user.id,
    name: adminName,
    role: "admin",
    organization_id: organization.id,
    company_name: organization.name,
    must_change_password: true,
  });

if (employeeError) {
  // 作成済みのAuthユーザーを削除
  await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

  return Response.json(
    { error: employeeError.message },
    { status: 500 }
  );
}

    return Response.json({
      success: true,
      organization,
      adminEmail,
      password,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "server error" }, { status: 500 });
  }
}