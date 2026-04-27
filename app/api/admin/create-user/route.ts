import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lastName, firstName, email, role, companyName } = body;

    if (!lastName || !firstName || !email) {
      return Response.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      );
    }

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

    const { error: employeeError } = await supabase.from("employees").insert({
      auth_user_id: user.id,
      name: fullName,
      role: role || "worker",
      company_name: companyName || "",
      must_change_password: true,
    });

    if (employeeError) {
      return Response.json({ error: employeeError.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      password,
    });
  } catch {
    return Response.json({ error: "server error" }, { status: 500 });
  }
}