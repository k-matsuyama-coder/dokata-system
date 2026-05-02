import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { authUserId, email, password } = body;

    if (!authUserId) {
      return Response.json({ error: "authUserIdが必要です" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const updateData: {
      email?: string;
      password?: string;
    } = {};

    if (email) updateData.email = email;
    if (password) updateData.password = password;

    if (!updateData.email && !updateData.password) {
      return Response.json({ success: true });
    }

    const { error } = await supabase.auth.admin.updateUserById(
      authUserId,
      updateData
    );

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "server error" }, { status: 500 });
  }
}