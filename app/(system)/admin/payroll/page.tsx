// app/(system)/admin/payroll/page.tsx
"use client";

import { useState } from "react";
import BackButton from "@/app/components/BackButton";
import PayrollPrintStyles from "./_components/PayrollPrintStyles";
import PayrollEmployeeList from "./_components/PayrollEmployeeList";
import PayrollPageHeader from "./_components/PayrollPageHeader";
import usePayrollCalculations from "./_hooks/usePayrollCalculations";
import usePayrollPrint from "./_hooks/usePayrollPrint";
import usePayrollData from "./_hooks/usePayrollData";
import { getCurrentMonthString } from "./payroll-utils";

export default function PayrollPage() {
  const [month, setMonth] = useState(getCurrentMonthString);
  const {
    saveSetting,
handleSettingChange,
handleMonthlyAdjustmentChange,
handleDailyOverrideChange,
saveDailyOverride,
resetDailyOverride,
checkAdminAndLoad,
    organizationId,
    employees,
    reports,
    assignmentsForPayroll,
    reportMembers,
    settingsMap,
    monthlyAdjustmentsMap,
    dailyOverridesMap,
    loading,
    authChecking,
    savingEmployeeName,
savingBreakdownKey,
errorMessage,
    settingsWarning,
  } = usePayrollData(month);

  const {
    openEmployeeName,
    openBreakdownEmployeeName,
    setOpenBreakdownEmployeeName,
    printEmployeeName,
    printBreakdownEmployeeName,
    batchPrintMode,
    setBatchPrintMode,
    printAllBreakdowns,
    printAllEmployees,
    toggleEmployeeDetail,
    printEmployeePayslip,
    printAllPayrollDocuments,
    printEmployeeBreakdown,
  } = usePayrollPrint(month);

  const {
    summaryRows,
    dailyBreakdownMap,
    grossGrandTotal,
    deductionGrandTotal,
    netGrandTotal,
  } = usePayrollCalculations({
    month,
    organizationId,
    employees,
    reports,
    reportMembers,
    assignmentsForPayroll,
    settingsMap,
    monthlyAdjustmentsMap,
    dailyOverridesMap,
  });

  if (authChecking || loading) {
    return <div style={{ padding: 16 }}>読み込み中...</div>;
  }

  return (
    <div
    className={[
      "payroll-page",
      printAllEmployees && printAllBreakdowns
        ? "payroll-batch-both"
        : "",
    ]
      .filter(Boolean)
      .join(" ")}
  style={{
    padding: 16,
    backgroundColor: "#f5f6f8",
    minHeight: "100vh",
  }}
>
      <BackButton />

      <div style={{ maxWidth: 1600, margin: "0 auto" }}>
      <PayrollPageHeader
  month={month}
  setMonth={setMonth}
  batchPrintMode={batchPrintMode}
  setBatchPrintMode={setBatchPrintMode}
  summaryRows={summaryRows}
  grossGrandTotal={grossGrandTotal}
  deductionGrandTotal={deductionGrandTotal}
  netGrandTotal={netGrandTotal}
  errorMessage={errorMessage}
  settingsWarning={settingsWarning}
  checkAdminAndLoad={checkAdminAndLoad}
  printAllPayrollDocuments={
    printAllPayrollDocuments
  }
/>

<PayrollEmployeeList
  summaryRows={summaryRows}
  dailyBreakdownMap={dailyBreakdownMap}
  month={month}
  openEmployeeName={openEmployeeName}
  openBreakdownEmployeeName={
    openBreakdownEmployeeName
  }
  printEmployeeName={printEmployeeName}
  printBreakdownEmployeeName={
    printBreakdownEmployeeName
  }
  savingEmployeeName={savingEmployeeName}
  printAllEmployees={printAllEmployees}
  printAllBreakdowns={printAllBreakdowns}
  toggleEmployeeDetail={toggleEmployeeDetail}
  setOpenBreakdownEmployeeName={
    setOpenBreakdownEmployeeName
  }
  printEmployeePayslip={printEmployeePayslip}
  printEmployeeBreakdown={
    printEmployeeBreakdown
  }
  handleSettingChange={handleSettingChange}
  handleMonthlyAdjustmentChange={
    handleMonthlyAdjustmentChange
  }
  saveSetting={saveSetting}
  savingBreakdownKey={savingBreakdownKey}
  handleDailyOverrideChange={
    handleDailyOverrideChange
  }
  saveDailyOverride={saveDailyOverride}
  resetDailyOverride={resetDailyOverride}
  />
      </div>
      <PayrollPrintStyles />
    </div>
  );
}