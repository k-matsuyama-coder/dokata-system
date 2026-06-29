import { createClient } from "@supabase/supabase-js";
import { serverError, unauthorized } from "@/app/api/_lib/response";
import { supabaseAdmin } from "@/app/api/_lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return unauthorized();
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
      return unauthorized();
    }

    const { data: employee, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select("id, role, organization_id")
      .eq("auth_user_id", user.id)
      .single();

    if (employeeError || !employee) {
      return unauthorized("社員情報が見つかりません");
    }

    if (employee.role === "super_admin") {
      const { data: session } = await supabaseAdmin
        .from("impersonation_sessions")
        .select("organization_id")
        .eq("super_admin_employee_id", employee.id)
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return Response.json({
        organizationId: session?.organization_id ?? null,
        impersonating: Boolean(session?.organization_id),
      });
    }

    return Response.json({
      organizationId: employee.organization_id,
      impersonating: false,
    });
  } catch (error) {
    return serverError(error);
  }
}