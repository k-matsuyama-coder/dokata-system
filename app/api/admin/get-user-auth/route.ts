import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { authUserId } = body;

    if (!authUserId) {
      return Response.json({ error: "authUserIdが必要です" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.auth.admin.getUserById(authUserId);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      email: data.user.email,
    });
  } catch {
    return Response.json({ error: "server error" }, { status: 500 });
  }
}