import { createClient } from "@supabase/supabase-js";
import { serverError, unauthorized } from "@/app/api/_lib/response";
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
      .select("id, auth_user_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!superAdminUser) {
      return unauthorized("Super Admin権限がありません");
    }

    const body = await req.json();
    const { organizationId } = body;

    if (!organizationId) {
      return Response.json(
        { error: "organizationIdがありません" },
        { status: 400 }
      );
    }

    const { data: organization } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("id", organizationId)
      .maybeSingle();

    if (!organization) {
      return Response.json(
        { error: "会社情報が見つかりません" },
        { status: 404 }
      );
    }

    await supabaseAdmin
      .from("impersonation_sessions")
      .update({ is_active: false })
      .eq("super_admin_auth_user_id", user.id)
      .eq("is_active", true);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8);

    const { error: insertError } = await supabaseAdmin
      .from("impersonation_sessions")
      .insert({
        super_admin_auth_user_id: user.id,
        organization_id: organizationId,
        is_active: true,
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      return Response.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      organizationId,
    });
  } catch (error) {
    return serverError(error);
  }
}