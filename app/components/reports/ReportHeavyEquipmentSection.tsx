import React, { useState } from "react";

type Employee = {
  name: string;
};

type Props = {
  sectionStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;

  showHeavyEquipment: boolean;
  setShowHeavyEquipment: (value: boolean) => void;

  heavyEquipment: string;
  setHeavyEquipment: (value: string) => void;

  operatorName: string;
  setOperatorName: (value: string) => void;

  employees: Employee[];
};

export default function ReportHeavyEquipmentSection({
  sectionStyle,
  inputStyle,
  showHeavyEquipment,
  setShowHeavyEquipment,
  heavyEquipment,
  setHeavyEquipment,
  operatorName,
  setOperatorName,
  employees,
}: Props) {
  const [showCandidates, setShowCandidates] = useState(false);
  return (
    <div style={sectionStyle}>
      <div
        onClick={() => setShowHeavyEquipment(!showHeavyEquipment)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          padding: "12px",
          border: "1px solid #ddd",
          borderRadius: 8,
          backgroundColor: "#fafafa",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              display: "inline-block",
              transition: "transform 0.25s ease",
              transform: showHeavyEquipment ? "rotate(90deg)" : "rotate(0deg)",
              fontSize: 14,
            }}
          >
            ▶
          </span>
          <p style={{ margin: 0, fontWeight: "bold" }}>重機・OP</p>
        </div>
      </div>

      <div
        style={{
          display: showHeavyEquipment ? "block" : "none",
          marginTop: 12,
        }}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <p>重機</p>
            <select
              value={heavyEquipment}
              onChange={(e) => setHeavyEquipment(e.target.value)}
              style={inputStyle}
            >
              <option value="">選択してください</option>
              <option value="ブル">ブル</option>
              <option value="グレーダー">グレーダー</option>
              <option value="AF">AF</option>
            </select>
          </div>

          <div>
            <p>OP</p>
            <input
              value={operatorName}
              onChange={(e) => {
                setOperatorName(e.target.value);
                setShowCandidates(true);
              }}
              onFocus={() => setShowCandidates(true)}
              placeholder="OP名を入力"
              style={inputStyle}
            />

{showCandidates && operatorName && (
              <div
                style={{
                  border: "1px solid #ccc",
                  borderRadius: 8,
                  padding: 8,
                  marginTop: 8,
                  backgroundColor: "#fff",
                }}
              >
                {employees
                  .filter((employee) => employee.name.includes(operatorName))
                  .slice(0, 5)
                  .map((employee) => (
                    <button
  type="button"
  key={employee.name}
  onClick={() => {
    setOperatorName(employee.name);
    setShowCandidates(false);
  }}
  style={{
    display: "block",
    width: "100%",
    minHeight: 44,
    padding: 8,
    border: "none",
    background: "#fff",
    color: "inherit",
    font: "inherit",
    textAlign: "left",
    cursor: "pointer",
  }}
>
  {employee.name}
</button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}