import { createClient } from "@supabase/supabase-js";
import { hasRole } from "@/app/types/auth";

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

    const { data: userData, error: userError } =
      await supabaseUser.auth.getUser();

    if (userError || !userData.user) {
      return Response.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: adminEmployee } = await supabaseAdmin
      .from("employees")
      .select("role")
      .eq("auth_user_id", userData.user.id)
      .single();

    if (!adminEmployee || !hasRole(adminEmployee.role, "admin")) {
      return Response.json({ error: "管理者のみ実行できます" }, { status: 403 });
    }

    const body = await req.json();
    const { employeeId, email } = body;

    if (!employeeId || !email) {
      return Response.json(
        { error: "employeeIdとemailが必要です" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const authUser = data.users.find((user) => user.email === email);

    if (!authUser) {
      return Response.json(
        { error: "このメールアドレスのログインアカウントが見つかりません" },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("employees")
      .update({
        auth_user_id: authUser.id,
      })
      .eq("id", employeeId);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      authUserId: authUser.id,
      email: authUser.email,
    });
  } catch {
    return Response.json({ error: "server error" }, { status: 500 });
  }
}