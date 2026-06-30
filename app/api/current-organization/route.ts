// app/api/current-organization/route.ts
import { createClient } from "@supabase/supabase-js";
import { serverError, unauthorized } from "@/app/api/_lib/response";
import { supabaseAdmin } from "@/app/api/_lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return unauthorized("認証トークンがありません");
    }

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(token);

    if (userError || !user) {
      return unauthorized("ユーザー認証に失敗しました");
    }

    const { data: superAdminUser } = await supabaseAdmin
      .from("super_admin_users")
      .select("id, auth_user_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (superAdminUser) {
      const { data: session } = await supabaseAdmin
        .from("impersonation_sessions")
        .select("organization_id")
        .eq("super_admin_auth_user_id", user.id)
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!session?.organization_id) {
        return Response.json({
          organizationId: null,
          impersonating: false,
          isSuperAdmin: true,
          message: "対象会社が未選択です",
        });
      }

      return Response.json({
        organizationId: session.organization_id,
        impersonating: true,
        isSuperAdmin: true,
      });
    }

    const { data: employee, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select("id, role, organization_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (employeeError || !employee) {
      return unauthorized("社員情報が見つかりません");
    }

    return Response.json({
      organizationId: employee.organization_id,
      impersonating: false,
      isSuperAdmin: false,
    });
  } catch (error) {
    return serverError(error);
  }
}