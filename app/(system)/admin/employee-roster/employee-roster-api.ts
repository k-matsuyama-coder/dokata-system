import { supabase } from "@/lib/supabase";
import { hasRole } from "@/app/types/auth";
import type {
    EmployeePrivateProfileSummary,
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

  return { organizationId };
}

export async function loadEmployeeRoster(): Promise<
  EmployeeRosterRow[]
> {
  const { organizationId } = await getAdminContext();

  const [employeesResult, profilesResult] =
    await Promise.all([
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

  if (employeesResult.error) {
    throw new Error(
      `社員一覧取得失敗: ${employeesResult.error.message}`
    );
  }

  if (profilesResult.error) {
    throw new Error(
      `個人情報取得失敗: ${profilesResult.error.message}`
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

  return employees.map((employee) => ({
    ...employee,
    privateProfile:
      profileMap.get(employee.id) ?? null,
  }));
}