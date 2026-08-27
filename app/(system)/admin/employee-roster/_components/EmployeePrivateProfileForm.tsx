"use client";

import {
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { saveEmployeePrivateProfile } from "../employee-roster-detail-api";
import type {
  EmployeePrivateProfile,
  EmployeePrivateProfileInput,
  EmployeeSummary,
} from "../employee-roster-types";

type Props = {
  employee: EmployeeSummary;
  initialProfile: EmployeePrivateProfile | null;
};

export default function EmployeePrivateProfileForm({
  employee,
  initialProfile,
}: Props) {
  const [form, setForm] =
    useState<EmployeePrivateProfileInput>({
      legal_name: initialProfile?.legal_name ?? employee.name,
      legal_name_kana:
        initialProfile?.legal_name_kana ?? "",
      birth_date: initialProfile?.birth_date ?? "",

      job_type: initialProfile?.job_type ?? "",
      hired_on: initialProfile?.hired_on ?? "",
      experience_years:
        initialProfile?.experience_years?.toString() ?? "",

      postal_code: initialProfile?.postal_code ?? "",
      address_line1: initialProfile?.address_line1 ?? "",
      address_line2: initialProfile?.address_line2 ?? "",
      phone_number: initialProfile?.phone_number ?? "",

      emergency_contact_name:
        initialProfile?.emergency_contact_name ?? "",
      emergency_contact_relationship:
        initialProfile?.emergency_contact_relationship ?? "",
      emergency_contact_phone:
        initialProfile?.emergency_contact_phone ?? "",

      health_insurance_name:
        initialProfile?.health_insurance_name ?? "",
      health_insurance_number:
        initialProfile?.health_insurance_number ?? "",

      pension_insurance_name:
        initialProfile?.pension_insurance_name ?? "",
      pension_insurance_number:
        initialProfile?.pension_insurance_number ?? "",

      employment_insurance_name:
        initialProfile?.employment_insurance_name ?? "",
      employment_insurance_number:
        initialProfile?.employment_insurance_number ?? "",

      construction_retirement_book_owned:
        initialProfile?.construction_retirement_book_owned ??
        null,
    });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const updateTextField = (
    field: keyof EmployeePrivateProfileInput,
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
      await saveEmployeePrivateProfile(employee.id, form);
      setMessage("作業員情報を保存しました");
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "作業員情報を保存できませんでした"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <section style={sectionStyle}>
        <h2 style={headingStyle}>基本情報</h2>

        <div style={gridStyle}>
          <FormField
            label="氏名"
            value={form.legal_name}
            onChange={(value) =>
              updateTextField("legal_name", value)
            }
          />

          <FormField
            label="ふりがな"
            value={form.legal_name_kana}
            onChange={(value) =>
              updateTextField("legal_name_kana", value)
            }
          />

          <FormField
            label="職種"
            value={form.job_type ?? ""}
            onChange={(value) =>
              updateTextField("job_type", value)
            }
            placeholder="例：土工、重機オペレーター"
          />

          <FormField
            label="雇入年月日"
            type="date"
            value={form.hired_on}
            onChange={(value) =>
              updateTextField("hired_on", value)
            }
          />

          <FormField
            label="経験年数"
            type="number"
            value={form.experience_years ?? ""}
            onChange={(value) =>
              updateTextField("experience_years", value)
            }
            placeholder="例：10"
            min="0"
            step="0.1"
          />

          <FormField
            label="生年月日"
            type="date"
            value={form.birth_date}
            onChange={(value) =>
              updateTextField("birth_date", value)
            }
          />
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>現住所・電話番号</h2>

        <div style={gridStyle}>
          <FormField
            label="郵便番号"
            value={form.postal_code}
            onChange={(value) =>
              updateTextField("postal_code", value)
            }
            placeholder="123-4567"
          />

          <FormField
            label="電話番号"
            type="tel"
            value={form.phone_number}
            onChange={(value) =>
              updateTextField("phone_number", value)
            }
            placeholder="090-1234-5678"
          />

          <FormField
            label="現住所"
            value={form.address_line1}
            onChange={(value) =>
              updateTextField("address_line1", value)
            }
          />

          <FormField
            label="建物名・部屋番号"
            value={form.address_line2}
            onChange={(value) =>
              updateTextField("address_line2", value)
            }
          />
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>家族・緊急連絡先</h2>

        <div style={gridStyle}>
          <FormField
            label="氏名"
            value={form.emergency_contact_name}
            onChange={(value) =>
              updateTextField(
                "emergency_contact_name",
                value
              )
            }
          />

          <FormField
            label="関係"
            value={form.emergency_contact_relationship}
            onChange={(value) =>
              updateTextField(
                "emergency_contact_relationship",
                value
              )
            }
            placeholder="例：妻、父、母"
          />

          <FormField
            label="電話番号"
            type="tel"
            value={form.emergency_contact_phone}
            onChange={(value) =>
              updateTextField(
                "emergency_contact_phone",
                value
              )
            }
            placeholder="090-1234-5678"
          />
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>社会保険</h2>

        <div style={gridStyle}>
          <FormField
            label="健康保険・種類"
            value={form.health_insurance_name ?? ""}
            onChange={(value) =>
              updateTextField(
                "health_insurance_name",
                value
              )
            }
            placeholder="例：協会けんぽ"
          />

          <FormField
            label="健康保険番号"
            value={form.health_insurance_number ?? ""}
            onChange={(value) =>
              updateTextField(
                "health_insurance_number",
                value
              )
            }
          />

          <FormField
            label="年金保険・種類"
            value={form.pension_insurance_name ?? ""}
            onChange={(value) =>
              updateTextField(
                "pension_insurance_name",
                value
              )
            }
            placeholder="例：厚生年金"
          />

          <FormField
            label="年金保険番号"
            value={form.pension_insurance_number ?? ""}
            onChange={(value) =>
              updateTextField(
                "pension_insurance_number",
                value
              )
            }
          />

          <FormField
            label="雇用保険・種類"
            value={form.employment_insurance_name ?? ""}
            onChange={(value) =>
              updateTextField(
                "employment_insurance_name",
                value
              )
            }
            placeholder="例：雇用保険"
          />

          <FormField
            label="雇用保険番号"
            value={form.employment_insurance_number ?? ""}
            onChange={(value) =>
              updateTextField(
                "employment_insurance_number",
                value
              )
            }
          />
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>建退共手帳</h2>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>
            建退共手帳所有の有無
          </span>

          <select
            value={
              form.construction_retirement_book_owned === null
                ? ""
                : form.construction_retirement_book_owned
                  ? "true"
                  : "false"
            }
            onChange={(event) => {
              const value = event.target.value;

              setForm((previous) => ({
                ...previous,
                construction_retirement_book_owned:
                  value === ""
                    ? null
                    : value === "true",
              }));
            }}
            style={inputStyle}
          >
            <option value="">未設定</option>
            <option value="true">有</option>
            <option value="false">無</option>
          </select>
        </label>
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
            ? "#6b7280"
            : "#111827",
          fontSize: 16,
          fontWeight: 700,
          cursor: saving
            ? "not-allowed"
            : "pointer",
        }}
      >
        {saving
          ? "保存中..."
          : "基本情報・保険情報を保存"}
      </button>
    </form>
  );
}

type FormFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "date" | "tel" | "number";
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

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: 11,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  backgroundColor: "#fff",
  fontSize: 16,
};