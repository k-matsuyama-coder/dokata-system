"use client";

import type {
  PayrollDailyOverrideValues,
} from "../payroll-types";

type PayrollBreakdownInputProps = {
  employeeName: string;
  workDate: string;
  field: keyof PayrollDailyOverrideValues;
  value: string | number;
  inputType?: "text" | "number";

  onChange?: (
    employeeName: string,
    workDate: string,
    field: keyof PayrollDailyOverrideValues,
    value: string
  ) => void;
};

export default function PayrollBreakdownInput({
  employeeName,
  workDate,
  field,
  value,
  inputType = "text",
  onChange,
}: PayrollBreakdownInputProps) {
  const displayValue =
    inputType === "number" && Number(value) === 0
      ? ""
      : String(value ?? "");

  return (
    <>
      <input
        className="payroll-breakdown-edit-input"
        type={inputType}
        step={inputType === "number" ? "any" : undefined}
        value={displayValue}
        onChange={(event) =>
          onChange?.(
            employeeName,
            workDate,
            field,
            event.target.value
          )
        }
        style={{
          width: "100%",
          minWidth:
            inputType === "number" ? 42 : 80,
          boxSizing: "border-box",
          padding: "4px 5px",
          border: "1px solid #cbd5e1",
          borderRadius: 4,
          backgroundColor: "#ffffff",
          color: "#111827",
          font: "inherit",
          textAlign:
            inputType === "number"
              ? "right"
              : "left",
        }}
      />

      <span className="payroll-breakdown-print-value">
        {displayValue}
      </span>
    </>
  );
}