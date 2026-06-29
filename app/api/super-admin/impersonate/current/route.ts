import { requireSuperAdmin } from "@/app/api/_lib/auth";
import { forbidden, ok, serverError, unauthorized } from "@/app/api/_lib/response";
import { supabaseAdmin } from "@/app/api/_lib/supabaseAdmin";

export async function GET(req: Request) {
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

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("impersonation_sessions")
      .select(`
        id,
        organization_id,
        expires_at,
        organizations (
          name
        )
      `)
      .eq("super_admin_employee_id", employee.id)
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      return serverError(sessionError);
    }

    if (!session) {
      return ok({
        active: false,
        organizationId: null,
        organizationName: null,
      });
    }

    const organizationName = Array.isArray(session.organizations)
      ? session.organizations[0]?.name
      : session.organizations?.name;

    return ok({
      active: true,
      organizationId: session.organization_id,
      organizationName: organizationName ?? null,
      expiresAt: session.expires_at,
    });
  } catch (error) {
    return serverError(error);
  }
}