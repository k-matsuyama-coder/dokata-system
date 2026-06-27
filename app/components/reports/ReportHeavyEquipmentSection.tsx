import React from "react";

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
          maxHeight: showHeavyEquipment ? "300px" : "0",
          opacity: showHeavyEquipment ? 1 : 0,
          overflow: "hidden",
          transition:
            "max-height 0.35s ease, opacity 0.25s ease, margin-top 0.25s ease",
          marginTop: showHeavyEquipment ? 12 : 0,
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
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder="OP名を入力"
              style={inputStyle}
            />

            {operatorName && (
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
                    <div
                      key={employee.name}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setOperatorName(employee.name);
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        setOperatorName(employee.name);
                      }}
                      style={{ padding: 8, cursor: "pointer" }}
                    >
                      {employee.name}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}