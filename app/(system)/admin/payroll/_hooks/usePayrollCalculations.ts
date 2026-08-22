"use client";

import { useMemo } from "react";

import type {
  AssignmentForPayroll,
  DailyReport,
  Employee,
  PayrollDailyBreakdownRow,
  PayrollDailyOverrideMap,
  PayrollDraftMap,
  PayrollMonthlyAdjustmentMap,
  PayrollSummaryRow,
  ReportMember,
} from "../payroll-types";

import { calculatePayrollWorkTotals } from "../payroll-work-totals";

import {
  emptyMonthlyAdjustment,
  emptySetting,
  toNumber,
} from "../payroll-utils";

type UsePayrollCalculationsParams = {
  month: string;
  organizationId: string | null;
  employees: Employee[];
  reports: DailyReport[];
  reportMembers: ReportMember[];
  assignmentsForPayroll: AssignmentForPayroll[];
  settingsMap: PayrollDraftMap;
monthlyAdjustmentsMap: PayrollMonthlyAdjustmentMap;
dailyOverridesMap?: PayrollDailyOverrideMap;
};

export default function usePayrollCalculations({
  month,
  organizationId,
  employees,
  reports,
  reportMembers,
  assignmentsForPayroll,
  settingsMap,
  monthlyAdjustmentsMap,
  dailyOverridesMap = {},
}: UsePayrollCalculationsParams) {
    const summaryRows = useMemo<PayrollSummaryRow[]>(() => {
        return employees.map((employee) => {
          const employeeName = employee.name.trim();
      
          const members = reportMembers.filter(
            (member) => member.employee_name.trim() === employeeName
          );
      
          const {
            attendanceDays,
            laborTotal,
            dayLaborTotal,
            nightLaborTotal,
            overtimeTotal,
            dayOvertimeTotal,
            nightOvertimeTotal,
            driverCount,
            operatorCount,
          } = calculatePayrollWorkTotals(
            employee.name,
            members,
            reports,
            dailyOverridesMap
          );
      
          const setting =
            settingsMap[employee.name] ??
            emptySetting(
              organizationId ?? "",
              employee.name
            );
      
          const monthlyAdjustment =
            monthlyAdjustmentsMap[employee.name] ??
            emptyMonthlyAdjustment(
              organizationId ?? "",
              employee.name,
              month
            );
      
          const standardWorkDays =
            toNumber(setting.standard_work_days) || 21.5;
      
          const hoursPerDay =
            toNumber(setting.hours_per_day) || 8;
      
          const nightMultiplier =
            toNumber(setting.night_multiplier) || 1.25;
      
          const overtimeMultiplier =
            toNumber(setting.overtime_multiplier) || 1.25;
      
          const holidayMultiplier =
            toNumber(setting.holiday_multiplier) || 1.35;
      
          const baseSalary = toNumber(setting.base_salary);
          const siteAllowance = toNumber(setting.site_allowance);
      
          /*
           * サンプルExcelと同じ時間給計算
           * （基本給＋現場手当）÷21.5日÷8時間
           */
          const calculatedDayHourlyRate =
            standardWorkDays > 0 && hoursPerDay > 0
              ? Math.ceil(
                  (baseSalary + siteAllowance) /
                    standardWorkDays /
                    hoursPerDay
                )
              : 0;
      
          /*
           * 単価が手入力されている場合は手入力値を優先。
           * 0の場合は基本給から自動計算する。
           */
          const dayHourlyRate =
            toNumber(setting.day_unit_price) ||
            calculatedDayHourlyRate;
      
            const nightHourlyRate =
            toNumber(setting.night_unit_price) ||
            dayHourlyRate * nightMultiplier;
          
          const dayOvertimeRate =
            toNumber(setting.overtime_unit_price) ||
            dayHourlyRate * overtimeMultiplier;
          
          const nightOvertimeRate =
            nightHourlyRate * overtimeMultiplier;
      
          let basePay = 0;
          let nightAllowanceAmount = 0;
      
          if (setting.salary_type === "monthly") {
            // 月給者
            basePay = baseSalary;
      
            // 夜勤手当＝夜勤人工×昼夜の時間給差×1日時間
            nightAllowanceAmount =
              nightLaborTotal *
              Math.max(nightHourlyRate - dayHourlyRate, 0) *
              hoursPerDay;
          } else if (setting.salary_type === "daily") {
            // 日給者
            basePay =
              dayLaborTotal * toNumber(setting.day_unit_price) +
              nightLaborTotal * toNumber(setting.night_unit_price);
          } else {
            // 時間給者
            basePay =
              dayLaborTotal *
                hoursPerDay *
                toNumber(setting.day_unit_price) +
              nightLaborTotal *
                hoursPerDay *
                toNumber(setting.night_unit_price);
          }
      
          const dayOvertimeAmount =
            dayOvertimeTotal * dayOvertimeRate;
      
          const nightOvertimeAmount =
            nightOvertimeTotal * nightOvertimeRate;
      
          const holidayWorkAmount =
            toNumber(monthlyAdjustment.holiday_work_days) *
            dayHourlyRate *
            hoursPerDay *
            holidayMultiplier;
      
          const paidLeaveAmount =
            toNumber(monthlyAdjustment.paid_leave_days) *
            dayHourlyRate *
            hoursPerDay;
      
          const driverAllowanceAmount =
            driverCount * toNumber(setting.driver_allowance);
      
          const operatorAllowanceAmount =
            operatorCount * toNumber(setting.operator_allowance);
      
          const attendanceAllowanceAmount =
            attendanceDays *
            toNumber(setting.attendance_allowance);
      
          const otherAllowanceAmount = toNumber(
            monthlyAdjustment.other_allowance
          );
      
          const siteAllowanceAmount =
            setting.salary_type === "monthly"
              ? siteAllowance
              : 0;
      
          const grossTotal =
            basePay +
            siteAllowanceAmount +
            nightAllowanceAmount +
            dayOvertimeAmount +
            nightOvertimeAmount +
            holidayWorkAmount +
            paidLeaveAmount +
            driverAllowanceAmount +
            operatorAllowanceAmount +
            attendanceAllowanceAmount +
            otherAllowanceAmount;
      
          const healthInsuranceAmount = Math.abs(
            toNumber(monthlyAdjustment.health_insurance)
          );
      
          const pensionAmount = Math.abs(
            toNumber(monthlyAdjustment.pension)
          );
      
          /*
           * 雇用保険を手入力していない場合は、
           * 支給総額×雇用保険率で自動計算
           */
          const manualEmploymentInsurance = toNumber(
            monthlyAdjustment.employment_insurance
          );
      
          const employmentInsuranceAmount =
            manualEmploymentInsurance > 0
              ? Math.abs(manualEmploymentInsurance)
              : Math.round(
                  grossTotal *
                    toNumber(
                      setting.employment_insurance_rate
                    )
                );
      
          const incomeTaxAmount = Math.abs(
            toNumber(monthlyAdjustment.income_tax)
          );
      
          const residentTaxAmount = Math.abs(
            toNumber(monthlyAdjustment.resident_tax)
          );
      
          const dormitoryFeeAmount = Math.abs(
            toNumber(monthlyAdjustment.dormitory_fee)
          );
      
          const reserveFundAmount = Math.abs(
            toNumber(setting.reserve_fund)
          );
      
          const otherDeductionAmount = Math.abs(
            toNumber(monthlyAdjustment.other_deduction)
          );
      
          // サンプルと同じ課税対象の表示
          const taxableAmount =
            grossTotal -
            healthInsuranceAmount -
            pensionAmount;
      
          const deductionTotal =
            healthInsuranceAmount +
            pensionAmount +
            employmentInsuranceAmount +
            incomeTaxAmount +
            residentTaxAmount +
            dormitoryFeeAmount +
            reserveFundAmount +
            otherDeductionAmount;
      
          const netTotal = grossTotal - deductionTotal;
      
          return {
            employee_name: employee.name,
      
            attendance_days: attendanceDays,
            labor_total: laborTotal,
            day_labor_total: dayLaborTotal,
            night_labor_total: nightLaborTotal,
            overtime_total: overtimeTotal,
            day_overtime_total: dayOvertimeTotal,
            night_overtime_total: nightOvertimeTotal,
            driver_count: driverCount,
            operator_count: operatorCount,
      
            setting,
            monthly_adjustment: monthlyAdjustment,
      
            day_hourly_rate: dayHourlyRate,
            night_hourly_rate: nightHourlyRate,
            day_overtime_rate: dayOvertimeRate,
            night_overtime_rate: nightOvertimeRate,
      
            base_pay: basePay,
            site_allowance_amount: siteAllowanceAmount,
            night_allowance_amount: nightAllowanceAmount,
            day_overtime_amount: dayOvertimeAmount,
            night_overtime_amount: nightOvertimeAmount,
            holiday_work_amount: holidayWorkAmount,
            paid_leave_amount: paidLeaveAmount,
            driver_allowance_amount: driverAllowanceAmount,
            operator_allowance_amount: operatorAllowanceAmount,
            attendance_allowance_amount: attendanceAllowanceAmount,
            other_allowance_amount: otherAllowanceAmount,
      
            gross_total: grossTotal,
      
            health_insurance_amount: healthInsuranceAmount,
            pension_amount: pensionAmount,
            employment_insurance_amount:
              employmentInsuranceAmount,
            income_tax_amount: incomeTaxAmount,
            resident_tax_amount: residentTaxAmount,
            dormitory_fee_amount: dormitoryFeeAmount,
            reserve_fund_amount: reserveFundAmount,
            other_deduction_amount: otherDeductionAmount,
      
            taxable_amount: taxableAmount,
            deduction_total: deductionTotal,
            net_total: netTotal,
      
            // 現在の表を一時的に壊さないため
            estimated_total: grossTotal,
          };
        });
      }, [
        employees,
        reportMembers,
        reports,
        settingsMap,
        monthlyAdjustmentsMap,
        dailyOverridesMap,
        organizationId,
        month,
      ]);

      const dailyBreakdownMap = useMemo<
  Record<string, PayrollDailyBreakdownRow[]>
>(() => {
  const result: Record<
    string,
    PayrollDailyBreakdownRow[]
  > = {};

  const [year, monthNumber] = month
    .split("-")
    .map(Number);

  const daysInMonth = new Date(
    year,
    monthNumber,
    0
  ).getDate();

  const weekdayNames = [
    "日",
    "月",
    "火",
    "水",
    "木",
    "金",
    "土",
  ];

  const reportMap = new Map(
    reports.map((report) => [
      report.id,
      report,
    ])
  );

  const addUniqueText = (
    current: string,
    value: string | null | undefined
  ) => {
    const nextValue = (value ?? "").trim();

    if (!nextValue) {
      return current;
    }

    const currentValues = current
      ? current.split(" / ")
      : [];

    if (currentValues.includes(nextValue)) {
      return current;
    }

    return [...currentValues, nextValue].join(
      " / "
    );
  };

  employees.forEach((employee) => {
    const employeeName = employee.name.trim();

    const rows: PayrollDailyBreakdownRow[] =
      Array.from(
        { length: daysInMonth },
        (_, index) => {
          const day = index + 1;

          const date = `${year}-${String(
            monthNumber
          ).padStart(2, "0")}-${String(
            day
          ).padStart(2, "0")}`;

          const weekday =
            weekdayNames[
              new Date(
                year,
                monthNumber - 1,
                day
              ).getDay()
            ];

          return {
            date,
            weekday,

            dayContractor: "",
            nightContractor: "",

            dayManager: "",
            nightManager: "",

            daySite: "",
            nightSite: "",

            dayLabor: 0,
            nightLabor: 0,

            dayOvertime: 0,
            nightOvertime: 0,

            dayWorkHours: 0,
            nightWorkHours: 0,

            extendedWorkHours: 0,
            driverCount: 0,
            operatorCount: 0,

            note: "",
          };
        }
      );

    const rowMap = new Map(
      rows.map((row) => [row.date, row])
    );

    const hoursPerDay =
      toNumber(
        settingsMap[employee.name]
          ?.hours_per_day
      ) || 8;

    reportMembers
      .filter(
        (member) =>
          member.employee_name.trim() ===
          employeeName
      )
      .forEach((member) => {
        const report = reportMap.get(
          member.report_id
        );

        if (!report) {
          return;
        }

        const row = rowMap.get(
          report.report_date
        );

        if (!row) {
          return;
        }

        const shift =
          report.shift_type === "night"
            ? "night"
            : "day";

        const assignment =
          assignmentsForPayroll.find(
            (item) =>
              (item.contractor_name ?? "")
                .trim() ===
                (
                  report.contractor_name ?? ""
                ).trim() &&
              (item.site_name ?? "").trim() ===
                (
                  report.site_name ?? ""
                ).trim() &&
              (item.shift_type ?? "day") ===
                shift
          );

        const labor = toNumber(
          member.labor
        );

        const overtime = toNumber(
          member.overtime
        );

        if (shift === "night") {
          row.nightContractor =
            addUniqueText(
              row.nightContractor,
              report.contractor_name
            );

          row.nightManager = addUniqueText(
            row.nightManager,
            assignment?.manager_name
          );

          row.nightSite = addUniqueText(
            row.nightSite,
            report.site_name
          );

          row.nightLabor += labor;
          row.nightOvertime += overtime;
          row.nightWorkHours +=
            labor * hoursPerDay;
        } else {
          row.dayContractor = addUniqueText(
            row.dayContractor,
            report.contractor_name
          );

          row.dayManager = addUniqueText(
            row.dayManager,
            assignment?.manager_name
          );

          row.daySite = addUniqueText(
            row.daySite,
            report.site_name
          );

          row.dayLabor += labor;
          row.dayOvertime += overtime;
          row.dayWorkHours +=
            labor * hoursPerDay;
        }

        row.extendedWorkHours += overtime;

        if (member.is_driver) {
          row.driverCount += 1;
        }

        if (
          report.operator_name?.trim() ===
          employeeName
        ) {
          row.operatorCount += 1;
        }

        row.note = addUniqueText(
          row.note,
          report.note
        );
      });

      result[employee.name] = rows.map((row) => {
        const key = `${employee.name}__${row.date}`;
      
        return {
          ...row,
          ...(dailyOverridesMap[key] ?? {}),
        };
      });
  });

  return result;
}, [
  month,
  employees,
  reports,
  reportMembers,
  assignmentsForPayroll,
  settingsMap,
  dailyOverridesMap,
]);

  const grossGrandTotal = useMemo(() => {
    return summaryRows.reduce(
      (sum, row) => sum + row.gross_total,
      0
    );
  }, [summaryRows]);
  
  const deductionGrandTotal = useMemo(() => {
    return summaryRows.reduce(
      (sum, row) => sum + row.deduction_total,
      0
    );
  }, [summaryRows]);
  
  const netGrandTotal = useMemo(() => {
    return summaryRows.reduce(
      (sum, row) => sum + row.net_total,
      0
    );
  }, [summaryRows]);

  return {
    summaryRows,
    dailyBreakdownMap,
    grossGrandTotal,
    deductionGrandTotal,
    netGrandTotal,
  };
}