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

    const { employeeId, authUserId, email, password } = await req.json();

    if (!employeeId) {
      return Response.json({ error: "employeeIdが必要です" }, { status: 400 });
    }

    if (!email) {
      return Response.json({ error: "メールアドレスが必要です" }, { status: 400 });
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

    const { data: adminEmployee } = await supabaseAdmin
  .from("employees")
  .select("role")
  .eq("auth_user_id", userData.user.id)
  .single();

if (!adminEmployee || !hasRole(adminEmployee.role, "admin")) {
  return Response.json(
    { error: "管理者のみ実行できます" },
    { status: 403 }
  );
}

    const cleanEmail = email.trim();
    const cleanPassword = typeof password === "string" ? password.trim() : "";

    let finalAuthUserId = authUserId || null;

    if (!finalAuthUserId) {
      const { data: listData, error: listError } =
        await supabaseAdmin.auth.admin.listUsers();

      if (listError) {
        return Response.json({ error: listError.message }, { status: 500 });
      }

      const existingUser = listData.users.find(
        (user) => user.email?.toLowerCase() === cleanEmail.toLowerCase()
      );

      if (existingUser) {
        finalAuthUserId = existingUser.id;
      }
    }

    if (finalAuthUserId) {
      const updateData: {
        email?: string;
        password?: string;
        email_confirm?: boolean;
      } = {
        email: cleanEmail,
        email_confirm: true,
      };

      if (cleanPassword) {
        updateData.password = cleanPassword;
      }

      const { error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(finalAuthUserId, updateData);

      if (updateError) {
        return Response.json({ error: updateError.message }, { status: 500 });
      }
    } else {
      if (!cleanPassword) {
        return Response.json(
          { error: "新規ログインアカウント作成にはパスワードが必要です" },
          { status: 400 }
        );
      }

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