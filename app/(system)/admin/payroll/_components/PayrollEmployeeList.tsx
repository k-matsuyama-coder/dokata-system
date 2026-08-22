"use client";

import type {
    Dispatch,
    SetStateAction,
  } from "react";
import PayrollBreakdownModal from "./PayrollBreakdownModal";
import PayrollNumberInput from "./PayrollNumberInput";

import type {
  PayrollDailyBreakdownRow,
  PayrollDailyOverrideValues,
  PayrollMonthlyAdjustment,
  PayrollSetting,
  PayrollSummaryRow,
} from "../payroll-types";

import {
  buttonStyle,
  employeeSummaryLabelStyle,
  employeeSummaryValueStyle,
  payrollInputLabelStyle,
  payrollInputStyle,
  payrollSectionStyle,
  payrollSectionTitleStyle,
  payrollTotalRowStyle,
  payrollValueRowStyle,
} from "../payroll-styles";

type PayrollEmployeeListProps = {
  summaryRows: PayrollSummaryRow[];

  dailyBreakdownMap: Record<
    string,
    PayrollDailyBreakdownRow[]
  >;

  month: string;

  openEmployeeName: string | null;
  openBreakdownEmployeeName: string | null;
  printEmployeeName: string | null;
  printBreakdownEmployeeName: string | null;
  savingEmployeeName: string | null;

  printAllEmployees: boolean;
  printAllBreakdowns: boolean;

  toggleEmployeeDetail: (
    employeeName: string
  ) => void;

  setOpenBreakdownEmployeeName: Dispatch<
  SetStateAction<string | null>
>;

  printEmployeePayslip: (
    employeeName: string
  ) => void;

  printEmployeeBreakdown: (
    employeeName: string
  ) => void;

  handleSettingChange: (
    employeeName: string,
    field: keyof PayrollSetting,
    value: string
  ) => void;

  handleMonthlyAdjustmentChange: (
    employeeName: string,
    field: keyof PayrollMonthlyAdjustment,
    value: string
  ) => void;

  saveSetting: (
    employeeName: string
  ) => Promise<void>;

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

export default function PayrollEmployeeList({
  summaryRows,
  dailyBreakdownMap,
  month,
  openEmployeeName,
  openBreakdownEmployeeName,
  printEmployeeName,
  printBreakdownEmployeeName,
  savingEmployeeName,
  printAllEmployees,
  printAllBreakdowns,
  toggleEmployeeDetail,
  setOpenBreakdownEmployeeName,
  printEmployeePayslip,
  printEmployeeBreakdown,
  handleSettingChange,
  handleMonthlyAdjustmentChange,
saveSetting,
savingBreakdownKey,
handleDailyOverrideChange,
saveDailyOverride,
resetDailyOverride,
}: PayrollEmployeeListProps) {
  return (
    <>
      {<div
  className="payroll-employee-list"
  style={{
    display: "flex",
    flexDirection: "column",
    gap: 12,
  }}
>
  {summaryRows.map((row) => {
    const isOpen =
    openEmployeeName === row.employee_name ||
    printAllEmployees ||
    printAllBreakdowns;

    return (
      <section
  key={row.employee_name}
  className={[
    "payroll-employee-card",
  
    printAllEmployees ||
    printEmployeeName === row.employee_name
      ? "payroll-print-target"
      : "",
  
    printAllEmployees
      ? "payroll-print-batch-target"
      : "",

      printBreakdownEmployeeName ===
  row.employee_name ||
printAllBreakdowns
  ? "payroll-breakdown-print-parent"
  : "",

printAllBreakdowns
  ? "payroll-breakdown-batch-parent"
  : "",
  ]
    .filter(Boolean)
    .join(" ")}
  style={{
          backgroundColor: "#fff",
          border: "1px solid #d1d5db",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          className="payroll-screen-header"
          onClick={() =>
            toggleEmployeeDetail(row.employee_name)
          }
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns:
              "minmax(150px, 1.5fr) repeat(4, minmax(110px, 1fr)) 40px",
            gap: 12,
            alignItems: "center",
            padding: 16,
            border: "none",
            backgroundColor: "#fff",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 900,
              }}
            >
              {row.employee_name}
            </div>

            <div
              style={{
                marginTop: 4,
                color: "#6b7280",
                fontSize: 12,
              }}
            >
              {row.setting.salary_type === "monthly"
                ? "月給"
                : row.setting.salary_type === "daily"
                  ? "日給"
                  : "時間給"}
            </div>
          </div>

          <div>
            <div style={employeeSummaryLabelStyle}>
              勤務日数
            </div>
            <div style={employeeSummaryValueStyle}>
              {row.attendance_days}日
            </div>
          </div>

          <div>
            <div style={employeeSummaryLabelStyle}>
              支給総額
            </div>
            <div style={employeeSummaryValueStyle}>
              ¥{formatCurrency(row.gross_total)}
            </div>
          </div>

          <div>
            <div style={employeeSummaryLabelStyle}>
              控除合計
            </div>
            <div
              style={{
                ...employeeSummaryValueStyle,
                color: "#dc2626",
              }}
            >
              ¥{formatCurrency(row.deduction_total)}
            </div>
          </div>

          <div>
            <div style={employeeSummaryLabelStyle}>
              差引支給額
            </div>
            <div
              style={{
                ...employeeSummaryValueStyle,
                color: "#047857",
              }}
            >
              ¥{formatCurrency(row.net_total)}
            </div>
          </div>

          <div
            style={{
              fontSize: 20,
              textAlign: "center",
            }}
          >
            {isOpen ? "▲" : "▼"}
          </div>
        </button>

        {isOpen ? (
          <div
            style={{
              padding: 16,
              borderTop: "1px solid #e5e7eb",
              backgroundColor: "#f9fafb",
            }}
          >

<div
  className="payroll-print-hide"
  style={{
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    marginBottom: 16,
  }}
>
<button
  type="button"
  onClick={() =>
    setOpenBreakdownEmployeeName(
      (current) =>
        current === row.employee_name
          ? null
          : row.employee_name
    )
  }
  style={{
    ...buttonStyle,
    backgroundColor: "#ffffff",
    borderColor: "#2563eb",
    color: "#2563eb",
  }}
>
  {openBreakdownEmployeeName ===
  row.employee_name
    ? "稼働内訳を閉じる"
    : "稼働内訳を表示"}
</button>
  <button
    type="button"
    onClick={() =>
      printEmployeePayslip(row.employee_name)
    }
    style={{
      ...buttonStyle,
      backgroundColor: "#2563eb",
      borderColor: "#2563eb",
      color: "#fff",
    }}
  >
    給与明細を印刷
  </button>
</div>

<PayrollBreakdownModal
  row={row}
  dailyBreakdownMap={dailyBreakdownMap}
  openBreakdownEmployeeName={
    openBreakdownEmployeeName
  }
  printBreakdownEmployeeName={
    printBreakdownEmployeeName
  }
  printAllBreakdowns={printAllBreakdowns}
  setOpenBreakdownEmployeeName={
    setOpenBreakdownEmployeeName
  }
  printEmployeeBreakdown={
    printEmployeeBreakdown
  }
  savingBreakdownKey={savingBreakdownKey}
  handleDailyOverrideChange={
    handleDailyOverrideChange
  }
  saveDailyOverride={saveDailyOverride}
  resetDailyOverride={resetDailyOverride}
  />

<div className="payroll-print-title">
  <h1>給与明細</h1>

  <div className="payroll-print-meta">
    <span>
      {month.slice(0, 4)}年
      {Number(month.slice(5, 7))}月分
    </span>

    <strong>{row.employee_name} 殿</strong>
  </div>
</div>

<div
className="payroll-print-hide"
  style={{
    ...payrollSectionStyle,
    marginBottom: 16,
  }}
>
  <h3 style={payrollSectionTitleStyle}>
    固定給与設定
  </h3>

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(180px, 1fr))",
      gap: 12,
    }}
  >
    <label style={payrollInputLabelStyle}>
      <span>給与区分</span>
      <select
        value={row.setting.salary_type}
        onChange={(event) =>
          handleSettingChange(
            row.employee_name,
            "salary_type",
            event.target.value
          )
        }
        style={payrollInputStyle}
      >
        <option value="monthly">月給</option>
        <option value="daily">日給</option>
        <option value="hourly">時間給</option>
      </select>
    </label>

    <PayrollNumberInput
      label="基本給"
      value={row.setting.base_salary}
      onChange={(value) =>
        handleSettingChange(
          row.employee_name,
          "base_salary",
          value
        )
      }
    />

    <PayrollNumberInput
      label="現場手当"
      value={row.setting.site_allowance}
      onChange={(value) =>
        handleSettingChange(
          row.employee_name,
          "site_allowance",
          value
        )
      }
    />

    <PayrollNumberInput
      label="運転単価"
      value={row.setting.driver_allowance}
      onChange={(value) =>
        handleSettingChange(
          row.employee_name,
          "driver_allowance",
          value
        )
      }
    />

    <PayrollNumberInput
      label="OP単価"
      value={row.setting.operator_allowance}
      onChange={(value) =>
        handleSettingChange(
          row.employee_name,
          "operator_allowance",
          value
        )
      }
    />

    <PayrollNumberInput
      label="出勤手当（日額）"
      value={row.setting.attendance_allowance}
      onChange={(value) =>
        handleSettingChange(
          row.employee_name,
          "attendance_allowance",
          value
        )
      }
    />

    <PayrollNumberInput
      label="積立金"
      value={row.setting.reserve_fund}
      onChange={(value) =>
        handleSettingChange(
          row.employee_name,
          "reserve_fund",
          value
        )
      }
    />

<PayrollNumberInput
  label="昼単価（0で自動計算）"
  value={row.setting.day_unit_price}
  onChange={(value) =>
    handleSettingChange(
      row.employee_name,
      "day_unit_price",
      value
    )
  }
/>

<PayrollNumberInput
  label="夜単価（0で自動計算）"
  value={row.setting.night_unit_price}
  onChange={(value) =>
    handleSettingChange(
      row.employee_name,
      "night_unit_price",
      value
    )
  }
/>

<PayrollNumberInput
  label="残業単価（0で自動計算）"
  value={row.setting.overtime_unit_price}
  onChange={(value) =>
    handleSettingChange(
      row.employee_name,
      "overtime_unit_price",
      value
    )
  }
/>

<PayrollNumberInput
  label="基準勤務日数"
  value={row.setting.standard_work_days}
  step={0.1}
  onChange={(value) =>
    handleSettingChange(
      row.employee_name,
      "standard_work_days",
      value
    )
  }
/>

<PayrollNumberInput
  label="1日の勤務時間"
  value={row.setting.hours_per_day}
  step={0.5}
  onChange={(value) =>
    handleSettingChange(
      row.employee_name,
      "hours_per_day",
      value
    )
  }
/>

<PayrollNumberInput
  label="夜勤倍率"
  value={row.setting.night_multiplier}
  step={0.01}
  onChange={(value) =>
    handleSettingChange(
      row.employee_name,
      "night_multiplier",
      value
    )
  }
/>

<PayrollNumberInput
  label="残業倍率"
  value={row.setting.overtime_multiplier}
  step={0.01}
  onChange={(value) =>
    handleSettingChange(
      row.employee_name,
      "overtime_multiplier",
      value
    )
  }
/>

<PayrollNumberInput
  label="休日出勤倍率"
  value={row.setting.holiday_multiplier}
  step={0.01}
  onChange={(value) =>
    handleSettingChange(
      row.employee_name,
      "holiday_multiplier",
      value
    )
  }
/>

<PayrollNumberInput
  label="雇用保険率"
  value={row.setting.employment_insurance_rate}
  step={0.0001}
  onChange={(value) =>
    handleSettingChange(
      row.employee_name,
      "employment_insurance_rate",
      value
    )
  }
/>
  </div>

  <button
    type="button"
    onClick={() =>
      void saveSetting(row.employee_name)
    }
    disabled={
      savingEmployeeName === row.employee_name
    }
    style={{
      ...buttonStyle,
      marginTop: 14,
      backgroundColor: "#111827",
      color: "#fff",
    }}
  >
    {savingEmployeeName === row.employee_name
      ? "保存中..."
      : "給与設定を保存"}
  </button>
</div>

<div
className="payroll-print-hide"
  style={{
    ...payrollSectionStyle,
    marginBottom: 16,
  }}
>
  <h3 style={payrollSectionTitleStyle}>
    {month} 月別給与・控除
  </h3>

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(180px, 1fr))",
      gap: 12,
    }}
  >
    <PayrollNumberInput
      label="休日出勤（日数）"
      value={
        row.monthly_adjustment.holiday_work_days
      }
      step={0.5}
      onChange={(value) =>
        handleMonthlyAdjustmentChange(
          row.employee_name,
          "holiday_work_days",
          value
        )
      }
    />

    <PayrollNumberInput
      label="有給休暇（日数）"
      value={
        row.monthly_adjustment.paid_leave_days
      }
      step={0.5}
      onChange={(value) =>
        handleMonthlyAdjustmentChange(
          row.employee_name,
          "paid_leave_days",
          value
        )
      }
    />

    <PayrollNumberInput
      label="その他手当"
      value={row.monthly_adjustment.other_allowance}
      onChange={(value) =>
        handleMonthlyAdjustmentChange(
          row.employee_name,
          "other_allowance",
          value
        )
      }
    />

    <PayrollNumberInput
      label="健康保険"
      value={row.monthly_adjustment.health_insurance}
      onChange={(value) =>
        handleMonthlyAdjustmentChange(
          row.employee_name,
          "health_insurance",
          value
        )
      }
    />

    <PayrollNumberInput
      label="厚生年金"
      value={row.monthly_adjustment.pension}
      onChange={(value) =>
        handleMonthlyAdjustmentChange(
          row.employee_name,
          "pension",
          value
        )
      }
    />

    <PayrollNumberInput
      label="雇用保険（0で自動計算）"
      value={
        row.monthly_adjustment
          .employment_insurance
      }
      onChange={(value) =>
        handleMonthlyAdjustmentChange(
          row.employee_name,
          "employment_insurance",
          value
        )
      }
    />

    <PayrollNumberInput
      label="所得税"
      value={row.monthly_adjustment.income_tax}
      onChange={(value) =>
        handleMonthlyAdjustmentChange(
          row.employee_name,
          "income_tax",
          value
        )
      }
    />

    <PayrollNumberInput
      label="市町村民税"
      value={row.monthly_adjustment.resident_tax}
      onChange={(value) =>
        handleMonthlyAdjustmentChange(
          row.employee_name,
          "resident_tax",
          value
        )
      }
    />

    <PayrollNumberInput
      label="宿舎代"
      value={row.monthly_adjustment.dormitory_fee}
      onChange={(value) =>
        handleMonthlyAdjustmentChange(
          row.employee_name,
          "dormitory_fee",
          value
        )
      }
    />

    <PayrollNumberInput
      label="その他控除"
      value={
        row.monthly_adjustment.other_deduction
      }
      onChange={(value) =>
        handleMonthlyAdjustmentChange(
          row.employee_name,
          "other_deduction",
          value
        )
      }
    />

    <label style={payrollInputLabelStyle}>
      <span>備考</span>

      <input
        type="text"
        value={row.monthly_adjustment.note ?? ""}
        onChange={(event) =>
          handleMonthlyAdjustmentChange(
            row.employee_name,
            "note",
            event.target.value
          )
        }
        style={payrollInputStyle}
      />
    </label>
  </div>

  <div
    style={{
      marginTop: 10,
      color: "#6b7280",
      fontSize: 12,
    }}
  >
    雇用保険を0にすると、支給総額×雇用保険率で自動計算します。
  </div>
</div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {/* 勤怠集計 */}
              <div style={payrollSectionStyle}>
                <h3 style={payrollSectionTitleStyle}>
                  勤怠集計
                </h3>

                <div style={payrollValueRowStyle}>
                  <span>昼勤務</span>
                  <strong>
                    {row.day_labor_total}日
                  </strong>
                </div>

                <div style={payrollValueRowStyle}>
                  <span>夜勤務</span>
                  <strong>
                    {row.night_labor_total}日
                  </strong>
                </div>

                <div style={payrollValueRowStyle}>
                  <span>昼残業</span>
                  <strong>
                    {row.day_overtime_total}時間
                  </strong>
                </div>

                <div style={payrollValueRowStyle}>
                  <span>夜残業</span>
                  <strong>
                    {row.night_overtime_total}時間
                  </strong>
                </div>

                <div style={payrollValueRowStyle}>
                  <span>連絡車運転</span>
                  <strong>{row.driver_count}日</strong>
                </div>

                <div style={payrollValueRowStyle}>
                  <span>機械運転・OP</span>
                  <strong>{row.operator_count}日</strong>
                </div>
              </div>

              {/* 単価 */}
              <div style={payrollSectionStyle}>
                <h3 style={payrollSectionTitleStyle}>
                  自動計算単価
                </h3>

                <div style={payrollValueRowStyle}>
                  <span>昼時間給</span>
                  <strong>
                    ¥{formatCurrency(row.day_hourly_rate)}
                  </strong>
                </div>

                <div style={payrollValueRowStyle}>
                  <span>夜時間給</span>
                  <strong>
                    ¥{formatCurrency(row.night_hourly_rate)}
                  </strong>
                </div>

                <div style={payrollValueRowStyle}>
                  <span>昼残業単価</span>
                  <strong>
                    ¥{formatCurrency(row.day_overtime_rate)}
                  </strong>
                </div>

                <div style={payrollValueRowStyle}>
                  <span>夜残業単価</span>
                  <strong>
                    ¥{formatCurrency(row.night_overtime_rate)}
                  </strong>
                </div>
              </div>

              {/* 支給 */}
              <div style={payrollSectionStyle}>
                <h3 style={payrollSectionTitleStyle}>
                  支給内訳
                </h3>

                <div style={payrollValueRowStyle}>
                  <span>基本給</span>
                  <strong>
                    ¥{formatCurrency(row.base_pay)}
                  </strong>
                </div>

                <div style={payrollValueRowStyle}>
                  <span>現場手当</span>
                  <strong>
                    ¥{formatCurrency(
                      row.site_allowance_amount
                    )}
                  </strong>
                </div>

                <div style={payrollValueRowStyle}>
                  <span>夜勤手当</span>
                  <strong>
                    ¥{formatCurrency(
                      row.night_allowance_amount
                    )}
                  </strong>
                </div>

                <div style={payrollValueRowStyle}>
                  <span>昼残業代</span>
                  <strong>
                    ¥{formatCurrency(
                      row.day_overtime_amount
                    )}
                  </strong>
                </div>

                <div style={payrollValueRowStyle}>
                  <span>夜残業代</span>
                  <strong>
                    ¥{formatCurrency(
                      row.night_overtime_amount
                    )}
                  </strong>
                </div>

                <div style={payrollValueRowStyle}>
                  <span>休日出勤</span>
                  <strong>
                    ¥{formatCurrency(
                      row.holiday_work_amount
                    )}
                  </strong>
                </div>

                <div style={payrollValueRowStyle}>
                  <span>有給</span>
                  <strong>
                    ¥{formatCurrency(
                      row.paid_leave_amount
                    )}
                  </strong>
                </div>

                <div style={payrollTotalRowStyle}>
                  <span>支給総額</span>
                  <strong>
                    ¥{formatCurrency(row.gross_total)}
                  </strong>
                </div>
              </div>

              {/* 控除 */}
              <div style={payrollSectionStyle}>
                <h3 style={payrollSectionTitleStyle}>
                  控除内訳
                </h3>

                <div style={payrollValueRowStyle}>
                  <span>健康保険</span>
                  <strong>
                    ¥{formatCurrency(
                      row.health_insurance_amount
                    )}
                  </strong>
                </div>

                <div style={payrollValueRowStyle}>
                  <span>厚生年金</span>
                  <strong>
                    ¥{formatCurrency(row.pension_amount)}
                  </strong>
                </div>

                <div style={payrollValueRowStyle}>
                  <span>雇用保険</span>
                  <strong>
                    ¥{formatCurrency(
                      row.employment_insurance_amount
                    )}
                  </strong>
                </div>

                <div style={payrollValueRowStyle}>
                  <span>所得税</span>
                  <strong>
                    ¥{formatCurrency(row.income_tax_amount)}
                  </strong>
                </div>

                <div style={payrollValueRowStyle}>
                  <span>市町村民税</span>
                  <strong>
                    ¥{formatCurrency(
                      row.resident_tax_amount
                    )}
                  </strong>
                </div>

                <div style={payrollValueRowStyle}>
                  <span>宿舎代</span>
                  <strong>
                    ¥{formatCurrency(
                      row.dormitory_fee_amount
                    )}
                  </strong>
                </div>

                <div style={payrollValueRowStyle}>
                  <span>積立金</span>
                  <strong>
                    ¥{formatCurrency(
                      row.reserve_fund_amount
                    )}
                  </strong>
                </div>

                <div style={payrollTotalRowStyle}>
                  <span>控除合計</span>
                  <strong>
                    ¥{formatCurrency(
                      row.deduction_total
                    )}
                  </strong>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                padding: 16,
                borderRadius: 12,
                backgroundColor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <strong>差引支給額</strong>

              <strong
                style={{
                  color: "#047857",
                  fontSize: 24,
                }}
              >
                ¥{formatCurrency(row.net_total)}
              </strong>
            </div>
          </div>
        ) : null}
      </section>
    );
  })}
</div>}
    </>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ja-JP").format(
    Math.round(value)
  );
}