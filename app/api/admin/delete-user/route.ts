import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeId } = body;

    if (!employeeId) {
      return Response.json({ error: "employeeIdが必要です" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: employee, error: employeeFetchError } = await supabase
      .from("employees")
      .select("id, auth_user_id, name")
      .eq("id", employeeId)
      .single();

    if (employeeFetchError || !employee) {
      return Response.json({ error: "社員が見つかりません" }, { status: 404 });
    }

    const { error: employeeDeleteError } = await supabase
      .from("employees")
      .delete()
      .eq("id", employeeId);

    if (employeeDeleteError) {
      return Response.json({ error: employeeDeleteError.message }, { status: 500 });
    }

    if (employee.auth_user_id) {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(
        employee.auth_user_id
      );

      if (authDeleteError) {
        return Response.json(
          { error: "employeesは削除済みですがAuth削除失敗: " + authDeleteError.message },
          { status: 500 }
        );
      }
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "server error" }, { status: 500 });
  }
}