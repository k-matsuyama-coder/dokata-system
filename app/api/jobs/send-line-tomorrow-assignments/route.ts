import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type EmployeeRow = {
  id: string;
  organization_id: string;
  name: string;
  line_user_id: string | null;
};

type SiteMemberRow = {
  organization_id: string;
  assignment_id: string;
  employee_name: string;
  work_date: string;
};

type AssignmentRow = {
  id: string;
  organization_id: string;
  site_name: string | null;
  contractor_name: string | null;
  manager_name: string | null;
  address: string | null;
  meeting_time: string | null;
  shift_type: string | null;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

function getTomorrowJstDateString(): string {
  const now = new Date();
  const jstNow = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
  );
  jstNow.setDate(jstNow.getDate() + 1);

  const year = jstNow.getFullYear();
  const month = String(jstNow.getMonth() + 1).padStart(2, "0");
  const day = String(jstNow.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatShiftLabel(shiftType: string | null): string {
  return shiftType === "night" ? "夜勤" : "日勤";
}

function buildTomorrowAssignmentMessage(params: {
  targetDate: string;
  assignments: AssignmentRow[];
  memberNamesByAssignmentId: Map<string, string[]>;
}): string {
  const { targetDate, assignments, memberNamesByAssignmentId } = params;

  if (assignments.length === 0) {
    return `明日（${targetDate}）の現場予定はありません。`;
  }

  const lines: string[] = [`明日（${targetDate}）の現場予定です。`, ""];

  assignments.forEach((assignment, index) => {
    const memberNames = memberNamesByAssignmentId.get(assignment.id) ?? [];

    lines.push(`${index + 1}件目`);
    lines.push(`現場: ${assignment.site_name ?? "-"}`);
    lines.push(`区分: ${formatShiftLabel(assignment.shift_type)}`);
    lines.push(`集合: ${assignment.meeting_time ?? "-"}`);
    lines.push(`元請: ${assignment.contractor_name ?? "-"}`);
    lines.push(`担当: ${assignment.manager_name ?? "-"}`);
    lines.push(`住所: ${assignment.address ?? "-"}`);
    lines.push(`メンバー: ${memberNames.length > 0 ? memberNames.join("、") : "-"}`);

    if (index < assignments.length - 1) {
      lines.push("");
    }
  });

  return lines.join("\n");
}

async function pushLineTextMessage(userId: string, text: string): Promise<void> {
  const accessToken = requireEnv("LINE_CHANNEL_ACCESS_TOKEN");

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      to: userId,
      messages: [{ type: "text", text }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LINE push failed: ${response.status} ${errorBody}`);
  }
}

async function runJob() {
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  );

  const targetDate = getTomorrowJstDateString();

  const { data: employees, error: employeeError } = await supabase
    .from("employees")
    .select("id, organization_id, name, line_user_id")
    .not("line_user_id", "is", null);

  if (employeeError) throw employeeError;

  const linkedEmployees = (employees ?? []) as EmployeeRow[];

  if (linkedEmployees.length === 0) {
    return {
      ok: true,
      targetDate,
      sent: 0,
      failed: 0,
      message: "line_user_id が登録された社員がいません。",
    };
  }

  const organizationIds = [...new Set(linkedEmployees.map((row) => row.organization_id))];

  const { data: siteMembers, error: siteMemberError } = await supabase
    .from("assignment_site_members")
    .select("organization_id, assignment_id, employee_name, work_date")
    .in("organization_id", organizationIds)
    .eq("work_date", targetDate);

  if (siteMemberError) throw siteMemberError;

  const allMemberRows = (siteMembers ?? []) as SiteMemberRow[];
  const assignmentIds = [...new Set(allMemberRows.map((row) => row.assignment_id))];

  let assignmentMap = new Map<string, AssignmentRow>();

  if (assignmentIds.length > 0) {
    const { data: assignments, error: assignmentError } = await supabase
      .from("assignments")
      .select(
        "id, organization_id, site_name, contractor_name, manager_name, address, meeting_time, shift_type"
      )
      .in("id", assignmentIds);

    if (assignmentError) throw assignmentError;

    assignmentMap = new Map(
      ((assignments ?? []) as AssignmentRow[]).map((row) => [row.id, row])
    );
  }

  let sent = 0;
  let failed = 0;

  for (const employee of linkedEmployees) {
    if (!employee.line_user_id) {
      failed += 1;
      continue;
    }

    const membersForEmployee = allMemberRows.filter(
      (row) =>
        row.organization_id === employee.organization_id &&
        row.employee_name === employee.name
    );

    const employeeAssignmentIds = [...new Set(membersForEmployee.map((row) => row.assignment_id))];

    const assignmentsForEmployee = employeeAssignmentIds
      .map((assignmentId) => assignmentMap.get(assignmentId))
      .filter((row): row is AssignmentRow => Boolean(row));

    const uniqueAssignments = Array.from(
      new Map(assignmentsForEmployee.map((row) => [row.id, row])).values()
    );

    const memberNamesByAssignmentId = new Map<string, string[]>();

    for (const assignmentId of employeeAssignmentIds) {
      const memberNames = Array.from(
        new Set(
          allMemberRows
            .filter(
              (row) =>
                row.organization_id === employee.organization_id &&
                row.assignment_id === assignmentId
            )
            .map((row) => row.employee_name)
        )
      );

      memberNamesByAssignmentId.set(assignmentId, memberNames);
    }

    const messageText = buildTomorrowAssignmentMessage({
      targetDate,
      assignments: uniqueAssignments,
      memberNamesByAssignmentId,
    });

    try {
      await pushLineTextMessage(employee.line_user_id, messageText);

      await supabase.from("line_delivery_logs").insert({
        organization_id: employee.organization_id,
        employee_id: employee.id,
        target_date: targetDate,
        delivery_type: "tomorrow_assignment",
        status: "sent",
        message_text: messageText,
      });

      sent += 1;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      await supabase.from("line_delivery_logs").insert({
        organization_id: employee.organization_id,
        employee_id: employee.id,
        target_date: targetDate,
        delivery_type: "tomorrow_assignment",
        status: "failed",
        message_text: messageText,
        error_message: errorMessage,
      });

      failed += 1;
    }
  }

  return {
    ok: true,
    targetDate,
    sent,
    failed,
  };
}

export async function GET(req: NextRequest) {
  try {
    const cronHeader = req.headers.get("user-agent");
    const isVercelCron = cronHeader === "vercel-cron/1.0";
    const authHeader = req.headers.get("authorization");
    const cronSecret = requireEnv("CRON_SECRET");

    if (!isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const result = await runJob();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = requireEnv("CRON_SECRET");

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const result = await runJob();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}