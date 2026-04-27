import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeId } = body;

    if (!employeeId) {
      return Response.json({ error: "employeeIdが必要です" }, { status: 400 });
    }

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

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();

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

    if (!adminEmployee || adminEmployee.role !== "admin") {
      return Response.json({ error: "管理者のみ実行できます" }, { status: 403 });
    }

    const { data: employee, error: employeeFetchError } = await supabaseAdmin
      .from("employees")
      .select("id, auth_user_id, name")
      .eq("id", employeeId)
      .single();

    if (employeeFetchError || !employee) {
      return Response.json({ error: "社員が見つかりません" }, { status: 404 });
    }

    if (employee.auth_user_id) {
      const { error: authDeleteError } =
        await supabaseAdmin.auth.admin.deleteUser(employee.auth_user_id);

      if (authDeleteError) {
        return Response.json(
          { error: "Auth削除失敗: " + authDeleteError.message },
          { status: 500 }
        );
      }
    }

    const { error: employeeDeleteError } = await supabaseAdmin
      .from("employees")
      .delete()
      .eq("id", employeeId);

    if (employeeDeleteError) {
      return Response.json(
        { error: "employees削除失敗: " + employeeDeleteError.message },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "server error" }, { status: 500 });
  }
}