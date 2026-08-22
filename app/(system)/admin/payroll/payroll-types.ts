export type Employee = {
    name: string;
    company_name: string | null;
  };

export type DailyReport = {
    id: string;
    report_date: string;
    shift_type: string | null;
    operator_name: string | null;
  
    contractor_name: string | null;
    site_name: string | null;
    note: string | null;
  };
  
export type AssignmentForPayroll = {
    contractor_name: string | null;
    site_name: string | null;
    shift_type: string | null;
    manager_name: string | null;
  };

  export type ReportMember = {
    report_id: string;
    employee_name: string;
    labor: number | string | null;
    overtime: number | string | null;
    is_driver: boolean | null;
  };

  export type PayrollDailyBreakdownRow = {
    date: string;
    weekday: string;
  
    dayContractor: string;
    nightContractor: string;
  
    dayManager: string;
    nightManager: string;
  
    daySite: string;
    nightSite: string;
  
    dayLabor: number;
    nightLabor: number;
  
    dayOvertime: number;
    nightOvertime: number;
  
    dayWorkHours: number;
    nightWorkHours: number;
  
    extendedWorkHours: number;
    driverCount: number;
    operatorCount: number;
  
    note: string;
  };

  export type PayrollDailyOverrideValues = Partial<
  Omit<PayrollDailyBreakdownRow, "date" | "weekday">
>;

export type PayrollDailyOverride = {
  id?: string;
  organization_id: string;
  employee_name: string;
  work_date: string;
  overrides: PayrollDailyOverrideValues;
};

export type PayrollDailyOverrideMap = Record<
  string,
  PayrollDailyOverrideValues
>;

  export type SalaryType = "monthly" | "daily" | "hourly";

  export type BatchPrintMode =
  | "both"
  | "payslip"
  | "breakdown";

  export type PayrollSetting = {
    id?: string;
    organization_id: string;
    employee_name: string;
  
    salary_type: SalaryType;
  
    base_salary: number | null;
    day_unit_price: number | null;
    night_unit_price: number | null;
    overtime_unit_price: number | null;
  
    site_allowance: number | null;
    driver_allowance: number | null;
    operator_allowance: number | null;
    attendance_allowance: number | null;
  
    standard_work_days: number | null;
    hours_per_day: number | null;
    night_multiplier: number | null;
    overtime_multiplier: number | null;
    holiday_multiplier: number | null;
    employment_insurance_rate: number | null;
    reserve_fund: number | null;
  };

  export type PayrollMonthlyAdjustment = {
    id?: string;
    organization_id: string;
    employee_name: string;
    payroll_month: string;
  
    holiday_work_days: number | null;
    paid_leave_days: number | null;
    other_allowance: number | null;
  
    health_insurance: number | null;
    pension: number | null;
    employment_insurance: number | null;
    income_tax: number | null;
    resident_tax: number | null;
    dormitory_fee: number | null;
    other_deduction: number | null;
  
    note: string | null;
  };
  
  export type PayrollMonthlyAdjustmentMap = Record<
    string,
    PayrollMonthlyAdjustment
  >;

  export type PayrollDraftMap = Record<string, PayrollSetting>;

  export type PayrollSummaryRow = {
  employee_name: string;

  // 日報からの集計
  attendance_days: number;
  labor_total: number;
  day_labor_total: number;
  night_labor_total: number;
  overtime_total: number;
  day_overtime_total: number;
  night_overtime_total: number;
  driver_count: number;
  operator_count: number;

  // 給与設定
  setting: PayrollSetting;
  monthly_adjustment: PayrollMonthlyAdjustment;

  // 自動計算した単価
  day_hourly_rate: number;
  night_hourly_rate: number;
  day_overtime_rate: number;
  night_overtime_rate: number;

  // 支給内訳
  base_pay: number;
  site_allowance_amount: number;
  night_allowance_amount: number;
  day_overtime_amount: number;
  night_overtime_amount: number;
  holiday_work_amount: number;
  paid_leave_amount: number;
  driver_allowance_amount: number;
  operator_allowance_amount: number;
  attendance_allowance_amount: number;
  other_allowance_amount: number;

  // 支給総額
  gross_total: number;

  // 控除
  health_insurance_amount: number;
  pension_amount: number;
  employment_insurance_amount: number;
  income_tax_amount: number;
  resident_tax_amount: number;
  dormitory_fee_amount: number;
  reserve_fund_amount: number;
  other_deduction_amount: number;

  // 課税対象・控除・差引
  taxable_amount: number;
  deduction_total: number;
  net_total: number;

  // 現在の画面との互換用
  estimated_total: number;
};