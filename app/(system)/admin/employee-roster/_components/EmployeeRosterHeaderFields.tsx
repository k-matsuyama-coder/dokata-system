"use client";

import type { CSSProperties } from "react";
import type { EmployeeRosterDraftInput } from "../employee-roster-types";

type Props = {
  value: EmployeeRosterDraftInput;
  disabled: boolean;
  onChange: (
    patch: Partial<EmployeeRosterDraftInput>
  ) => void;
};

export default function EmployeeRosterHeaderFields({
  value,
  disabled,
  onChange,
}: Props) {
  return (
    <>
      <section style={sectionStyle}>
        <h2 style={headingStyle}>名簿情報</h2>

        <div style={gridStyle}>
          <TextField
            label="名簿名"
            value={value.title}
            disabled={disabled}
            onChange={(nextValue) =>
              onChange({ title: nextValue })
            }
          />

          <TextField
            label="事業所の名称"
            value={value.business_office_name}
            disabled={disabled}
            onChange={(nextValue) =>
              onChange({
                business_office_name: nextValue,
              })
            }
          />

          <TextField
            label="所長名"
            value={value.site_manager_name}
            disabled={disabled}
            onChange={(nextValue) =>
              onChange({
                site_manager_name: nextValue,
              })
            }
          />

          <TextField
            label="元請確認欄"
            value={
              value.prime_contractor_confirmation
            }
            disabled={disabled}
            onChange={(nextValue) =>
              onChange({
                prime_contractor_confirmation:
                  nextValue,
              })
            }
          />

          <TextField
            label="元請確認日"
            type="date"
            value={value.confirmation_date}
            disabled={disabled}
            onChange={(nextValue) =>
              onChange({
                confirmation_date: nextValue,
              })
            }
          />
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>一次会社</h2>

        <div style={gridStyle}>
          <TextField
            label="会社名"
            value={value.primary_company_name}
            disabled={disabled}
            onChange={(nextValue) =>
              onChange({
                primary_company_name: nextValue,
              })
            }
          />

          <TextField
            label="代表者名"
            value={
              value.primary_representative_name
            }
            disabled={disabled}
            onChange={(nextValue) =>
              onChange({
                primary_representative_name:
                  nextValue,
              })
            }
          />

          <BooleanSelect
            label="建退共加入の有無"
            value={
              value.primary_is_related_member
            }
            disabled={disabled}
            onChange={(nextValue) =>
              onChange({
                primary_is_related_member:
                  nextValue,
              })
            }
          />
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>二次会社</h2>

        <div style={gridStyle}>
          <TextField
            label="会社名"
            value={value.secondary_company_name}
            disabled={disabled}
            onChange={(nextValue) =>
              onChange({
                secondary_company_name:
                  nextValue,
              })
            }
          />

          <TextField
            label="代表者名"
            value={
              value.secondary_representative_name
            }
            disabled={disabled}
            onChange={(nextValue) =>
              onChange({
                secondary_representative_name:
                  nextValue,
              })
            }
          />

          <BooleanSelect
            label="建退共加入の有無"
            value={
              value.secondary_is_related_member
            }
            disabled={disabled}
            onChange={(nextValue) =>
              onChange({
                secondary_is_related_member:
                  nextValue,
              })
            }
          />
        </div>
      </section>
    </>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  type?: "text" | "date";
};

function TextField({
  label,
  value,
  disabled,
  onChange,
  type = "text",
}: TextFieldProps) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>

      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
        style={inputStyle}
      />
    </label>
  );
}

type BooleanSelectProps = {
  label: string;
  value: boolean | null;
  disabled: boolean;
  onChange: (value: boolean | null) => void;
};

function BooleanSelect({
  label,
  value,
  disabled,
  onChange,
}: BooleanSelectProps) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>

      <select
        value={
          value === null
            ? ""
            : value
              ? "true"
              : "false"
        }
        disabled={disabled}
        onChange={(event) => {
          const nextValue = event.target.value;

          onChange(
            nextValue === ""
              ? null
              : nextValue === "true"
          );
        }}
        style={inputStyle}
      >
        <option value="">未設定</option>
        <option value="true">有</option>
        <option value="false">無</option>
      </select>
    </label>
  );
}

const sectionStyle: CSSProperties = {
  padding: 20,
  marginBottom: 20,
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
};

const headingStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 16,
  fontSize: 20,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 16,
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: 6,
};

const labelStyle: CSSProperties = {
  fontWeight: 700,
};

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: 11,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  backgroundColor: "#fff",
  fontSize: 16,
};