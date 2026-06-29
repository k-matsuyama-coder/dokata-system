import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "./supabaseAdmin";

export type ApiEmployee = {
  id: string;
  name: string | null;
  role: string | null;
  auth_user_id: string | null;
  organization_id: string | null;
};

export async function getBearerUser(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return { user: null, error: "Unauthorized" };
  }

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: "Unauthorized" };
  }

  return { user, error: null };
}

export async function requireSuperAdmin(req: Request) {
  const { user, error } = await getBearerUser(req);

  if (error || !user) {
    return { employee: null, error: "Unauthorized" };
  }

  const { data: employee, error: employeeError } = await supabaseAdmin
    .from("employees")
    .select("id, name, role, auth_user_id, organization_id")
    .eq("auth_user_id", user.id)
    .single();

  if (employeeError || !employee) {
    return { employee: null, error: "Employee not found" };
  }

  if (employee.role !== "super_admin") {
    return { employee: null, error: "Forbidden" };
  }

  return { employee: employee as ApiEmployee, error: null };
}