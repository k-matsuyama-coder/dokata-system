"use client";

import PayrollBreakdownInput from "./PayrollBreakdownInput";
import type {
    PayrollDailyBreakdownRow,
    PayrollDailyOverrideValues,
    PayrollSummaryRow,
  } from "../payroll-types";

import {
  buttonStyle,
  payrollBreakdownTableStyle,
  payrollBreakdownTdStyle,
  payrollBreakdownThStyle,
} from "../payroll-styles";

type PayrollBreakdownModalProps = {
  row: PayrollSummaryRow;

  dailyBreakdownMap: Record<
    string,
    PayrollDailyBreakdownRow[]
  >;

  openBreakdownEmployeeName: string | null;
  printBreakdownEmployeeName: string | null;
  printAllBreakdowns: boolean;

  setOpenBreakdownEmployeeName: (
    employeeName: string | null
  ) => void;

  printEmployeeBreakdown: (
    employeeName: string
  ) => void;

  savingBreakdownKey?: string | null;

handleDailyOverrideChange?: (
  employeeName: string,
  workDate: string,
  field: keyof PayrollDailyOverrideValues,
  value: string
) => void;

saveDailyOverride?: (
  employeeName: string,
  workDate: string
) => Promise<void>;

resetDailyOverride?: (
  employeeName: string,
  workDate: string
) => Promise<void>;
};

