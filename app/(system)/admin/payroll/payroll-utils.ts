import type {
    PayrollMonthlyAdjustment,
    PayrollSetting,
  } from "./payroll-types";

  export function getCurrentMonthString() {
    return new Date().toISOString().slice(0, 7);
  }
  
  export function getMonthRange(month: string) {
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
  
  export function toNumberOrNull(value: string) {
    if (value.trim() === "") return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }
  
  export function toNumber(value: number | string | null | undefined) {
      if (value === null || value === undefined || value === "") {
        return 0;
      }
    
      const num = typeof value === "number" ? value : Number(value);
      return Number.isFinite(num) ? num : 0;
    }
  
  export function emptySetting(
    organizationId: string,
    employeeName: string
  ): PayrollSetting {
    return {
      organization_id: organizationId,
      employee_name: employeeName,
  
      salary_type: "monthly",
  
      base_salary: 0,
      day_unit_price: 0,
      night_unit_price: 0,
      overtime_unit_price: 0,
  
      site_allowance: 0,
      driver_allowance: 0,
      operator_allowance: 0,
      attendance_allowance: 0,
  
      standard_work_days: 21.5,
      hours_per_day: 8,
      night_multiplier: 1.25,
      overtime_multiplier: 1.25,
      holiday_multiplier: 1.35,
      employment_insurance_rate: 0.0065,
      reserve_fund: 0,
    };
  }
  
  export function emptyMonthlyAdjustment(
    organizationId: string,
    employeeName: string,
    month: string
  ): PayrollMonthlyAdjustment {
    return {
      organization_id: organizationId,
      employee_name: employeeName,
      payroll_month: `${month}-01`,
  
      holiday_work_days: 0,
      paid_leave_days: 0,
      other_allowance: 0,
  
      health_insurance: 0,
      pension: 0,
      employment_insurance: 0,
      income_tax: 0,
      resident_tax: 0,
      dormitory_fee: 0,
      other_deduction: 0,
  
      note: "",
    };
  }