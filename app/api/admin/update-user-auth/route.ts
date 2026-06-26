import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { authUserId, email, password } = await req.json();

    if (!authUserId) {
      return Response.json({ error: "authUserIdが必要です" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const updateData: {
      email?: string;
      password?: string;
      email_confirm?: boolean;
    } = {};

    if (email) {
      updateData.email = email;
      updateData.email_confirm = true; // 重要
    }

    if (password) {
      updateData.password = password;
    }

    if (!email && !password) {
      return Response.json({ success: true });
    }

    const { data, error } = await supabase.auth.admin.updateUserById(
      authUserId,
      updateData
    );

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        email_confirmed_at: data.user.email_confirmed_at,
      },
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "server error" }, { status: 500 });
  }
}