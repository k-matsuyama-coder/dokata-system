import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hasRole } from "@/app/types/auth";

export async function GET(request: Request) {
  const token = request.headers
    .get("authorization")
    ?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!employee || !hasRole(employee.role, "super_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    return NextResponse.json([], { status: 500 });
  }

  const users = data.users.map((user) => ({
    id: user.id,
    email: user.email ?? null,
  }));

  return NextResponse.json(users);
}