import { supabase } from "@/lib/supabase";
import { hasRole } from "@/app/types/auth";
import type {
    EmployeePrivateProfileSummary,
    EmployeeRoster,
    EmployeeRosterDraftInput,
    EmployeeRosterEditorData,
    EmployeeRosterMember,
    EmployeeRosterRow,
    EmployeeSummary,
  } from "./employee-roster-types";

async function getAdminContext() {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  const user = userData.user;

  if (userError || !user) {
    throw new Error("ログインしてください");
  }

  const { data: sessionData } =
    await supabase.auth.getSession();

  const token = sessionData.session?.access_token;

  if (!token) {
    throw new Error("ログイン情報がありません");
  }

  const response = await fetch(
    "/api/current-organization",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result = await response.json();

  if (!response.ok || !result.organizationId) {
    throw new Error(
      result.error || "会社情報を取得できません"
    );
  }

  const organizationId = result.organizationId as string;

  const { data: currentEmployee, error: employeeError } =
    await supabase
      .from("employees")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("auth_user_id", user.id)
      .single();

  if (
    employeeError ||
    !currentEmployee ||
    !hasRole(currentEmployee.role, "admin")
  ) {
    throw new Error("管理者のみ操作できます");
  }

  return {
    organizationId,
  };
}

export async function loadSavedEmployeeRosters(): Promise<
  EmployeeRoster[]
> {
  const { organizationId } = await getAdminContext();

  const { data, error } = await supabase
    .from("employee_rosters")
    .select("*")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(
      `保存済み名簿取得失敗: ${error.message}`
    );
  }

  return (data ?? []) as EmployeeRoster[];
}

export async function createEmployeeRosterDraft(): Promise<
  EmployeeRoster
> {
  const { organizationId } = await getAdminContext();

  const now = new Date();

  const title =
    `作業員名簿 ` +
    new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

  const { data, error } = await supabase
    .from("employee_rosters")
    .insert({
      organization_id: organizationId,
      title,
      status: "draft",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      error?.message || "新しい名簿を作成できません"
    );
  }

  return data as EmployeeRoster;
}

export async function deleteEmployeeRosterDraft(
  rosterId: string
) {
  const { organizationId } = await getAdminContext();

  const { error } = await supabase
    .from("employee_rosters")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", rosterId)
    .eq("status", "draft");

  if (error) {
    throw new Error(
      `下書きを削除できません: ${error.message}`
    );
  }
}

export async function loadEmployeeRosterEditor(
    rosterId: string
  ): Promise<EmployeeRosterEditorData> {
    const { organizationId } = await getAdminContext();
  
    const [
      rosterResult,
      membersResult,
      employeesResult,
      profilesResult,
    ] = await Promise.all([
      supabase
        .from("employee_rosters")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("id", rosterId)
        .single(),
  
      supabase
        .from("employee_roster_members")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("roster_id", rosterId)
        .order("display_order", { ascending: true }),
  
      supabase
        .from("employees")
        .select(
          "id, organization_id, name, company_name, role"
        )
        .eq("organization_id", organizationId)
        .order("name", { ascending: true }),
  
      supabase
      .from("employee_private_profiles")
      .select("employee_id, updated_at")
      .eq("organization_id", organizationId),
    ]);
  
    if (rosterResult.error || !rosterResult.data) {
      throw new Error(
        rosterResult.error?.message ||
          "作業員名簿が見つかりません"
      );
    }
  
    if (membersResult.error) {
      throw new Error(
        `掲載作業員取得失敗: ${membersResult.error.message}`
      );
    }
  
    if (employeesResult.error) {
      throw new Error(
        `社員一覧取得失敗: ${employeesResult.error.message}`
      );
    }
  
    if (profilesResult.error) {
      throw new Error(
        `作業員情報取得失敗: ${profilesResult.error.message}`
      );
    }
  
    const employees =
      (employeesResult.data ?? []) as EmployeeSummary[];
  
      const profiles =
      (profilesResult.data ??
        []) as EmployeePrivateProfileSummary[];
  
    const profileMap = new Map(
      profiles.map((profile) => [
        profile.employee_id,
        profile,
      ])
    );
  
    const candidates: EmployeeRosterRow[] =
      employees.map((employee) => ({
        ...employee,
        privateProfile:
          profileMap.get(employee.id) ?? null,
      }));
  
    return {
      roster: rosterResult.data as EmployeeRoster,
  
      members:
        (membersResult.data ??
          []) as EmployeeRosterMember[],
  
      candidates,
    };
  }
  
  export async function saveEmployeeRosterDraft(
    rosterId: string,
    input: EmployeeRosterDraftInput
  ): Promise<EmployeeRosterEditorData> {
    await getAdminContext();
  
    const { error } = await supabase.rpc(
      "save_employee_roster_draft",
      {
        p_roster_id: rosterId,
        p_title: input.title,
  
        p_business_office_name:
          input.business_office_name,
  
        p_site_manager_name:
          input.site_manager_name,
  
        p_primary_company_name:
          input.primary_company_name,
  
        p_primary_representative_name:
          input.primary_representative_name,
  
        p_primary_is_related_member:
          input.primary_is_related_member,
  
        p_secondary_company_name:
          input.secondary_company_name,
  
        p_secondary_representative_name:
          input.secondary_representative_name,
  
        p_secondary_is_related_member:
          input.secondary_is_related_member,
  
        p_prime_contractor_confirmation:
          input.prime_contractor_confirmation,
  
        p_confirmation_date:
          input.confirmation_date || null,
  
        p_members: input.members.map(
          (member, index) => ({
            employee_id: member.employee_id,
            display_order: index,
            roster_number: member.roster_number,
            role_marks: member.role_marks,
            site_entry_date:
              member.site_entry_date || null,
            acceptance_training_date:
              member.acceptance_training_date || null,
          })
        ),
      }
    );
  
    if (error) {
      throw new Error(
        `作業員名簿を保存できません: ${error.message}`
      );
    }
  
    return loadEmployeeRosterEditor(rosterId);
  }

  export async function finalizeEmployeeRoster(
    rosterId: string
  ): Promise<EmployeeRosterEditorData> {
    await getAdminContext();
  
    const { error } = await supabase.rpc(
      "finalize_employee_roster",
      {
        target_roster_id: rosterId,
      }
    );
  
    if (error) {
      throw new Error(
        `作業員名簿を確定できません: ${error.message}`
      );
    }
  
    return loadEmployeeRosterEditor(rosterId);
  }