import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { employeeId, authUserId, email, password } = await req.json();

    if (!employeeId) {
      return Response.json({ error: "employeeIdが必要です" }, { status: 400 });
    }

    if (!email || !password) {
      return Response.json(
        { error: "メールアドレスとパスワードが必要です" },
        { status: 400 }
      );
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

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    let finalAuthUserId = authUserId;

    if (finalAuthUserId) {
      const { error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(finalAuthUserId, {
          email: cleanEmail,
          password: cleanPassword,
          email_confirm: true,
        });

      if (updateError) {
        return Response.json({ error: updateError.message }, { status: 500 });
      }
    } else {
      const { data: createData, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password: cleanPassword,
          email_confirm: true,
        });

      if (createError) {
        return Response.json({ error: createError.message }, { status: 500 });
      }

      finalAuthUserId = createData.user.id;
    }

    const { error: employeeError } = await supabaseAdmin
      .from("employees")
      .update({
        email: cleanEmail,
        auth_user_id: finalAuthUserId,
      })
      .eq("id", employeeId);

    if (employeeError) {
      return Response.json({ error: employeeError.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      authUserId: finalAuthUserId,
      email: cleanEmail,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "server error" }, { status: 500 });
  }
}