"use client";

import type {
  Dispatch,
  SetStateAction,
} from "react";

import type {
  BatchPrintMode,
  PayrollSummaryRow,
} from "../payroll-types";

import {
  buttonStyle,
  errorBoxStyle,
  inputStyle,
  summaryCardStyle,
  summaryLabelStyle,
  summaryValueStyle,
  warningBoxStyle,
} from "../payroll-styles";

type PayrollPageHeaderProps = {
  month: string;
  setMonth: Dispatch<SetStateAction<string>>;

  batchPrintMode: BatchPrintMode;
  setBatchPrintMode: Dispatch<
    SetStateAction<BatchPrintMode>
  >;

  summaryRows: PayrollSummaryRow[];

  grossGrandTotal: number;
  deductionGrandTotal: number;
  netGrandTotal: number;

  errorMessage: string;
  settingsWarning: string;

  checkAdminAndLoad: () => Promise<void>;
  printAllPayrollDocuments: () => void;
};

export default function PayrollPageHeader({
  month,
  setMonth,
  batchPrintMode,
  setBatchPrintMode,
  summaryRows,
  grossGrandTotal,
  deductionGrandTotal,
  netGrandTotal,
  errorMessage,
  settingsWarning,
  checkAdminAndLoad,
  printAllPayrollDocuments,
}: PayrollPageHeaderProps) {
  return (
    <>
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
<select
  value={batchPrintMode}
  onChange={(e) =>
    setBatchPrintMode(
      e.target.value as BatchPrintMode
    )
  }
  style={inputStyle}
>
  <option value="both">
    明細&内訳
  </option>
  <option value="payslip">
    明細
  </option>
  <option value="breakdown">
    内訳
  </option>
</select>

<button
  type="button"
  onClick={printAllPayrollDocuments}
  disabled={summaryRows.length === 0}
  style={{
    ...buttonStyle,
    backgroundColor:
      summaryRows.length === 0
        ? "#9ca3af"
        : "#2563eb",
    cursor:
      summaryRows.length === 0
        ? "not-allowed"
        : "pointer",
  }}
>
  まとめて印刷
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
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 12,
    marginBottom: 16,
  }}
>
  <div style={summaryCardStyle}>
    <div style={summaryLabelStyle}>対象月</div>
    <div style={summaryValueStyle}>{month}</div>
  </div>

  <div style={summaryCardStyle}>
    <div style={summaryLabelStyle}>対象社員数</div>
    <div style={summaryValueStyle}>
      {summaryRows.length}人
    </div>
  </div>

  <div style={summaryCardStyle}>
    <div style={summaryLabelStyle}>支給総額</div>
    <div style={summaryValueStyle}>
      ¥{formatCurrency(grossGrandTotal)}
    </div>
  </div>

  <div style={summaryCardStyle}>
    <div style={summaryLabelStyle}>控除合計</div>
    <div
      style={{
        ...summaryValueStyle,
        color: "#dc2626",
      }}
    >
      ¥{formatCurrency(deductionGrandTotal)}
    </div>
  </div>

  <div style={summaryCardStyle}>
    <div style={summaryLabelStyle}>差引支給額</div>
    <div
      style={{
        ...summaryValueStyle,
        color: "#047857",
      }}
    >
      ¥{formatCurrency(netGrandTotal)}
    </div>
  </div>
</div>
    </>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ja-JP").format(
    Math.round(value)
  );
}