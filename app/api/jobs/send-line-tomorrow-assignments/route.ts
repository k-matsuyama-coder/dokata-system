import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type EmployeeRow = {
  id: string;
  organization_id: string;
  name: string;
  line_user_id: string | null;
};

type SiteMemberRow = {
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

function buildTomorrowAssignmentMessage(
  targetDate: string,
  assignments: AssignmentRow[]
): string {
  if (assignments.length === 0) {
    return `明日（${targetDate}）の現場予定はありません。`;
  }

  const lines: string[] = [`明日（${targetDate}）の現場予定です。`, ""];

  assignments.forEach((assignment, index) => {
    lines.push(`${index + 1}件目`);
    lines.push(`現場: ${assignment.site_name ?? "-"}`);
    lines.push(`区分: ${formatShiftLabel(assignment.shift_type)}`);
    lines.push(`集合: ${assignment.meeting_time ?? "-"}`);
    lines.push(`元請: ${assignment.contractor_name ?? "-"}`);
    lines.push(`担当: ${assignment.manager_name ?? "-"}`);
    lines.push(`住所: ${assignment.address ?? "-"}`);

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
      messages: [
        {
          type: "text",
          text,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LINE push failed: ${response.status} ${errorBody}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const cronSecret = requireEnv("CRON_SECRET");
    const authHeader = req.headers.get("authorization");

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY")
    );

    const targetDate = getTomorrowJstDateString();

    const { data: employees, error: employeeError } = await supabase
      .from("employees")
      .select("id, organization_id, name, line_user_id")
      .not("line_user_id", "is", null);

    if (employeeError) {
      throw employeeError;
    }

    const linkedEmployees = (employees ?? []) as EmployeeRow[];

    console.log("linkedEmployees", linkedEmployees.map((row) => ({
      id: row.id,
      name: row.name,
      hasLineUserId: Boolean(row.line_user_id),
    })));

    if (linkedEmployees.length === 0) {
      return NextResponse.json({
        ok: true,
        targetDate,
        sent: 0,
        failed: 0,
        message: "line_user_id が登録された社員がいません。",
      });
    }

    const organizationIds = [...new Set(linkedEmployees.map((row) => row.organization_id))];
    const employeeNames = [...new Set(linkedEmployees.map((row) => row.name))];

    const { data: siteMembers, error: siteMemberError } = await supabase
      .from("assignment_site_members")
      .select("assignment_id, employee_name, work_date")
      .in("organization_id", organizationIds)
      .eq("work_date", targetDate)
      .in("employee_name", employeeNames);

    if (siteMemberError) {
      throw siteMemberError;
    }

    const memberRows = (siteMembers ?? []) as SiteMemberRow[];

    console.log("targetDate", targetDate);
    console.log("memberRows", memberRows);

    const assignmentIds = [...new Set(memberRows.map((row) => row.assignment_id))];

    let assignmentMap = new Map<string, AssignmentRow>();

    if (assignmentIds.length > 0) {
      const { data: assignments, error: assignmentError } = await supabase
        .from("assignments")
        .select(
          "id, organization_id, site_name, contractor_name, manager_name, address, meeting_time, shift_type"
        )
        .in("id", assignmentIds);

      if (assignmentError) {
        throw assignmentError;
      }

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

      const membersForEmployee = memberRows.filter(
        (row) => row.employee_name === employee.name
      );

      const assignmentsForEmployee = membersForEmployee
        .map((row) => assignmentMap.get(row.assignment_id))
        .filter((row): row is AssignmentRow => Boolean(row));

      const uniqueAssignments = Array.from(
        new Map(assignmentsForEmployee.map((row) => [row.id, row])).values()
      );

      const messageText = buildTomorrowAssignmentMessage(targetDate, uniqueAssignments);

      console.log("employeeCheck", {
        employeeId: employee.id,
        employeeName: employee.name,
        lineUserId: employee.line_user_id,
        matchedMemberCount: membersForEmployee.length,
        matchedAssignmentCount: uniqueAssignments.length,
        messageText,
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

        console.log("send-line sent", {
          employeeId: employee.id,
          employeeName: employee.name,
          targetDate,
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

        console.error("send-line failed", {
          employeeId: employee.id,
          employeeName: employee.name,
          error: errorMessage,
        });

        failed += 1;
      }
    }

    console.log("send-line result", {
      targetDate,
      sent,
      failed,
    });

    return NextResponse.json({
      ok: true,
      targetDate,
      sent,
      failed,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}