import type {
    DailyReport,
    PayrollDailyOverrideMap,
    ReportMember,
  } from "./payroll-types";
  
  import { toNumber } from "./payroll-utils";
  
  type DailyTotals = {
    dayLabor: number;
    nightLabor: number;
    dayOvertime: number;
    nightOvertime: number;
    driverCount: number;
    operatorCount: number;
  };
  
  export type PayrollWorkTotals = {
    attendanceDays: number;
    laborTotal: number;
    dayLaborTotal: number;
    nightLaborTotal: number;
    overtimeTotal: number;
    dayOvertimeTotal: number;
    nightOvertimeTotal: number;
    driverCount: number;
    operatorCount: number;
  };
  
  const createEmptyDailyTotals = (): DailyTotals => ({
    dayLabor: 0,
    nightLabor: 0,
    dayOvertime: 0,
    nightOvertime: 0,
    driverCount: 0,
    operatorCount: 0,
  });
  
  export function calculatePayrollWorkTotals(
    employeeName: string,
    members: ReportMember[],
    reports: DailyReport[],
    dailyOverridesMap: PayrollDailyOverrideMap
  ): PayrollWorkTotals {
    const reportMap = new Map(
      reports.map((report) => [report.id, report])
    );
  
    const dailyTotalsMap = new Map<string, DailyTotals>();
  
    members.forEach((member) => {
      const report = reportMap.get(member.report_id);
  
      if (!report) {
        return;
      }
  
      const totals =
        dailyTotalsMap.get(report.report_date) ??
        createEmptyDailyTotals();
  
      const labor = toNumber(member.labor);
      const overtime = toNumber(member.overtime);
  
      if (report.shift_type === "night") {
        totals.nightLabor += labor;
        totals.nightOvertime += overtime;
      } else {
        totals.dayLabor += labor;
        totals.dayOvertime += overtime;
      }
  
      if (member.is_driver) {
        totals.driverCount += 1;
      }
  
      if (
        report.operator_name?.trim() === employeeName.trim()
      ) {
        totals.operatorCount += 1;
      }
  
      dailyTotalsMap.set(report.report_date, totals);
    });
  
    const keyPrefix = `${employeeName}__`;
  
    Object.entries(dailyOverridesMap).forEach(
      ([key, overrides]) => {
        if (!key.startsWith(keyPrefix)) {
          return;
        }
  
        const workDate = key.slice(keyPrefix.length);
  
        const totals =
          dailyTotalsMap.get(workDate) ??
          createEmptyDailyTotals();
  
        if (overrides.dayLabor !== undefined) {
          totals.dayLabor = toNumber(overrides.dayLabor);
        }
  
        if (overrides.nightLabor !== undefined) {
          totals.nightLabor = toNumber(overrides.nightLabor);
        }
  
        if (overrides.dayOvertime !== undefined) {
          totals.dayOvertime = toNumber(
            overrides.dayOvertime
          );
        }
  
        if (overrides.nightOvertime !== undefined) {
          totals.nightOvertime = toNumber(
            overrides.nightOvertime
          );
        }
  
        if (overrides.driverCount !== undefined) {
          totals.driverCount = toNumber(
            overrides.driverCount
          );
        }
  
        if (overrides.operatorCount !== undefined) {
          totals.operatorCount = toNumber(
            overrides.operatorCount
          );
        }
  
        dailyTotalsMap.set(workDate, totals);
      }
    );
  
    const dailyTotals = Array.from(
      dailyTotalsMap.values()
    );
  
    const dayLaborTotal = dailyTotals.reduce(
      (sum, totals) => sum + totals.dayLabor,
      0
    );
  
    const nightLaborTotal = dailyTotals.reduce(
      (sum, totals) => sum + totals.nightLabor,
      0
    );
  
    const dayOvertimeTotal = dailyTotals.reduce(
      (sum, totals) => sum + totals.dayOvertime,
      0
    );
  
    const nightOvertimeTotal = dailyTotals.reduce(
      (sum, totals) => sum + totals.nightOvertime,
      0
    );
  
    return {
      attendanceDays: dailyTotals.filter(
        (totals) =>
          totals.dayLabor + totals.nightLabor > 0
      ).length,
  
      laborTotal: dayLaborTotal + nightLaborTotal,
      dayLaborTotal,
      nightLaborTotal,
  
      overtimeTotal:
        dayOvertimeTotal + nightOvertimeTotal,
      dayOvertimeTotal,
      nightOvertimeTotal,
  
      driverCount: dailyTotals.reduce(
        (sum, totals) => sum + totals.driverCount,
        0
      ),
  
      operatorCount: dailyTotals.reduce(
        (sum, totals) => sum + totals.operatorCount,
        0
      ),
    };
  }