import { createClient } from "@supabase/supabase-js";
import { hasRole } from "@/app/types/auth";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return Response.json({ error: "認証情報がありません" }, { status: 401 });
    }

    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: userData, error: userError } =
      await supabaseUser.auth.getUser();

    if (userError || !userData.user) {
      return Response.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: adminEmployee } = await supabase
      .from("employees")
      .select("role, organization_id")
      .eq("auth_user_id", userData.user.id)
      .single();

    if (!adminEmployee?.organization_id) {
      return Response.json(
        { error: "会社情報が取得できません" },
        { status: 403 }
      );
    }

    if (!hasRole(adminEmployee.role, "admin")) {
      return Response.json(
        { error: "管理者のみ実行できます" },
        { status: 403 }
      );
    }

    const organizationId = adminEmployee.organization_id;

    const body = await req.json();
    const { rows } = body;

    if (!Array.isArray(rows)) {
      return Response.json({ error: "CSVデータがありません" }, { status: 400 });
    }

    let insertedCount = 0;

    for (const row of rows) {
      const contractor = String(row[0] ?? "").replace("\uFEFF", "").trim();
      const manager = String(row[1] ?? "").trim();
      const site = String(row[2] ?? "").trim();

      if (!contractor || !site) continue;

      const { data: existingContractor } = await supabase
        .from("contractors")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("name", contractor)
        .maybeSingle();

      if (!existingContractor) {
        const { error: contractorError } = await supabase
          .from("contractors")
          .insert({
            organization_id: organizationId,
            name: contractor,
          });

        if (contractorError) {
          return Response.json(
            { error: "元請登録失敗: " + contractorError.message },
            { status: 500 }
          );
        }
      }

      const { data: existingSite } = await supabase
        .from("sites")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("contractor_name", contractor)
        .eq("site_name", site)
        .maybeSingle();

      if (existingSite) continue;

      const { error: siteError } = await supabase
        .from("sites")
        .insert({
          organization_id: organizationId,
          contractor_name: contractor,
          manager_name: manager || null,
          site_name: site,
        });

      if (siteError) {
        return Response.json(
          { error: "現場登録失敗: " + siteError.message },
          { status: 500 }
        );
      }

      insertedCount++;
    }

    return Response.json({
      success: true,
      insertedCount,
    });
  } catch {
    return Response.json({ error: "server error" }, { status: 500 });
  }
}