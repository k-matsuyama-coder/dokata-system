import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rows } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    for (const r of rows) {
      const contractor = r[0];
      const manager = r[1];
      const site = r[2];

      if (!contractor || !site) continue;

      // ① 元請が無ければ追加
      const { data: existing } = await supabase
        .from("contractors")
        .select("id")
        .eq("name", contractor)
        .single();

      if (!existing) {
        await supabase.from("contractors").insert({
          name: contractor,
        });
      }

      // ② 現場登録
      await supabase.from("sites").insert({
        contractor_name: contractor,
        manager_name: manager || null,
        site_name: site,
      });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "server error" }, { status: 500 });
  }
}