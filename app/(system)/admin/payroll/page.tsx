// app/(system)/admin/payroll/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";
import { hasRole } from "@/app/types/auth";

type Employee = {
    name: string;
    company_name: string | null;
  };

type DailyReport = {
  id: string;
  report_date: string;
  shift_type: string | null;
  operator_name: string | null;
};

type ReportMember = {
    report_id: string;
    employee_name: string;
    labor: number | string | null;
    overtime: number | string | null;
    is_driver: boolean | null;
  };

type PayrollSetting = {
  id?: string;
  organization_id: string;
  employee_name: string;
  base_salary: number | null;
  day_unit_price: number | null;
  night_unit_price: number | null;
  overtime_unit_price: number | null;
  driver_allowance: number | null;
  operator_allowance: number | null;
  attendance_allowance: number | null;
};

type PayrollDraftMap = Record<string, PayrollSetting>;

type PayrollSummaryRow = {
  employee_name: string;
  attendance_days: number;
  labor_total: number;
  day_labor_total: number;
  night_labor_total: number;
  overtime_total: number;
  driver_count: number;
  operator_count: number;
  estimated_total: number;
  setting: PayrollSetting;
};

function getCurrentMonthString() {
  return new Date().toISOString().slice(0, 7);
}

function getMonthRange(month: string) {
  const [year, monthValue] = month.split("-").map(Number);
  const start = new Date(year, monthValue - 1, 1);
  const end = new Date(year, monthValue, 0);

  const format = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  return {
    startDate: format(start),
    endDate: format(end),
  };
}

