"use client";

import {
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { saveEmployeeHealthProfile } from "../employee-roster-detail-api";
import type {
  EmployeeHealthProfile,
  EmployeeHealthProfileInput,
  EmployeeSummary,
} from "../employee-roster-types";

type Props = {
  employee: EmployeeSummary;
  initialHealthProfile: EmployeeHealthProfile | null;
};

export default function EmployeeHealthProfileForm({
  employee,
  initialHealthProfile,
}: Props) {
  const [form, setForm] =
    useState<EmployeeHealthProfileInput>({
      recent_health_check_date:
        initialHealthProfile?.recent_health_check_date ?? "",

      health_check_medical_institution:
        initialHealthProfile
          ?.health_check_medical_institution ?? "",

      blood_pressure_high:
        initialHealthProfile?.blood_pressure_high?.toString() ??
        "",

      blood_pressure_low:
        initialHealthProfile?.blood_pressure_low?.toString() ??
        "",

      blood_type:
        initialHealthProfile?.blood_type ?? "",

      special_health_check_date:
        initialHealthProfile?.special_health_check_date ?? "",

      special_health_check_type:
        initialHealthProfile?.special_health_check_type ?? "",
    });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const updateField = (
    field: keyof EmployeeHealthProfileInput,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setIsError(false);

    try {
      await saveEmployeeHealthProfile(employee.id, form);
      setMessage("健康情報を保存しました");
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "健康情報を保存できませんでした"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <section style={sectionStyle}>
        <div style={headingRowStyle}>
          <h2 style={headingStyle}>健康情報</h2>

          <span style={sensitiveLabelStyle}>
            機微情報・管理者限定
          </span>
        </div>

        <p style={noticeStyle}>
          健康診断や血圧などの情報は、通常の作業員情報とは
          分けて保存されます。
        </p>

        <div style={gridStyle}>
          <FormField
            label="最近の健康診断日"
            type="date"
            value={form.recent_health_check_date}
            onChange={(value) =>
              updateField(
                "recent_health_check_date",
                value
              )
            }
          />

          <FormField
            label="健康診断の医療機関名"
            value={
              form.health_check_medical_institution
            }
            onChange={(value) =>
              updateField(
                "health_check_medical_institution",
                value
              )
            }
          />

          <FormField
            label="最高血圧"
            type="number"
            value={form.blood_pressure_high}
            onChange={(value) =>
              updateField("blood_pressure_high", value)
            }
            min="1"
            step="1"
          />

          <FormField
            label="最低血圧"
            type="number"
            value={form.blood_pressure_low}
            onChange={(value) =>
              updateField("blood_pressure_low", value)
            }
            min="1"
            step="1"
          />

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700 }}>血液型</span>

            <select
              value={form.blood_type}
              onChange={(event) =>
                updateField(
                  "blood_type",
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="">未設定</option>
              <option value="A">A型</option>
              <option value="B">B型</option>
              <option value="O">O型</option>
              <option value="AB">AB型</option>
              <option value="不明">不明</option>
            </select>
          </label>

          <FormField
            label="特殊健康診断日"
            type="date"
            value={form.special_health_check_date}
            onChange={(value) =>
              updateField(
                "special_health_check_date",
                value
              )
            }
          />

          <FormField
            label="特殊健康診断の種類"
            value={form.special_health_check_type}
            onChange={(value) =>
              updateField(
                "special_health_check_type",
                value
              )
            }
            placeholder="例：有機溶剤、石綿"
          />
        </div>
      </section>

      {message && (
        <div
          role={isError ? "alert" : "status"}
          style={{
            padding: 12,
            marginBottom: 16,
            borderRadius: 8,
            color: isError ? "#991b1b" : "#166534",
            backgroundColor: isError
              ? "#fee2e2"
              : "#dcfce7",
          }}
        >
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        style={{
          width: "100%",
          padding: 14,
          border: "none",
          borderRadius: 10,
          color: "#fff",
          backgroundColor: saving
            ? "#9ca3af"
            : "#7f1d1d",
          fontSize: 16,
          fontWeight: 700,
          cursor: saving
            ? "not-allowed"
            : "pointer",
        }}
      >
        {saving ? "保存中..." : "健康情報を保存"}
      </button>
    </form>
  );
}

type FormFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "date" | "number";
  placeholder?: string;
  min?: string;
  step?: string;
};

function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  min,
  step,
}: FormFieldProps) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontWeight: 700 }}>{label}</span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        min={min}
        step={step}
        autoComplete="off"
        style={inputStyle}
      />
    </label>
  );
}

const sectionStyle: CSSProperties = {
  padding: 20,
  marginBottom: 20,
  backgroundColor: "#fff7ed",
  border: "1px solid #fdba74",
  borderRadius: 12,
};

const headingRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 12,
  marginBottom: 8,
};

const headingStyle: CSSProperties = {
  margin: 0,
  fontSize: 20,
};

const sensitiveLabelStyle: CSSProperties = {
  padding: "4px 9px",
  borderRadius: 999,
  color: "#991b1b",
  backgroundColor: "#fee2e2",
  fontSize: 12,
  fontWeight: 700,
};

const noticeStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 18,
  color: "#9a3412",
  fontSize: 13,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 16,
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