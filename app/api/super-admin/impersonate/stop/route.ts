import { requireSuperAdmin } from "@/app/api/_lib/auth";
import { forbidden, ok, serverError, unauthorized } from "@/app/api/_lib/response";
import { supabaseAdmin } from "@/app/api/_lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { employee, error } = await requireSuperAdmin(req);

    if (error === "Unauthorized") {
      return unauthorized();
    }

    if (error === "Forbidden") {
      return forbidden();
    }

    if (!employee) {
      return forbidden();
    }

    const { error: updateError } = await supabaseAdmin
      .from("impersonation_sessions")
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
      })
      .eq("super_admin_employee_id", employee.id)
      .eq("is_active", true);

    if (updateError) {
      return serverError(updateError);
    }

    return ok();
  } catch (error) {
    return serverError(error);
  }
}