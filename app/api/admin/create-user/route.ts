import { createClient } from "@supabase/supabase-js";
import { hasRole } from "@/app/types/auth";

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
    } = await authClient.auth.getUser(token);

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: loginEmployee, error: loginEmployeeError } = await supabase
      .from("employees")
      .select("role, organization_id")
      .eq("auth_user_id", user.id)
      .single();
    
    if (loginEmployeeError) {
      return Response.json(
        { error: "社員情報取得失敗: " + loginEmployeeError.message },
        { status: 500 }
      );
    }

    if (!loginEmployee || !hasRole(loginEmployee.role, "admin")) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!loginEmployee.organization_id) {
      return Response.json(
        { error: "会社情報が取得できません" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { lastName, firstName, email, role, companyName } = body;

    if (!firstName || !email) {
      return Response.json(
        { error: "名前とメールアドレスは必須です" },
        { status: 400 }
      );
    }

    if (role === "super_admin" && !hasRole(loginEmployee.role, "super_admin")) {
      return Response.json(
        { error: "super_admin 権限は super_admin のみ設定できます" },
        { status: 403 }
      );
    }

    const password = Math.random().toString(36).slice(-8);
    const fullName = [lastName, firstName].filter(Boolean).join(" ");

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const createdUser = data.user;

    const { error: employeeError } = await supabase.from("employees").insert({
      auth_user_id: createdUser.id,
      name: fullName,
      role: role || "worker",
      company_name: companyName || "",
      must_change_password: true,
      organization_id: loginEmployee.organization_id,
    });

    if (employeeError) {
      await supabase.auth.admin.deleteUser(createdUser.id);
    
      return Response.json(
        { error: employeeError.message },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      password,
    });
  } catch {
    return Response.json({ error: "server error" }, { status: 500 });
  }
}