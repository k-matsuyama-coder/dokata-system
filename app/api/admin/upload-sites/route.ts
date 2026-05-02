import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rows } = body;

    if (!Array.isArray(rows)) {
      return Response.json({ error: "CSVデータがありません" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let insertedCount = 0;

    for (const r of rows) {
      const contractor = String(r[0] ?? "").replace("\uFEFF", "").trim();
      const manager = String(r[1] ?? "").trim();
      const site = String(r[2] ?? "").trim();

      if (!contractor || !site) continue;

      const { data: existingContractor } = await supabase
        .from("contractors")
        .select("id")
        .eq("name", contractor)
        .maybeSingle();

      if (!existingContractor) {
        const { error: contractorError } = await supabase
          .from("contractors")
          .insert({ name: contractor });

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
        .eq("contractor_name", contractor)
        .eq("site_name", site)
        .maybeSingle();

      if (existingSite) continue;

      const { error: siteError } = await supabase.from("sites").insert({
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