export default function PayrollBreakdownModal({
    row,
    dailyBreakdownMap,
    openBreakdownEmployeeName,
    printBreakdownEmployeeName,
    printAllBreakdowns,
    setOpenBreakdownEmployeeName,
    printEmployeeBreakdown,
    handleDailyOverrideChange,
    savingBreakdownKey,
    saveDailyOverride,
    resetDailyOverride,
  }: PayrollBreakdownModalProps) {
    const renderBreakdownInput = (
        detail: PayrollDailyBreakdownRow,
        field: keyof PayrollDailyOverrideValues,
        inputType: "text" | "number" = "text"
      ) => (
        <PayrollBreakdownInput
          employeeName={row.employee_name}
          workDate={detail.date}
          field={field}
          value={detail[field] ?? ""}
          inputType={inputType}
          onChange={handleDailyOverrideChange}
        />
      );
  return (
    <>
      {openBreakdownEmployeeName ===
  row.employee_name ||
printAllBreakdowns ? (
  <div
  className={[
    "payroll-breakdown-modal",

    printBreakdownEmployeeName ===
  row.employee_name ||
printAllBreakdowns
  ? "payroll-breakdown-print-target"
  : "",

printAllBreakdowns
  ? "payroll-breakdown-batch-target"
  : "",
  ]
    .filter(Boolean)
    .join(" ")}
  role="dialog"
  aria-modal="true"
  onClick={() =>
    setOpenBreakdownEmployeeName(null)
  }
  style={{
    position: "fixed",
    inset: 0,
    zIndex: 2147483647,
    padding: 24,
    backgroundColor: "rgba(17, 24, 39, 0.65)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
  }}
>
  <div
    onClick={(event) =>
      event.stopPropagation()
    }
    style={{
      width: "calc(100vw - 48px)",
      maxWidth: 1800,
      height: "calc(100vh - 48px)",
maxHeight: "calc(100vh - 48px)",
overflowY: "auto",
padding: 18,
boxSizing: "border-box",
      borderRadius: 14,
      backgroundColor: "#ffffff",
      boxShadow:
        "0 24px 60px rgba(0, 0, 0, 0.3)",
    }}
  >
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 2,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
        paddingBottom: 12,
        borderBottom: "1px solid #d1d5db",
        backgroundColor: "#ffffff",
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: 20,
        }}
      >
        {row.employee_name}　稼働日数内訳
      </h3>

      <div
  className="payroll-breakdown-actions"
  style={{
    display: "flex",
    gap: 8,
    alignItems: "center",
  }}
>
  <button
    type="button"
    onClick={() =>
      printEmployeeBreakdown(
        row.employee_name
      )
    }
    style={{
      ...buttonStyle,
      minWidth: 140,
      minHeight: 44,
      backgroundColor: "#2563eb",
      borderColor: "#2563eb",
      color: "#ffffff",
      fontSize: 15,
    }}
  >
    この内訳を印刷
  </button>

  <button
    type="button"
    onClick={() =>
      setOpenBreakdownEmployeeName(null)
    }
    style={{
      ...buttonStyle,
      minWidth: 100,
      minHeight: 44,
      backgroundColor: "#111827",
      color: "#ffffff",
      fontSize: 15,
    }}
  >
    閉じる
  </button>
</div>
    </div>

    <div
      style={{
        overflowX: "auto",
        width: "100%",
      }}
    >
      <table
        style={payrollBreakdownTableStyle}
      >
        <thead>
          <tr>
            <th
              rowSpan={2}
              style={payrollBreakdownThStyle}
            >
              日付
            </th>

            <th
              rowSpan={2}
              style={payrollBreakdownThStyle}
            >
              曜日
            </th>

            <th
              colSpan={2}
              style={payrollBreakdownThStyle}
            >
              出張所
            </th>

            <th
              colSpan={2}
              style={payrollBreakdownThStyle}
            >
              担当
            </th>

            <th
              colSpan={2}
              style={payrollBreakdownThStyle}
            >
              現場名
            </th>

            <th
              colSpan={2}
              style={payrollBreakdownThStyle}
            >
              出欠
            </th>

            <th
              colSpan={2}
              style={payrollBreakdownThStyle}
            >
              残業
            </th>

            <th
              colSpan={2}
              style={payrollBreakdownThStyle}
            >
              合計労働時間
            </th>

            <th
              rowSpan={2}
              style={payrollBreakdownThStyle}
            >
              延労働時間
            </th>

            <th
              rowSpan={2}
              style={payrollBreakdownThStyle}
            >
              車両運転
            </th>

            <th
              rowSpan={2}
              style={payrollBreakdownThStyle}
            >
              OP
            </th>

            <th
              rowSpan={2}
              style={payrollBreakdownThStyle}
            >
              その他・備考
            </th>
          </tr>

          <tr>
            {[
              "昼",
              "夜",
              "昼",
              "夜",
              "昼",
              "夜",
              "昼",
              "夜",
              "昼",
              "夜",
              "昼",
              "夜",
            ].map((label, index) => (
              <th
                key={`${label}-${index}`}
                style={payrollBreakdownThStyle}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {(
            dailyBreakdownMap[
              row.employee_name
            ] ?? []
          ).map((detail) => {
            const day = Number(
              detail.date.slice(8, 10)
            );

            const isSunday =
              detail.weekday === "日";

            const isSaturday =
              detail.weekday === "土";

              const breakdownKey =
              `${row.employee_name}__${detail.date}`;
            
            const isSaving =
              savingBreakdownKey === breakdownKey;

            return (
              <tr
                key={detail.date}
                style={{
                  backgroundColor: isSunday
                    ? "#fef2f2"
                    : isSaturday
                      ? "#eff6ff"
                      : "#ffffff",
                }}
              >
                <td style={payrollBreakdownTdStyle}>
  {Number(detail.date.slice(5, 7))}/{day}

  <div
    className="payroll-breakdown-row-actions"
    style={{
      display: "flex",
      justifyContent: "center",
      gap: 2,
      marginTop: 2,
    }}
  >
    <button
      type="button"
      disabled={isSaving}
      onClick={() =>
        void saveDailyOverride?.(
          row.employee_name,
          detail.date
        )
      }
      style={{
        padding: "1px 3px",
        border: "1px solid #94a3b8",
        borderRadius: 3,
        backgroundColor: "#ffffff",
        fontSize: 9,
        cursor: isSaving ? "wait" : "pointer",
      }}
    >
      {isSaving ? "保存中" : "保存"}
    </button>

    <button
      type="button"
      disabled={isSaving}
      onClick={() =>
        void resetDailyOverride?.(
          row.employee_name,
          detail.date
        )
      }
      style={{
        padding: "1px 3px",
        border: "1px solid #94a3b8",
        borderRadius: 3,
        backgroundColor: "#ffffff",
        fontSize: 9,
        cursor: isSaving ? "wait" : "pointer",
      }}
    >
      リセット
    </button>
  </div>
</td>

                <td
                  style={{
                    ...payrollBreakdownTdStyle,
                    color: isSunday
                      ? "#dc2626"
                      : isSaturday
                        ? "#2563eb"
                        : "#111827",
                    fontWeight: 700,
                  }}
                >
                  {detail.weekday}
                </td>

                <td
                  style={
                    payrollBreakdownTdStyle
                  }
                >
                  {renderBreakdownInput(detail, "dayContractor")}
                </td>

                <td
                  style={
                    payrollBreakdownTdStyle
                  }
                >
                  {renderBreakdownInput(detail, "nightContractor")}
                </td>

                <td
                  style={
                    payrollBreakdownTdStyle
                  }
                >
                  {renderBreakdownInput(detail, "dayManager")}
                </td>

                <td
                  style={
                    payrollBreakdownTdStyle
                  }
                >
                  {renderBreakdownInput(detail, "nightManager")}
                </td>

                <td
                  style={{
                    ...payrollBreakdownTdStyle,
                    textAlign: "left",
                  }}
                >
                  {renderBreakdownInput(detail, "daySite")}
                </td>

                <td
                  style={{
                    ...payrollBreakdownTdStyle,
                    textAlign: "left",
                  }}
                >
                  {renderBreakdownInput(detail, "nightSite")}
                </td>

                <td
                  style={
                    payrollBreakdownTdStyle
                  }
                >
                  {renderBreakdownInput(detail, "dayLabor", "number")}
                </td>

                <td
                  style={
                    payrollBreakdownTdStyle
                  }
                >
                  {renderBreakdownInput(detail, "nightLabor", "number")}
                </td>

                <td
                  style={
                    payrollBreakdownTdStyle
                  }
                >
                  {renderBreakdownInput(detail, "dayOvertime", "number")}
                </td>

                <td
                  style={
                    payrollBreakdownTdStyle
                  }
                >
                  {renderBreakdownInput(detail, "nightOvertime", "number")}
                </td>

                <td
                  style={
                    payrollBreakdownTdStyle
                  }
                >
                  {renderBreakdownInput(detail, "dayWorkHours", "number")}
                </td>

                <td
                  style={
                    payrollBreakdownTdStyle
                  }
                >
                  {renderBreakdownInput(detail, "nightWorkHours", "number")}
                </td>

                <td
                  style={
                    payrollBreakdownTdStyle
                  }
                >
                  {renderBreakdownInput(
  detail,
  "extendedWorkHours",
  "number"
)}
                </td>

                <td
                  style={
                    payrollBreakdownTdStyle
                  }
                >
                  {renderBreakdownInput(detail, "driverCount", "number")}
                </td>

                <td
                  style={
                    payrollBreakdownTdStyle
                  }
                >
                  {renderBreakdownInput(detail, "operatorCount", "number")}
                </td>

                <td
                  style={{
                    ...payrollBreakdownTdStyle,
                    minWidth: 160,
                    textAlign: "left",
                    whiteSpace: "normal",
                  }}
                >
                  {renderBreakdownInput(detail, "note")}
                </td>
              </tr>
            );
          })}
        </tbody>

        <tfoot>
          <tr>
            <th
              colSpan={8}
              style={payrollBreakdownThStyle}
            >
              合計
            </th>

            <th style={payrollBreakdownThStyle}>
              {row.day_labor_total}
            </th>

            <th style={payrollBreakdownThStyle}>
              {row.night_labor_total}
            </th>

            <th style={payrollBreakdownThStyle}>
              {row.day_overtime_total}
            </th>

            <th style={payrollBreakdownThStyle}>
              {row.night_overtime_total}
            </th>

            <th style={payrollBreakdownThStyle}>
              {(
                dailyBreakdownMap[
                  row.employee_name
                ] ?? []
              ).reduce(
                (sum, detail) =>
                  sum + detail.dayWorkHours,
                0
              )}
            </th>

            <th style={payrollBreakdownThStyle}>
              {(
                dailyBreakdownMap[
                  row.employee_name
                ] ?? []
              ).reduce(
                (sum, detail) =>
                  sum + detail.nightWorkHours,
                0
              )}
            </th>

            <th style={payrollBreakdownThStyle}>
              {row.overtime_total}
            </th>

            <th style={payrollBreakdownThStyle}>
              {row.driver_count}
            </th>

            <th style={payrollBreakdownThStyle}>
              {row.operator_count}
            </th>

            <th style={payrollBreakdownThStyle}>
              -
            </th>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
  </div>
) : null}
    </>
  );
}