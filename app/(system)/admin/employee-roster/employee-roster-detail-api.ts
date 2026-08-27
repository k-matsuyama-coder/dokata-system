import { supabase } from "@/lib/supabase";
import { hasRole } from "@/app/types/auth";
import type {
  EmployeeHealthProfile,
  EmployeeHealthProfileInput,
  EmployeePrivateProfile,
  EmployeePrivateProfileInput,
  EmployeeSummary,
} from "./employee-roster-types";

async function getAdminContext() {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  const user = userData.user;

  if (userError || !user) {
    throw new Error("ログインしてください");
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    throw new Error("ログイン情報がありません");
  }

  const response = await fetch("/api/current-organization", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok || !result.organizationId) {
    throw new Error(result.error || "会社情報を取得できません");
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

export async function loadEmployeeRosterDetail(
  employeeId: string
) {
  const { organizationId } = await getAdminContext();

  const [
    employeeResult,
    privateProfileResult,
    healthProfileResult,
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("id, organization_id, name, company_name, role")
      .eq("organization_id", organizationId)
      .eq("id", employeeId)
      .single(),

    supabase
      .from("employee_private_profiles")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("employee_id", employeeId)
      .maybeSingle(),

    supabase
      .from("employee_health_profiles")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("employee_id", employeeId)
      .maybeSingle(),
  ]);

  if (employeeResult.error || !employeeResult.data) {
    throw new Error(
      employeeResult.error?.message ||
        "社員情報を取得できません"
    );
  }

  if (privateProfileResult.error) {
    throw new Error(
      `個人情報取得失敗: ${privateProfileResult.error.message}`
    );
  }

  if (healthProfileResult.error) {
    throw new Error(
      `健康情報取得失敗: ${healthProfileResult.error.message}`
    );
  }

  return {
    employee: employeeResult.data as EmployeeSummary,

    profile:
      (privateProfileResult.data as
        | EmployeePrivateProfile
        | null) ?? null,

    healthProfile:
      (healthProfileResult.data as
        | EmployeeHealthProfile
        | null) ?? null,
  };
}

function emptyToNull(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

function numberToNull(value?: string) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return null;
  }

  const numberValue = Number(trimmed);

  if (!Number.isFinite(numberValue)) {
    throw new Error("数値項目に正しい数字を入力してください");
  }

  return numberValue;
}

async function confirmEmployee(
  organizationId: string,
  employeeId: string
) {
  const { data, error } = await supabase
    .from("employees")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", employeeId)
    .single();

  if (error || !data) {
    throw new Error("保存対象の社員が見つかりません");
  }
}

export async function saveEmployeePrivateProfile(
  employeeId: string,
  input: EmployeePrivateProfileInput
) {
  const { organizationId } = await getAdminContext();

  await confirmEmployee(organizationId, employeeId);

  const { data, error } = await supabase
    .from("employee_private_profiles")
    .upsert(
      {
        organization_id: organizationId,
        employee_id: employeeId,

        legal_name: emptyToNull(input.legal_name),
        legal_name_kana: emptyToNull(input.legal_name_kana),
        birth_date: emptyToNull(input.birth_date),

        job_type: emptyToNull(input.job_type),
        hired_on: emptyToNull(input.hired_on),
        experience_years: numberToNull(
          input.experience_years
        ),

        postal_code: emptyToNull(input.postal_code),
        address_line1: emptyToNull(input.address_line1),
        address_line2: emptyToNull(input.address_line2),
        phone_number: emptyToNull(input.phone_number),

        emergency_contact_name: emptyToNull(
          input.emergency_contact_name
        ),
        emergency_contact_relationship: emptyToNull(
          input.emergency_contact_relationship
        ),
        emergency_contact_phone: emptyToNull(
          input.emergency_contact_phone
        ),

        health_insurance_name: emptyToNull(
          input.health_insurance_name
        ),
        health_insurance_number: emptyToNull(
          input.health_insurance_number
        ),

        pension_insurance_name: emptyToNull(
          input.pension_insurance_name
        ),
        pension_insurance_number: emptyToNull(
          input.pension_insurance_number
        ),

        employment_insurance_name: emptyToNull(
          input.employment_insurance_name
        ),
        employment_insurance_number: emptyToNull(
          input.employment_insurance_number
        ),

        construction_retirement_book_owned:
          input.construction_retirement_book_owned ?? null,
      },
      {
        onConflict: "employee_id",
      }
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      error?.message || "個人情報を保存できません"
    );
  }

  return data as EmployeePrivateProfile;
}

export async function saveEmployeeHealthProfile(
  employeeId: string,
  input: EmployeeHealthProfileInput
) {
  const { organizationId } = await getAdminContext();

  await confirmEmployee(organizationId, employeeId);

  const bloodPressureHigh = numberToNull(
    input.blood_pressure_high
  );

  const bloodPressureLow = numberToNull(
    input.blood_pressure_low
  );

  if (
    bloodPressureHigh !== null &&
    (!Number.isInteger(bloodPressureHigh) ||
      bloodPressureHigh <= 0)
  ) {
    throw new Error("最高血圧は正の整数で入力してください");
  }

  if (
    bloodPressureLow !== null &&
    (!Number.isInteger(bloodPressureLow) ||
      bloodPressureLow <= 0)
  ) {
    throw new Error("最低血圧は正の整数で入力してください");
  }

  const { data, error } = await supabase
    .from("employee_health_profiles")
    .upsert(
      {
        organization_id: organizationId,
        employee_id: employeeId,

        recent_health_check_date: emptyToNull(
          input.recent_health_check_date
        ),

        health_check_medical_institution: emptyToNull(
          input.health_check_medical_institution
        ),

        blood_pressure_high: bloodPressureHigh,
        blood_pressure_low: bloodPressureLow,
        blood_type: emptyToNull(input.blood_type),

        special_health_check_date: emptyToNull(
          input.special_health_check_date
        ),

        special_health_check_type: emptyToNull(
          input.special_health_check_type
        ),
      },
      {
        onConflict: "employee_id",
      }
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      error?.message || "健康情報を保存できません"
    );
  }

  return data as EmployeeHealthProfile;
}