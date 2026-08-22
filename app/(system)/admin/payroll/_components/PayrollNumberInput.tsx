"use client";

import type { CSSProperties } from "react";

type PayrollNumberInputProps = {
  label: string;
  value: number | null;
  onChange: (value: string) => void;
  step?: number | string;
};

export default function PayrollNumberInput({
  label,
  value,
  onChange,
  step = 1,
}: PayrollNumberInputProps) {
  return (
    <label style={labelStyle}>
      <span>{label}</span>

      <input
        type="number"
        min={0}
        step={step}
        value={value ?? 0}
        onChange={(event) =>
          onChange(event.target.value)
        }
        style={inputStyle}
      />
    </label>
  );
}

const labelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  color: "#374151",
  fontSize: 13,
  fontWeight: 700,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: 40,
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  backgroundColor: "#fff",
  color: "#111827",
  fontSize: 14,
  boxSizing: "border-box",
};