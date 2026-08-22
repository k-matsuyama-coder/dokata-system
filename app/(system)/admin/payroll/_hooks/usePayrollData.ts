"use client";

import { useEffect, useState } from "react";
import { hasRole } from "@/app/types/auth";
import { supabase } from "@/lib/supabase";

import type {
  AssignmentForPayroll,
  DailyReport,
  Employee,
  PayrollDraftMap,
  PayrollDailyOverride,
  PayrollDailyOverrideMap,
  PayrollDailyOverrideValues,
  PayrollMonthlyAdjustment,
  PayrollMonthlyAdjustmentMap,
  PayrollSetting,
  ReportMember,
  SalaryType,
} from "../payroll-types";

import {
    emptyMonthlyAdjustment,
    emptySetting,
    getMonthRange,
    toNumber,
    toNumberOrNull,
  } from "../payroll-utils";

  export default function usePayrollData(month: string) {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [assignmentsForPayroll, setAssignmentsForPayroll] =
    useState<AssignmentForPayroll[]>([]);
  const [reportMembers, setReportMembers] = useState<ReportMember[]>([]);
  const [settingsMap, setSettingsMap] = useState<PayrollDraftMap>({});
  const [monthlyAdjustmentsMap, setMonthlyAdjustmentsMap] =
    useState<PayrollMonthlyAdjustmentMap>({});
  const [dailyOverridesMap, setDailyOverridesMap] =
  useState<PayrollDailyOverrideMap>({});

const [savingBreakdownKey, setSavingBreakdownKey] =
  useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [savingEmployeeName, setSavingEmployeeName] =
    useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [settingsWarning, setSettingsWarning] = useState("");
  const [viewerRole, setViewerRole] = useState<string | null>(null);
  const [viewerCompanyName, setViewerCompanyName] =
    useState<string | null>(null);

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
    
          const [
            {
              data: employeeData,
              error: employeeError,
            },
            {
              data: reportData,
              error: reportError,
            },
            {
              data: assignmentData,
              error: assignmentError,
            },
          ] = await Promise.all([
            supabase
              .from("employees")
              .select("name, company_name")
              .eq(
                "organization_id",
                currentOrganizationId
              )
              .order("name", { ascending: true }),
          
            supabase
              .from("daily_reports")
              .select(`
                id,
                report_date,
                shift_type,
                operator_name,
                contractor_name,
                site_name,
                note
              `)
              .eq(
                "organization_id",
                currentOrganizationId
              )
              .gte("report_date", startDate)
              .lte("report_date", endDate)
              .order("report_date", { ascending: true }),
          
            supabase
              .from("assignments")
              .select(`
                contractor_name,
                site_name,
                shift_type,
                manager_name
              `)
              .eq(
                "organization_id",
                currentOrganizationId
              ),
          ]);
          
          if (employeeError) {
            throw new Error(
              `社員取得失敗: ${employeeError.message}`
            );
          }
          
          if (reportError) {
            throw new Error(
              `日報取得失敗: ${reportError.message}`
            );
          }
          
          if (assignmentError) {
            throw new Error(
              `工程取得失敗: ${assignmentError.message}`
            );
          }
          
          const safeEmployees =
            (employeeData ?? []) as Employee[];
          
          const safeReports =
            (reportData ?? []) as DailyReport[];
          
          const safeAssignments =
            (assignmentData ?? []) as AssignmentForPayroll[];
          
          const reportIds = safeReports.map(
            (report) => report.id
          );
    
    const roleForFilter = options?.role ?? viewerRole;
    const companyNameForFilter = options?.companyName ?? viewerCompanyName;
    const isSuperAdmin = roleForFilter === "super_admin";
    
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
let monthlyAdjustments: PayrollMonthlyAdjustment[] = [];
let dailyOverrides: PayrollDailyOverride[] = [];
    
    try {
        const [settingsResult, monthlyResult, overridesResult] =
        await Promise.all([
        supabase
          .from("payroll_settings")
          .select(`
            id,
            organization_id,
            employee_name,
            salary_type,
            base_salary,
            day_unit_price,
            night_unit_price,
            overtime_unit_price,
            site_allowance,
            driver_allowance,
            operator_allowance,
            attendance_allowance,
            standard_work_days,
            hours_per_day,
            night_multiplier,
            overtime_multiplier,
            holiday_multiplier,
            employment_insurance_rate,
            reserve_fund
          `)
          .eq("organization_id", currentOrganizationId),
    
        supabase
          .from("payroll_monthly_adjustments")
          .select(`
            id,
            organization_id,
            employee_name,
            payroll_month,
            holiday_work_days,
            paid_leave_days,
            other_allowance,
            health_insurance,
            pension,
            employment_insurance,
            income_tax,
            resident_tax,
            dormitory_fee,
            other_deduction,
            note
          `)
          .eq("organization_id", currentOrganizationId)
.eq("payroll_month", `${month}-01`),

supabase
  .from("payroll_daily_overrides")
  .select(`
    id,
    organization_id,
    employee_name,
    work_date,
    overrides
  `)
  .eq("organization_id", currentOrganizationId)
  .gte("work_date", startDate)
  .lte("work_date", endDate),
]);
    
      if (settingsResult.error) {
        throw new Error(
          `固定給与設定取得失敗: ${settingsResult.error.message}`
        );
      }
    
      if (monthlyResult.error) {
        throw new Error(
          `月別給与設定取得失敗: ${monthlyResult.error.message}`
        );
      }

      if (overridesResult.error) {
        throw new Error(
          `給与内訳修正データ取得失敗: ${overridesResult.error.message}`
        );
      }
    
      payrollSettings =
        (settingsResult.data ?? []) as PayrollSetting[];
    
      monthlyAdjustments =
        (monthlyResult.data ?? []) as PayrollMonthlyAdjustment[];

        dailyOverrides =
        (overridesResult.data ?? []) as unknown as PayrollDailyOverride[];
    } catch (settingsError) {
      setSettingsWarning(
        settingsError instanceof Error
          ? settingsError.message
          : "給与設定を読み込めませんでした"
      );
    }
          const visibleReportMembers = safeReportMembers.filter((member) =>
          visibleEmployeeNames.has(member.employee_name)
          );
          const nextSettingsMap: PayrollDraftMap = {};
          const nextMonthlyAdjustmentsMap: PayrollMonthlyAdjustmentMap = {};

          const nextDailyOverridesMap: PayrollDailyOverrideMap = {};

dailyOverrides
  .filter((override) =>
    visibleEmployeeNames.has(override.employee_name)
  )
  .forEach((override) => {
    const key =
      `${override.employee_name}__${override.work_date}`;

    nextDailyOverridesMap[key] =
      override.overrides ?? {};
  });
    
          visibleEmployees.forEach((employee) => {
            const existingSetting = payrollSettings.find(
              (setting) => setting.employee_name === employee.name
            );
          
            const existingMonthlyAdjustment = monthlyAdjustments.find(
              (adjustment) => adjustment.employee_name === employee.name
            );
          
            nextSettingsMap[employee.name] =
              existingSetting ??
              emptySetting(currentOrganizationId, employee.name);
          
            nextMonthlyAdjustmentsMap[employee.name] =
              existingMonthlyAdjustment ??
              emptyMonthlyAdjustment(
                currentOrganizationId,
                employee.name,
                month
              );
          });
    
          setEmployees(visibleEmployees);
          setReports(safeReports);
          setAssignmentsForPayroll(safeAssignments);
          setReportMembers(visibleReportMembers);
    setSettingsMap(nextSettingsMap);
    setMonthlyAdjustmentsMap(nextMonthlyAdjustmentsMap);
    setDailyOverridesMap(nextDailyOverridesMap);
    
    console.log("visibleEmployees", visibleEmployees);
    console.log("visibleReportMembers", visibleReportMembers);
    console.log("safeReports", safeReports);
    
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "取得に失敗しました");
        } finally {
          setLoading(false);
        }
      };

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
          const isSuperAdmin = employee.role === "super_admin";
      
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

      const handleSettingChange = (
        employeeName: string,
        field: keyof PayrollSetting,
        value: string
      ) => {
        setSettingsMap((prev) => {
          const current =
            prev[employeeName] ??
            emptySetting(
              organizationId ?? "",
              employeeName
            );
      
          const nextValue =
            field === "salary_type"
              ? (value as SalaryType)
              : field === "organization_id" ||
                  field === "employee_name" ||
                  field === "id"
                ? value
                : toNumberOrNull(value);
      
          return {
            ...prev,
            [employeeName]: {
              ...current,
              [field]: nextValue,
            },
          };
        });
      };
    
      const handleMonthlyAdjustmentChange = (
        employeeName: string,
        field: keyof PayrollMonthlyAdjustment,
        value: string
      ) => {
        setMonthlyAdjustmentsMap((prev) => {
          const current =
            prev[employeeName] ??
            emptyMonthlyAdjustment(
              organizationId ?? "",
              employeeName,
              month
            );
      
          const nextValue =
            field === "organization_id" ||
            field === "employee_name" ||
            field === "payroll_month" ||
            field === "id" ||
            field === "note"
              ? value
              : toNumberOrNull(value);
      
          return {
            ...prev,
            [employeeName]: {
              ...current,
              [field]: nextValue,
            },
          };
        });
      };

      const handleDailyOverrideChange = (
        employeeName: string,
        workDate: string,
        field: keyof PayrollDailyOverrideValues,
        value: string
      ) => {
        const numericFields: Array<
          keyof PayrollDailyOverrideValues
        > = [
          "dayLabor",
          "nightLabor",
          "dayOvertime",
          "nightOvertime",
          "dayWorkHours",
          "nightWorkHours",
          "extendedWorkHours",
          "driverCount",
          "operatorCount",
        ];
      
        const nextValue = numericFields.includes(field)
          ? toNumber(value)
          : value;
      
        const key = `${employeeName}__${workDate}`;
      
        setDailyOverridesMap((prev) => ({
          ...prev,
          [key]: {
            ...(prev[key] ?? {}),
            [field]: nextValue,
          },
        }));
      };

      const saveDailyOverride = async (
        employeeName: string,
        workDate: string
      ) => {
        if (!organizationId) {
          alert("会社情報が取得できません");
          return;
        }
      
        const key = `${employeeName}__${workDate}`;
        const overrides = dailyOverridesMap[key] ?? {};
      
        if (Object.keys(overrides).length === 0) {
          alert("変更された項目がありません");
          return;
        }
      
        try {
          setSavingBreakdownKey(key);
      
          const { error } = await supabase
            .from("payroll_daily_overrides")
            .upsert(
              {
                organization_id: organizationId,
                employee_name: employeeName,
                work_date: workDate,
                overrides,
                updated_at: new Date().toISOString(),
              },
              {
                onConflict:
                  "organization_id,employee_name,work_date",
              }
            );
      
          if (error) {
            throw new Error(
              `給与内訳保存失敗: ${error.message}`
            );
          }
      
          alert(
            `${employeeName} ${workDate} の給与内訳を保存しました`
          );
        } catch (error) {
          alert(
            error instanceof Error
              ? error.message
              : "給与内訳の保存に失敗しました"
          );
        } finally {
          setSavingBreakdownKey(null);
        }
      };

      const resetDailyOverride = async (
        employeeName: string,
        workDate: string
      ) => {
        if (!organizationId) {
          alert("会社情報が取得できません");
          return;
        }
      
        const ok = window.confirm(
          `${employeeName} ${workDate} の給与上の修正を取り消しますか？`
        );
      
        if (!ok) {
          return;
        }
      
        const key = `${employeeName}__${workDate}`;
      
        try {
          setSavingBreakdownKey(key);
      
          const { error } = await supabase
            .from("payroll_daily_overrides")
            .delete()
            .eq("organization_id", organizationId)
            .eq("employee_name", employeeName)
            .eq("work_date", workDate);
      
          if (error) {
            throw new Error(
              `給与内訳リセット失敗: ${error.message}`
            );
          }
      
          setDailyOverridesMap((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
        } catch (error) {
          alert(
            error instanceof Error
              ? error.message
              : "給与内訳のリセットに失敗しました"
          );
        } finally {
          setSavingBreakdownKey(null);
        }
      };

      const saveSetting = async (employeeName: string) => {
        if (!organizationId) {
          alert("会社情報が取得できません");
          return;
        }
      
        const setting =
          settingsMap[employeeName] ??
          emptySetting(organizationId, employeeName);
      
        const monthlyAdjustment =
          monthlyAdjustmentsMap[employeeName] ??
          emptyMonthlyAdjustment(
            organizationId,
            employeeName,
            month
          );
      
        const targetEmployee = employees.find(
          (employee) => employee.name === employeeName
        );
      
        if (!targetEmployee) {
          alert("対象社員が見つかりません");
          return;
        }
      
        const isSuperAdmin = viewerRole === "super_admin";
      
        if (
          !isSuperAdmin &&
          targetEmployee.company_name !== viewerCompanyName
        ) {
          alert("他社の給与設定は保存できません");
          return;
        }
      
        try {
          setSavingEmployeeName(employeeName);
      
          const [settingResult, monthlyResult] =
            await Promise.all([
              supabase.from("payroll_settings").upsert(
                {
                  organization_id: organizationId,
                  employee_name: employeeName,
      
                  salary_type: setting.salary_type,
      
                  base_salary: toNumber(setting.base_salary),
                  day_unit_price: toNumber(
                    setting.day_unit_price
                  ),
                  night_unit_price: toNumber(
                    setting.night_unit_price
                  ),
                  overtime_unit_price: toNumber(
                    setting.overtime_unit_price
                  ),
      
                  site_allowance: toNumber(
                    setting.site_allowance
                  ),
                  driver_allowance: toNumber(
                    setting.driver_allowance
                  ),
                  operator_allowance: toNumber(
                    setting.operator_allowance
                  ),
                  attendance_allowance: toNumber(
                    setting.attendance_allowance
                  ),
      
                  standard_work_days: toNumber(
                    setting.standard_work_days
                  ),
                  hours_per_day: toNumber(
                    setting.hours_per_day
                  ),
                  night_multiplier: toNumber(
                    setting.night_multiplier
                  ),
                  overtime_multiplier: toNumber(
                    setting.overtime_multiplier
                  ),
                  holiday_multiplier: toNumber(
                    setting.holiday_multiplier
                  ),
                  employment_insurance_rate: toNumber(
                    setting.employment_insurance_rate
                  ),
                  reserve_fund: toNumber(
                    setting.reserve_fund
                  ),
      
                  updated_at: new Date().toISOString(),
                },
                {
                  onConflict:
                    "organization_id,employee_name",
                }
              ),
      
              supabase
                .from("payroll_monthly_adjustments")
                .upsert(
                  {
                    organization_id: organizationId,
                    employee_name: employeeName,
                    payroll_month: `${month}-01`,
      
                    holiday_work_days: toNumber(
                      monthlyAdjustment.holiday_work_days
                    ),
                    paid_leave_days: toNumber(
                      monthlyAdjustment.paid_leave_days
                    ),
                    other_allowance: toNumber(
                      monthlyAdjustment.other_allowance
                    ),
      
                    health_insurance: toNumber(
                      monthlyAdjustment.health_insurance
                    ),
                    pension: toNumber(
                      monthlyAdjustment.pension
                    ),
                    employment_insurance: toNumber(
                      monthlyAdjustment.employment_insurance
                    ),
                    income_tax: toNumber(
                      monthlyAdjustment.income_tax
                    ),
                    resident_tax: toNumber(
                      monthlyAdjustment.resident_tax
                    ),
                    dormitory_fee: toNumber(
                      monthlyAdjustment.dormitory_fee
                    ),
                    other_deduction: toNumber(
                      monthlyAdjustment.other_deduction
                    ),
      
                    note:
                      monthlyAdjustment.note?.trim() || null,
      
                    updated_at: new Date().toISOString(),
                  },
                  {
                    onConflict:
                      "organization_id,employee_name,payroll_month",
                  }
                ),
            ]);
      
          if (settingResult.error) {
            throw new Error(
              `固定給与設定保存失敗: ${settingResult.error.message}`
            );
          }
      
          if (monthlyResult.error) {
            throw new Error(
              `月別給与設定保存失敗: ${monthlyResult.error.message}`
            );
          }
      
          alert(`${employeeName} の給与設定を保存しました`);
        } catch (error) {
          alert(
            error instanceof Error
              ? error.message
              : "保存に失敗しました"
          );
        } finally {
          setSavingEmployeeName(null);
        }
      };

      useEffect(() => {
        void checkAdminAndLoad();
      }, [month]);

      return {
        saveSetting,
        handleSettingChange,
        handleMonthlyAdjustmentChange,
        handleDailyOverrideChange,
        saveDailyOverride,
        resetDailyOverride,
        checkAdminAndLoad,
    fetchAll,
    organizationId,
    setOrganizationId,
    employees,
    setEmployees,
    reports,
    setReports,
    assignmentsForPayroll,
    setAssignmentsForPayroll,
    reportMembers,
    setReportMembers,
    settingsMap,
    setSettingsMap,
    monthlyAdjustmentsMap,
    setMonthlyAdjustmentsMap,
    dailyOverridesMap,
setDailyOverridesMap,
savingBreakdownKey,
setSavingBreakdownKey,
    loading,
    setLoading,
    authChecking,
    setAuthChecking,
    savingEmployeeName,
    setSavingEmployeeName,
    errorMessage,
    setErrorMessage,
    settingsWarning,
    setSettingsWarning,
    viewerRole,
    setViewerRole,
    viewerCompanyName,
    setViewerCompanyName,
  };
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