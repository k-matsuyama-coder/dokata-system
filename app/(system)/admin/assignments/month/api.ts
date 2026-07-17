import { supabase } from "@/lib/supabase";

export async function getCurrentOrganization() {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    throw new Error("ログイン情報なし");
  }

  const res = await fetch("/api/current-organization", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || "会社情報取得失敗");
  }

  return result.organizationId as string;
}

export async function getEmployees(organizationId: string) {
  const { data, error } = await supabase
    .from("employees")
    .select("name, company_name")
    .eq("organization_id", organizationId)
    .order("company_name", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export async function getVehicles(organizationId: string) {
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, vehicle_name, vehicle_type")
    .eq("organization_id", organizationId)
    .order("vehicle_name", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export async function getContractors(organizationId: string) {
  const { data, error } = await supabase
    .from("contractors")
    .select("id, name")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export async function getContractorContacts(organizationId: string) {
  const { data, error } = await supabase
    .from("contractor_contacts")
    .select("id, contractor_id, manager_name, contact_phone")
    .eq("organization_id", organizationId);

  if (error) throw error;

  return data ?? [];
}

export async function getAssignments(organizationId: string) {
  const { data, error } = await supabase
    .from("assignments")
    .select(
      "id, assignment_date, site_name, contractor_name, construction_type, group_key, shift_type, start_time, end_time, manager_name, contact_phone, address, meeting_time, start_date, end_date"
    )
    .eq("organization_id", organizationId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export async function getAssignmentFiles(
  organizationId: string,
  assignmentIds: string[]
) {
  if (assignmentIds.length === 0) return [];

  const { data, error } = await supabase
    .from("assignment_files")
    .select("id, assignment_id, file_name, file_url, file_path")
    .eq("organization_id", organizationId)
    .in("assignment_id", assignmentIds);

  if (error) throw error;

  return data ?? [];
}

export async function getSiteMembers(
  organizationId: string,
  assignmentIds: string[],
  startDate: string,
  endDate: string
) {
  if (assignmentIds.length === 0) return [];

  const pageSize = 1000;
  const allMembers = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("assignment_site_members")
      .select(
        "id, assignment_id, work_date, employee_name, is_driver, is_operator, is_foreman, heavy_equipment"
      )
      .eq("organization_id", organizationId)
      .in("assignment_id", assignmentIds)
      .gte("work_date", startDate)
      .lte("work_date", endDate)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;

    allMembers.push(...(data ?? []));

    if (!data || data.length < pageSize) {
      break;
    }
  }

  return allMembers;
}

export async function getDailyInfos(
  organizationId: string,
  assignmentIds: string[],
  startDate: string,
  endDate: string
) {
  if (assignmentIds.length === 0) return [];

  const { data, error } = await supabase
    .from("assignment_site_daily_infos")
    .select("id, assignment_id, work_date, planned_count, detail, vehicle_names")
    .eq("organization_id", organizationId)
    .in("assignment_id", assignmentIds)
    .gte("work_date", startDate)
    .lte("work_date", endDate);

  if (error) throw error;

  return data ?? [];
}

export async function getShiftRequests(
  organizationId: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await supabase
    .from("shift_requests")
    .select("id, employee_name, request_date, status")
    .eq("organization_id", organizationId)
    .gte("request_date", startDate)
    .lte("request_date", endDate);

  if (error) throw error;

  return data ?? [];
}