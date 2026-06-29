import { createClient } from "@supabase/supabase-js";
import { requireSuperAdmin } from "@/app/api/_lib/auth";
import { forbidden, serverError, unauthorized } from "@/app/api/_lib/response";
import { supabaseAdmin } from "@/app/api/_lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { superAdminUser, error } = await requireSuperAdmin(req);

    if (error === "Unauthorized") {
      return unauthorized();
    }

    if (error === "Forbidden" || !superAdminUser) {
      return forbidden();
    }

    const body = await req.json();
    const { name, email } = body;

    if (!name || !email) {
      return Response.json(
        { error: "名前とメールアドレスは必須です" },
        { status: 400 }
      );
    }

    const password = Math.random().toString(36).slice(-10);

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      return Response.json(
        { error: authError?.message || "Authユーザー作成に失敗しました" },
        { status: 500 }
      );
    }

    const { error: insertError } = await supabaseAdmin
      .from("super_admin_users")
      .insert({
        auth_user_id: authData.user.id,
        name,
        email,
      });

    if (insertError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      return Response.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      email,
      password,
    });
  } catch (error) {
    return serverError(error);
  }
}