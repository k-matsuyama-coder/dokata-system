import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const token = req.headers
      .get("authorization")
      ?.replace("Bearer ", "");

    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
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
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: superAdminUser } = await supabaseAdmin
      .from("super_admin_users")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!superAdminUser) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from("impersonation_sessions")
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
      })
      .eq("super_admin_auth_user_id", user.id)
      .eq("is_active", true);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "server error" }, { status: 500 });
  }
}