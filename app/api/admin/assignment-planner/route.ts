import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
    EQUIPMENT,
    buildPlan,
    parseRequirements,
    validDate,
    type Capability,
    type PlannerEmployee,
    type PlannerAssignment,
    type PlannerMember,
  } from "@/lib/assignmentPlanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageQuery = {
  range: (
    from: number,
    to: number
  ) => PromiseLike<{
    data: unknown[] | null;
    error: { message: string } | null;
  }>;
};

// 1000件を超えても全件取得する
async function all<T>(makeQuery: () => PageQuery): Promise<T[]> {
  const rows: T[] = [];

  for (let start = 0; ; start += 1000) {
    const { data, error } = await makeQuery().range(
      start,
      start + 999
    );

    if (error) {
      throw new Error(error.message);
    }

    rows.push(...((data ?? []) as T[]));

    if (!data || data.length < 1000) {
      return rows;
    }
  }
}

// ログイン中の管理者と所属会社を確認する
async function context(request: Request) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw new Error("ログインしてください。");
  }

  const { data, error } = await client.auth.getUser(token);

  if (error || !data.user) {
    throw new Error("ログイン情報を確認できません。");
  }

  const employee = await client
    .from("employees")
    .select("organization_id, role")
    .eq("auth_user_id", data.user.id)
    .single();

  if (
    employee.error ||
    employee.data?.role !== "admin" ||
    !employee.data.organization_id
  ) {
    throw new Error("会社の管理者のみ操作できます。");
  }

  return {
    client,
    organizationId: employee.data.organization_id as string,
  };
}

function message(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "処理に失敗しました。";
}

// 社員一覧と、保存済みの対応設定を取得
export async function GET(request: Request) {
  try {
    const { client, organizationId } = await context(request);

    const [employees, capabilities] = await Promise.all([
      all<PlannerEmployee>(() =>
        client
          .from("employees")
          .select("id, name, company_name")
          .eq("organization_id", organizationId)
          .order("id")
      ),

      all<Capability>(() =>
        client
          .from("assignment_employee_capabilities")
          .select("employee_id, equipment, can_drive")
          .eq("organization_id", organizationId)
          .order("employee_id")
      ),
    ]);

    return NextResponse.json(
      { employees, capabilities },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: message(error) },
      { status: 400 }
    );
  }
}

// 社員1人分の対応設定を保存
export async function POST(request: Request) {
  try {
    const { client, organizationId } = await context(request);
    const body = await request.json();

        // 配置案の作成。ここでは番割に保存しない。
        if (body.action === "preview") {
            if (
              typeof body.date !== "string" ||
              !validDate(body.date) ||
              typeof body.assignmentId !== "string" ||
              !body.assignmentId
            ) {
              throw new Error("現場と日付を選択してください。");
            }
      
            const date = body.date;
            const assignmentId = body.assignmentId;
            const requirements = parseRequirements(body.requirements);
      
            const offsetDate = (offset: number) => {
              const value = new Date(`${date}T00:00:00Z`);
              value.setUTCDate(value.getUTCDate() + offset);
              return value.toISOString().slice(0, 10);
            };
      
            const [
              employees,
              capabilities,
              assignments,
              bookings,
              holidays,
              history,
            ] = await Promise.all([
              all<PlannerEmployee>(() =>
                client
                  .from("employees")
                  .select("id, name, company_name")
                  .eq("organization_id", organizationId)
                  .order("id")
              ),
      
              all<Capability>(() =>
                client
                  .from("assignment_employee_capabilities")
                  .select("employee_id, equipment, can_drive")
                  .eq("organization_id", organizationId)
                  .order("employee_id")
              ),
      
              all<PlannerAssignment>(() =>
                client
                  .from("assignments")
                  .select(
                    "id, site_name, start_date, end_date, shift_type, start_time, end_time"
                  )
                  .eq("organization_id", organizationId)
                  .order("id")
              ),
      
              // 日付をまたぐ夜勤も確認するため、前後の日を含める
              all<PlannerMember>(() =>
                client
                  .from("assignment_site_members")
                  .select("assignment_id, employee_name, work_date")
                  .eq("organization_id", organizationId)
                  .gte("work_date", offsetDate(-2))
                  .lte("work_date", offsetDate(1))
                  .order("id")
              ),
      
              all<{
                employee_name: string;
                request_date: string;
              }>(() =>
                client
                  .from("shift_requests")
                  .select("employee_name, request_date")
                  .eq("organization_id", organizationId)
                  .gte("request_date", date)
                  .lte("request_date", offsetDate(1))
                  .order("id")
              ),
      
              // 同じ現場の直近90日間の配置実績
              all<PlannerMember>(() =>
                client
                  .from("assignment_site_members")
                  .select("assignment_id, employee_name, work_date")
                  .eq("organization_id", organizationId)
                  .eq("assignment_id", assignmentId)
                  .gte("work_date", offsetDate(-90))
                  .lt("work_date", date)
                  .order("id")
              ),
            ]);
      
            const plan = buildPlan({
              employees,
              capabilities,
              assignments,
              bookings,
              holidays,
              history,
              assignmentId,
              date,
              requirements,
            });
      
            return NextResponse.json({ plan });
          }

    if (body.action !== "capability") {
      throw new Error("操作が不正です。");
    }

    if (
      typeof body.employeeId !== "string" ||
      !Array.isArray(body.equipment) ||
      body.equipment.some(
        (value: unknown) =>
          !EQUIPMENT.includes(
            value as (typeof EQUIPMENT)[number]
          )
      ) ||
      typeof body.canDrive !== "boolean"
    ) {
      throw new Error("対応設定が不正です。");
    }

    // 他社の社員を変更できないように確認
    const employee = await client
      .from("employees")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("id", body.employeeId)
      .single();

    if (employee.error || !employee.data) {
      throw new Error("社員が見つかりません。");
    }

    const result = await client
      .from("assignment_employee_capabilities")
      .upsert(
        {
          organization_id: organizationId,
          employee_id: body.employeeId,
          equipment: [...new Set(body.equipment)],
          can_drive: body.canDrive,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "organization_id,employee_id",
        }
      );

    if (result.error) {
      throw new Error(result.error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: message(error) },
      { status: 400 }
    );
  }
}