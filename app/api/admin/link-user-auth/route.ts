import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeId, email } = body;

    if (!employeeId || !email) {
      return Response.json(
        { error: "employeeIdとemailが必要です" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.auth.admin.listUsers();

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

    const { error: updateError } = await supabase
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