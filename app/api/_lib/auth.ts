import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "./supabaseAdmin";

export type ApiSuperAdminUser = {
  id: string;
  auth_user_id: string;
  name: string | null;
  email: string | null;
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
    return { superAdminUser: null, user: null, error: "Unauthorized" };
  }

  const { data: superAdminUser, error: superAdminError } = await supabaseAdmin
    .from("super_admin_users")
    .select("id, auth_user_id, name, email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (superAdminError || !superAdminUser) {
    return { superAdminUser: null, user, error: "Forbidden" };
  }

  return {
    superAdminUser: superAdminUser as ApiSuperAdminUser,
    user,
    error: null,
  };
}