function toNumberOrNull(value: string) {
  if (value.trim() === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toNumber(value: number | string | null | undefined) {
    if (value === null || value === undefined || value === "") {
      return 0;
    }
  
    const num = typeof value === "number" ? value : Number(value);
    return Number.isFinite(num) ? num : 0;
  }

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ja-JP").format(Math.round(value));
}

function emptySetting(organizationId: string, employeeName: string): PayrollSetting {
  return {
    organization_id: organizationId,
    employee_name: employeeName,
    base_salary: 0,
    day_unit_price: 0,
    night_unit_price: 0,
    overtime_unit_price: 0,
    driver_allowance: 0,
    operator_allowance: 0,
    attendance_allowance: 0,
  };
}

export default function PayrollPage() {
  const [month, setMonth] = useState(getCurrentMonthString);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [reportMembers, setReportMembers] = useState<ReportMember[]>([]);
  const [settingsMap, setSettingsMap] = useState<PayrollDraftMap>({});
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [savingEmployeeName, setSavingEmployeeName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [settingsWarning, setSettingsWarning] = useState("");
  const [viewerRole, setViewerRole] = useState<string | null>(null);
const [viewerCompanyName, setViewerCompanyName] = useState<string | null>(null);

  useEffect(() => {
    void checkAdminAndLoad();
  }, [month]);

  const checkAdminAndLoad = async () => {
    setAuthChecking(true);
    setErrorMessage("");
  
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
  
      if (!user) {
        window.location.href = "/login";
        return;
      }
  
      const { data: employee, error } = await supabase
        .from("employees")
        .select("role, company_name")
        .eq("auth_user_id", user.id)
        .single();
  
      if (error || !employee) {
        window.location.href = "/home";
        return;
      }
  
      const isAdmin = hasRole(employee.role, "admin");
      const isSuperAdmin = hasRole(employee.role, "super_admin");
  
      if (!isAdmin && !isSuperAdmin) {
        window.location.href = "/home";
        return;
      }
  
      setViewerRole(employee.role ?? null);
      setViewerCompanyName(employee.company_name ?? null);
  
      await fetchAll({
        role: employee.role ?? null,
        companyName: employee.company_name ?? null,
      });
    } finally {
      setAuthChecking(false);
    }
  };

  const fetchAll = async (options?: {
    role?: string | null;
    companyName?: string | null;
  }) => {
    setLoading(true);
    setErrorMessage("");
    setSettingsWarning("");

    try {
      const currentOrganizationId = await getCurrentOrganization();

      if (!currentOrganizationId) {
        setErrorMessage("会社情報が取得できません");
        return;
      }

      setOrganizationId(currentOrganizationId);

      const { startDate, endDate } = getMonthRange(month);

      const [{ data: employeeData, error: employeeError }, { data: reportData, error: reportError }] =
        await Promise.all([
            supabase
            .from("employees")
            .select("name, company_name")
            .eq("organization_id", currentOrganizationId)
            .order("name", { ascending: true }),
          supabase
            .from("daily_reports")
            .select("id, report_date, shift_type, operator_name")
            .eq("organization_id", currentOrganizationId)
            .gte("report_date", startDate)
            .lte("report_date", endDate)
            .order("report_date", { ascending: true }),
        ]);

      if (employeeError) {
        throw new Error(`社員取得失敗: ${employeeError.message}`);
      }

      if (reportError) {
        throw new Error(`日報取得失敗: ${reportError.message}`);
      }

      const safeEmployees = (employeeData ?? []) as Employee[];
const safeReports = (reportData ?? []) as DailyReport[];
const reportIds = safeReports.map((report) => report.id);

const roleForFilter = options?.role ?? viewerRole;
const companyNameForFilter = options?.companyName ?? viewerCompanyName;
const isSuperAdmin = hasRole(roleForFilter ?? "", "super_admin");

const visibleEmployees = isSuperAdmin
  ? safeEmployees
  : safeEmployees.filter(
      (employee) => employee.company_name === companyNameForFilter
    );

const visibleEmployeeNames = new Set(
  visibleEmployees.map((employee) => employee.name)
);

      let safeReportMembers: ReportMember[] = [];

      if (reportIds.length > 0) {
        const { data: memberData, error: memberError } = await supabase
          .from("report_members")
          .select("report_id, employee_name, labor, overtime, is_driver")
          .eq("organization_id", currentOrganizationId)
          .in("report_id", reportIds);

        if (memberError) {
          throw new Error(`日報メンバー取得失敗: ${memberError.message}`);
        }

        safeReportMembers = (memberData ?? []) as ReportMember[];
      }

      let payrollSettings: PayrollSetting[] = [];

      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from("payroll_settings")
          .select(
            "id, organization_id, employee_name, base_salary, day_unit_price, night_unit_price, overtime_unit_price, driver_allowance, operator_allowance, attendance_allowance"
          )
          .eq("organization_id", currentOrganizationId);

        if (settingsError) {
          throw settingsError;
        }

        payrollSettings = (settingsData ?? []) as PayrollSetting[];
      } catch (settingsError) {
        setSettingsWarning(
          settingsError instanceof Error
            ? `payroll_settings を読めませんでした: ${settingsError.message}`
            : "payroll_settings を読めませんでした"
        );
      }
      const visibleReportMembers = safeReportMembers.filter((member) =>
      visibleEmployeeNames.has(member.employee_name)
      );
      const nextSettingsMap: PayrollDraftMap = {};

visibleEmployees.forEach((employee) => {
  const existing = payrollSettings.find(
    (setting) => setting.employee_name === employee.name
  );

  nextSettingsMap[employee.name] =
    existing ?? emptySetting(currentOrganizationId, employee.name);
});

setEmployees(visibleEmployees);
setReports(safeReports);
setReportMembers(visibleReportMembers);
setSettingsMap(nextSettingsMap);

console.log("visibleEmployees", visibleEmployees);
console.log("visibleReportMembers", visibleReportMembers);
console.log("safeReports", safeReports);

    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const summaryRows = useMemo<PayrollSummaryRow[]>(() => {
    const reportMap = new Map(reports.map((report) => [report.id, report]));
  
    return employees.map((employee) => {
      const members = reportMembers.filter(
        (member) => member.employee_name.trim() === employee.name.trim()
      );
  
      const relatedReports = members
        .map((member) => reportMap.get(member.report_id))
        .filter((report): report is DailyReport => Boolean(report));
  
      const uniqueAttendanceDates = new Set(
        members
          .filter((member) => toNumber(member.labor) > 0)
          .map((member) => reportMap.get(member.report_id)?.report_date)
          .filter((date): date is string => Boolean(date))
      );
  
      if (employee.name === "松山 海里") {
        console.log("employee", employee.name);
        console.log("members", members);
        console.log("relatedReports", relatedReports);
        console.log("labor values", members.map((member) => member.labor));
        console.log("report ids", members.map((member) => member.report_id));
        console.log("attendance dates", Array.from(uniqueAttendanceDates));
      }
  
      const laborTotal = members.reduce(
        (sum, member) => sum + toNumber(member.labor),
        0
      );
  
      const dayLaborTotal = members.reduce((sum, member) => {
        const report = reportMap.get(member.report_id);
        if ((report?.shift_type ?? "day") !== "day") return sum;
        return sum + toNumber(member.labor);
      }, 0);
  
      const nightLaborTotal = members.reduce((sum, member) => {
        const report = reportMap.get(member.report_id);
        if ((report?.shift_type ?? "day") !== "night") return sum;
        return sum + toNumber(member.labor);
      }, 0);
  
      const overtimeTotal = members.reduce(
        (sum, member) => sum + toNumber(member.overtime),
        0
      );
  
      const driverCount = members.filter((member) => member.is_driver).length;
  
      const operatorCount = relatedReports.filter(
        (report) => report.operator_name?.trim() === employee.name.trim()
      ).length;
  
      const setting =
        settingsMap[employee.name] ??
        emptySetting(organizationId ?? "", employee.name);
  
      const estimatedTotal =
        toNumber(setting.base_salary) +
        dayLaborTotal * toNumber(setting.day_unit_price) +
        nightLaborTotal * toNumber(setting.night_unit_price) +
        overtimeTotal * toNumber(setting.overtime_unit_price) +
        driverCount * toNumber(setting.driver_allowance) +
        operatorCount * toNumber(setting.operator_allowance) +
        uniqueAttendanceDates.size * toNumber(setting.attendance_allowance);
  
      return {
        employee_name: employee.name,
        attendance_days: uniqueAttendanceDates.size,
        labor_total: laborTotal,
        day_labor_total: dayLaborTotal,
        night_labor_total: nightLaborTotal,
        overtime_total: overtimeTotal,
        driver_count: driverCount,
        operator_count: operatorCount,
        estimated_total: estimatedTotal,
        setting,
      };
    });
  }, [employees, reportMembers, reports, settingsMap, organizationId]);

  const grandTotal = useMemo(() => {
    return summaryRows.reduce((sum, row) => sum + row.estimated_total, 0);
  }, [summaryRows]);

  const handleSettingChange = (
    employeeName: string,
    field: keyof PayrollSetting,
    value: string
  ) => {
    setSettingsMap((prev) => {
      const current =
        prev[employeeName] ?? emptySetting(organizationId ?? "", employeeName);

      return {
        ...prev,
        [employeeName]: {
          ...current,
          [field]:
            field === "organization_id" || field === "employee_name" || field === "id"
              ? value
              : toNumberOrNull(value),
        },
      };
    });
  };

  const saveSetting = async (employeeName: string) => {
    if (!organizationId) {
      alert("会社情報が取得できません");
      return;
    }

    const payload =
      settingsMap[employeeName] ?? emptySetting(organizationId, employeeName);

      const targetEmployee = employees.find((employee) => employee.name === employeeName);

if (!targetEmployee) {
  alert("対象社員が見つかりません");
  return;
}

const isSuperAdmin = hasRole(viewerRole ?? "", "super_admin");

if (!isSuperAdmin && targetEmployee.company_name !== viewerCompanyName) {
  alert("他社の給与設定は保存できません");
  return;
}

    try {
      setSavingEmployeeName(employeeName);

      const { error } = await supabase.from("payroll_settings").upsert(
        {
          organization_id: organizationId,
          employee_name: employeeName,
          base_salary: toNumber(payload.base_salary),
          day_unit_price: toNumber(payload.day_unit_price),
          night_unit_price: toNumber(payload.night_unit_price),
          overtime_unit_price: toNumber(payload.overtime_unit_price),
          driver_allowance: toNumber(payload.driver_allowance),
          operator_allowance: toNumber(payload.operator_allowance),
          attendance_allowance: toNumber(payload.attendance_allowance),
        },
        {
          onConflict: "organization_id,employee_name",
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      alert(`${employeeName} の単価を保存しました`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "保存に失敗しました");
    } finally {
      setSavingEmployeeName(null);
    }
  };

  if (authChecking || loading) {
    return <div style={{ padding: 16 }}>読み込み中...</div>;
  }

  return (
    <div style={{ padding: 16, backgroundColor: "#f5f6f8", minHeight: "100vh" }}>
      <BackButton />

      <div style={{ maxWidth: 1600, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>給与計算</h1>
            <div style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>
              日報 + report_members から月次集計
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={inputStyle}
            />
            <button type="button" onClick={() => void checkAdminAndLoad()} style={buttonStyle}>
  再読込
</button>
          </div>
        </div>

        {errorMessage ? (
          <div style={errorBoxStyle}>{errorMessage}</div>
        ) : null}

        {settingsWarning ? (
          <div style={warningBoxStyle}>
            {settingsWarning}
            <div style={{ marginTop: 6 }}>
              `payroll_settings` が未作成なら、先に作ってください。
            </div>
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>対象月</div>
            <div style={summaryValueStyle}>{month}</div>
          </div>
          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>社員数</div>
            <div style={summaryValueStyle}>{summaryRows.length}人</div>
          </div>
          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>支給見込合計</div>
            <div style={summaryValueStyle}>¥{formatCurrency(grandTotal)}</div>
          </div>
        </div>

        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>社員名</th>
                <th style={thStyle}>勤務日数</th>
                <th style={thStyle}>延労働数</th>
                <th style={thStyle}>昼労働数</th>
                <th style={thStyle}>夜労働数</th>
                <th style={thStyle}>残業合計</th>
                <th style={thStyle}>運転回数</th>
                <th style={thStyle}>OP回数</th>
                <th style={thStyle}>基本給</th>
                <th style={thStyle}>昼単価</th>
                <th style={thStyle}>夜単価</th>
                <th style={thStyle}>残業単価</th>
                <th style={thStyle}>運転手当</th>
                <th style={thStyle}>OP手当</th>
                <th style={thStyle}>出勤手当</th>
                <th style={thStyle}>支給見込</th>
                <th style={thStyle}>保存</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((row) => (
                <tr key={row.employee_name}>
                  <td style={stickyNameTdStyle}>{row.employee_name}</td>
                  <td style={tdStyle}>{row.attendance_days}</td>
                  <td style={tdStyle}>{row.labor_total}</td>
                  <td style={tdStyle}>{row.day_labor_total}</td>
                  <td style={tdStyle}>{row.night_labor_total}</td>
                  <td style={tdStyle}>{row.overtime_total}</td>
                  <td style={tdStyle}>{row.driver_count}</td>
                  <td style={tdStyle}>{row.operator_count}</td>

                  <td style={tdStyle}>
                    <input
                      type="number"
                      min={0}
                      value={toNumber(row.setting.base_salary)}
                      onChange={(e) =>
                        handleSettingChange(row.employee_name, "base_salary", e.target.value)
                      }
                      style={cellInputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="number"
                      min={0}
                      value={toNumber(row.setting.day_unit_price)}
                      onChange={(e) =>
                        handleSettingChange(row.employee_name, "day_unit_price", e.target.value)
                      }
                      style={cellInputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="number"
                      min={0}
                      value={toNumber(row.setting.night_unit_price)}
                      onChange={(e) =>
                        handleSettingChange(row.employee_name, "night_unit_price", e.target.value)
                      }
                      style={cellInputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="number"
                      min={0}
                      value={toNumber(row.setting.overtime_unit_price)}
                      onChange={(e) =>
                        handleSettingChange(
                          row.employee_name,
                          "overtime_unit_price",
                          e.target.value
                        )
                      }
                      style={cellInputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="number"
                      min={0}
                      value={toNumber(row.setting.driver_allowance)}
                      onChange={(e) =>
                        handleSettingChange(
                          row.employee_name,
                          "driver_allowance",
                          e.target.value
                        )
                      }
                      style={cellInputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="number"
                      min={0}
                      value={toNumber(row.setting.operator_allowance)}
                      onChange={(e) =>
                        handleSettingChange(
                          row.employee_name,
                          "operator_allowance",
                          e.target.value
                        )
                      }
                      style={cellInputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="number"
                      min={0}
                      value={toNumber(row.setting.attendance_allowance)}
                      onChange={(e) =>
                        handleSettingChange(
                          row.employee_name,
                          "attendance_allowance",
                          e.target.value
                        )
                      }
                      style={cellInputStyle}
                    />
                  </td>

                  <td style={{ ...tdStyle, fontWeight: 900 }}>
                    ¥{formatCurrency(row.estimated_total)}
                  </td>

                  <td style={tdStyle}>
                    <button
                      type="button"
                      onClick={() => void saveSetting(row.employee_name)}
                      disabled={savingEmployeeName === row.employee_name}
                      style={{
                        ...buttonStyle,
                        padding: "8px 10px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {savingEmployeeName === row.employee_name ? "保存中..." : "保存"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 12, color: "#6b7280", fontSize: 13 }}>
          集計式:
          基本給 + 昼労働数×昼単価 + 夜労働数×夜単価 + 残業合計×残業単価 + 運転回数×運転手当 + OP回数×OP手当 + 勤務日数×出勤手当
        </div>
      </div>
    </div>
  );
}

async function getCurrentOrganization() {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    return null;
  }

  const res = await fetch("/api/current-organization", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await res.json();

  if (!res.ok) {
    return null;
  }

  return result.organizationId as string | null;
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  backgroundColor: "#fff",
  fontSize: 14,
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  backgroundColor: "#fff",
  borderRadius: 8,
  padding: "10px 12px",
  fontWeight: 700,
  cursor: "pointer",
};

const summaryCardStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 16,
};

const summaryLabelStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: 13,
  fontWeight: 700,
  marginBottom: 8,
};

const summaryValueStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: 28,
  fontWeight: 900,
  lineHeight: 1,
};

const errorBoxStyle: React.CSSProperties = {
  marginBottom: 16,
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#991b1b",
  borderRadius: 12,
  padding: 14,
  fontWeight: 700,
};

const warningBoxStyle: React.CSSProperties = {
  marginBottom: 16,
  backgroundColor: "#fffbeb",
  border: "1px solid #fde68a",
  color: "#92400e",
  borderRadius: 12,
  padding: 14,
  fontWeight: 700,
};

const tableWrapStyle: React.CSSProperties = {
  overflowX: "auto",
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 1700,
  borderCollapse: "separate",
  borderSpacing: 0,
};

const thStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  backgroundColor: "#f9fafb",
  color: "#111827",
  fontSize: 13,
  fontWeight: 800,
  padding: "12px 10px",
  borderBottom: "1px solid #e5e7eb",
  borderRight: "1px solid #f3f4f6",
  textAlign: "center",
  whiteSpace: "nowrap",
  zIndex: 2,
};

const tdStyle: React.CSSProperties = {
  padding: "10px 8px",
  borderBottom: "1px solid #f3f4f6",
  borderRight: "1px solid #f9fafb",
  textAlign: "center",
  whiteSpace: "nowrap",
  backgroundColor: "#fff",
};

const stickyNameTdStyle: React.CSSProperties = {
  ...tdStyle,
  position: "sticky",
  left: 0,
  backgroundColor: "#fff",
  zIndex: 1,
  fontWeight: 800,
  textAlign: "left",
  minWidth: 140,
};

const cellInputStyle: React.CSSProperties = {
  width: 90,
  padding: "8px 6px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 13,
  textAlign: "right",
  boxSizing: "border-box",
};