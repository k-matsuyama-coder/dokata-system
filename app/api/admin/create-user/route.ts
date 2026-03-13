import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lastName, firstName, email } = body;

    const password = Math.random().toString(36).slice(-8);
    const fullName = `${lastName} ${firstName}`;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const user = data.user;

    const { error: employeeError } = await supabase
      .from("employees")
      .insert({
        auth_user_id: user.id,
        name: fullName,
        role: "worker",
      });

    if (employeeError) {
      return Response.json({ error: employeeError.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      password: password,
    });

  } catch (e) {
    return Response.json({ error: "server error" }, { status: 500 });
  }
}