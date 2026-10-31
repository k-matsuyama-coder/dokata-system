import { fetchAllRows } from "@/lib/fetchAllRows";
import { requireSuperAdmin } from "@/app/api/_lib/auth";
import {
  forbidden,
  serverError,
  unauthorized,
} from "@/app/api/_lib/response";
import { supabaseAdmin } from "@/app/api/_lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const { superAdminUser, error } = await requireSuperAdmin(req);

    if (error === "Unauthorized") {
      return unauthorized();
    }

    if (error === "Forbidden" || !superAdminUser) {
      return forbidden();
    }

    const { data, error: dbError } = await fetchAllRows((pageFrom, pageTo) => supabaseAdmin
      .from("super_admin_users")
      .select(`
        id,
        name,
        email,
        created_at
      `)
      .order("created_at", { ascending: false })
.order("id", { ascending: true }).range(pageFrom, pageTo));

    if (dbError) {
      return serverError(dbError);
    }

    return Response.json(data ?? []);
  } catch (error) {
    return serverError(error);
  }
}