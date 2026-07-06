import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type ViewMode = "week" | "next3days";

type PublicLinkRow = {
  id: string;
  token: string;
  organization_id: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  view_mode: ViewMode;
  base_date: string;
};

type OrganizationRow = {
  name: string | null;
};

type AssignmentRow = {
  id: string;
  contractor_name: string | null;
  site_name: string | null;
  shift_type: string | null;
  manager_name: string | null;
  contact_phone: string | null;
  address: string | null;
  meeting_time: string | null;
  sort_order: number | null;
  created_at: string;
};

type AssignmentSiteMemberRow = {
  assignment_id: string;
  employee_name: string;
  is_foreman: boolean | null;
  work_date: string;
};

type PublicAssignmentMember = {
  employee_name: string;
  is_foreman: boolean | null;
};

type PublicAssignmentRow = {
  assignment_id: string;
  contractor_name: string | null;
  site_name: string | null;
  shift_type: string | null;
  manager_name: string | null;
  contact_phone: string | null;
  address: string | null;
  meeting_time: string | null;
  notes: string | null;
  members: PublicAssignmentMember[];
};

type PublicAssignmentsDay = {
  date: string;
  label: string;
  assignments: PublicAssignmentRow[];
};

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function isExpired(expiresAt: string) {
  const expires = new Date(expiresAt);
  if (Number.isNaN(expires.getTime())) return true;
  return expires.getTime() <= Date.now();
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

function buildTargetDates(baseDate: string, viewMode: ViewMode) {
  const base = parseDate(baseDate);

  if (Number.isNaN(base.getTime())) {
    return [];
  }

  if (viewMode === "week") {
    const weekStart = startOfWeek(base);

    return Array.from({ length: 7 }, (_, index) => {
      const current = new Date(weekStart);
      current.setDate(weekStart.getDate() + index);
      return formatDate(current);
    });
  }

  return Array.from({ length: 3 }, (_, index) => {
    const current = new Date(base);
    current.setDate(base.getDate() + index + 1);
    return formatDate(current);
  });
}

function buildDayLabel(date: string, index: number, viewMode: ViewMode) {
  if (viewMode === "next3days") {
    if (index === 0) return "明日";
    if (index === 1) return "明後日";
    if (index === 2) return "3日後";
  }

  return ["月", "火", "水", "木", "金", "土", "日"][index] ?? "";
}

function buildAssignmentsForDate(
    date: string,
    assignments: AssignmentRow[],
    members: AssignmentSiteMemberRow[]
  ): PublicAssignmentRow[] {
    const membersByAssignment = new Map<string, PublicAssignmentMember[]>();
  
    for (const member of members) {
      if (member.work_date !== date) continue;
  
      const list = membersByAssignment.get(member.assignment_id) ?? [];
      list.push({
        employee_name: member.employee_name,
        is_foreman: member.is_foreman,
      });
      membersByAssignment.set(member.assignment_id, list);
    }

    function buildAssignmentsForDate(
      date: string,
      assignments: AssignmentRow[],
      members: AssignmentSiteMemberRow[]
    ): PublicAssignmentRow[] {
      const membersByAssignment = new Map<string, PublicAssignmentMember[]>();
    
      for (const member of members) {
        if (member.work_date !== date) continue;
    
        const list = membersByAssignment.get(member.assignment_id) ?? [];
        list.push({
          employee_name: member.employee_name,
          is_foreman: member.is_foreman,
        });
        membersByAssignment.set(member.assignment_id, list);
      }
    
      for (const [assignmentId, list] of membersByAssignment.entries()) {
        const sorted = [...list].sort((a, b) => {
          if (a.is_foreman === b.is_foreman) return 0;
          return a.is_foreman ? -1 : 1;
        });
    
        membersByAssignment.set(assignmentId, sorted);
      }
    
      return assignments
        .map((assignment) => ({
          assignment_id: assignment.id,
          contractor_name: assignment.contractor_name,
          site_name: assignment.site_name,
          shift_type: assignment.shift_type,
          manager_name: assignment.manager_name,
          contact_phone: assignment.contact_phone,
          address: assignment.address,
          meeting_time: assignment.meeting_time,
          notes: null,
          members: membersByAssignment.get(assignment.id) ?? [],
        }))
        .filter((assignment) => assignment.members.length > 0);
    }

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    console.log("public token:", token);

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        {
          ok: false,
          error: "公開トークンが不正です",
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: publicLink, error: publicLinkError } = await supabase
      .from("public_assignment_links")
      .select(
        "id, token, organization_id, expires_at, is_active, created_at, view_mode, base_date"
      )
      .eq("token", token)
      .maybeSingle<PublicLinkRow>();

      console.log("publicLink:", publicLink);

    if (publicLinkError) {
      return NextResponse.json(
        {
          ok: false,
          error: "公開URL情報の取得に失敗しました",
        },
        { status: 500 }
      );
    }

    if (!publicLink) {
      return NextResponse.json(
        {
          ok: false,
          error: "公開URLが見つかりません",
        },
        { status: 404 }
      );
    }

    if (!publicLink.is_active) {
      return NextResponse.json(
        {
          ok: false,
          error: "この公開URLは無効化されています",
        },
        { status: 410 }
      );
    }

    if (isExpired(publicLink.expires_at)) {
      return NextResponse.json(
        {
          ok: false,
          error: "この公開URLの有効期限は切れています",
        },
        { status: 410 }
      );
    }

    const targetDates = buildTargetDates(
      publicLink.base_date,
      publicLink.view_mode ?? "next3days"
    );

    console.log("targetDates:", targetDates);

    const { data: organization, error: organizationError } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", publicLink.organization_id)
      .maybeSingle<OrganizationRow>();

    if (organizationError) {
      return NextResponse.json(
        {
          ok: false,
          error: "組織情報の取得に失敗しました",
        },
        { status: 500 }
      );
    }

    const [
        { data: assignments, error: assignmentsError },
        { data: members, error: membersError },
      ] = await Promise.all([
        supabase
          .from("assignments")
          .select(
            "id, contractor_name, site_name, shift_type, manager_name, contact_phone, address, meeting_time, sort_order, created_at"
          )
          .eq("organization_id", publicLink.organization_id)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true })
          .returns<AssignmentRow[]>(),
        supabase
          .from("assignment_site_members")
          .select("assignment_id, employee_name, is_foreman, work_date")
          .eq("organization_id", publicLink.organization_id)
          .in("work_date", targetDates)
          .returns<AssignmentSiteMemberRow[]>(),
      ]);

      console.log("assignmentsError:", assignmentsError);
      console.log("membersError:", membersError);
      console.log("assignments count:", assignments?.length ?? 0);
      console.log("members count:", members?.length ?? 0);

      if (assignmentsError || membersError) {
        return NextResponse.json(
          {
            ok: false,
            error:
              assignmentsError?.message ??
              membersError?.message ??
              "公開ページ用データの取得に失敗しました",
          },
          { status: 500 }
        );
      }

      const days: PublicAssignmentsDay[] = targetDates.map((date, index) => ({
        date,
        label: buildDayLabel(date, index, publicLink.view_mode ?? "next3days"),
        assignments: buildAssignmentsForDate(
          date,
          assignments ?? [],
          members ?? []
        ),
      }));

    return NextResponse.json(
      {
        ok: true,
        shareTitle: "番割表",
        organizationName: organization?.name ?? null,
        expiresAt: publicLink.expires_at,
        createdAt: publicLink.created_at,
        viewMode: publicLink.view_mode ?? "next3days",
        baseDate: publicLink.base_date,
        days,
      },
      { status: 200 }
    );
} catch (error) {
    console.error("public assignments route error", error);
  
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}