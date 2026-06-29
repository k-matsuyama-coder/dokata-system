import { createClient } from "@supabase/supabase-js";
import { forbidden, ok, serverError, unauthorized } from "@/app/api/_lib/response";
import { supabaseAdmin } from "@/app/api/_lib/supabaseAdmin";

export async function POST(req: Request) {
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

    const { data: superAdminUser } = await supabaseAdmin
      .from("super_admin_users")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!superAdminUser) {
      return forbidden();
    }

    const { error: updateError } = await supabaseAdmin
      .from("impersonation_sessions")
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
      })
      .eq("super_admin_auth_user_id", user.id)
      .eq("is_active", true);

    if (updateError) {
      return serverError(updateError);
    }

    return ok();
  } catch (error) {
    return serverError(error);
  }
}