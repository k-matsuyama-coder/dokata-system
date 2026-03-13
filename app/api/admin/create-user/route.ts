import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lastName, firstName, email } = body;

    if (!lastName || !firstName || !email) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const fullName = `${lastName} ${firstName}`;
    const tempPassword = Math.random().toString(36).slice(-8);

    const { data: existingEmployee } = await supabaseAdmin
      .from("employees")
      .select("id")
      .eq("name", fullName)
      .maybeSingle();

    if (existingEmployee) {
      return NextResponse.json(
        { error: "同じ名前の社員がすでに登録されています" },
        { status: 400 }
      );
    }

    const { data: createdUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      });

    if (authError || !createdUser.user) {
      return NextResponse.json(
        { error: authError?.message ?? "Auth作成失敗" },
        { status: 400 }
      );
    }

    const { error: employeeError } = await supabaseAdmin
      .from("employees")
      .insert([
        {
          auth_user_id: createdUser.user.id,
          name: fullName,
          role: "worker",
        },
      ]);

    if (employeeError) {
      return NextResponse.json(
        { error: employeeError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      password: tempPassword,
    });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラー" },
      { status: 500 }
    );
  }
}