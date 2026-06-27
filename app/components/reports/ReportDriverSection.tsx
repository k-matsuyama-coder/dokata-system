import React from "react";

type Employee = {
  name: string;
};

type Props = {
  sectionStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;

  selectedDrivers: string[];
  setSelectedDrivers: (value: string[]) => void;

  driverInput: string;
  setDriverInput: (value: string) => void;

  filteredDrivers: Employee[];
};

export default function ReportDriverSection({
  sectionStyle,
  inputStyle,
  selectedDrivers,
  setSelectedDrivers,
  driverInput,
  setDriverInput,
  filteredDrivers,
}: Props) {
  return (
    <>
      <div style={sectionStyle}>
        <p>車両台数</p>
        <input
          type="number"
          value={selectedDrivers.length}
          readOnly
          style={inputStyle}
        />
      </div>

      <div style={sectionStyle}>
        <p>車両運転手</p>
        <input
          type="text"
          placeholder="運転手名を入力"
          value={driverInput}
          onChange={(e) => setDriverInput(e.target.value)}
          style={inputStyle}
        />

        {driverInput && (
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 8,
              marginTop: 8,
              backgroundColor: "#fff",
            }}
          >
            {filteredDrivers.slice(0, 5).map((employee) => (
              <div
                key={employee.name}
                onMouseDown={(e) => {
                  e.preventDefault();

                  if (!selectedDrivers.includes(employee.name)) {
                    setSelectedDrivers([...selectedDrivers, employee.name]);
                  }

                  setDriverInput("");
                }}
                style={{ padding: 8, cursor: "pointer" }}
              >
                {employee.name}
              </div>
            ))}
          </div>
        )}

        {selectedDrivers.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {selectedDrivers.map((driver) => (
              <span
                key={driver}
                style={{
                  display: "inline-block",
                  border: "1px solid #999",
                  borderRadius: 12,
                  padding: "6px 10px",
                  marginRight: 8,
                  marginBottom: 8,
                  backgroundColor: "#fff",
                }}
              >
                {driver}
                <button
                  type="button"
                  onClick={() =>
                    setSelectedDrivers(
                      selectedDrivers.filter((d) => d !== driver)
                    )
                  }
                  style={{ marginLeft: 8, cursor: "pointer" }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}