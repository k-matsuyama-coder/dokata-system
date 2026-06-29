import { supabase } from "@/lib/supabase";

export async function isSuperAdminUser() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) return false;

  const { data } = await supabase
    .from("super_admin_users")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return Boolean(data);
}