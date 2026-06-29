import type { Employee, Vehicle } from "../types";

type Props = {
  isMobile: boolean;
  selectedDate: string | null;
  selectedShiftType: string | null;
  selectedEmployeeName: string | null;
  copiedEmployeeNames: string[];
  copiedVehicleNames: string[];
  employees: Employee[];
  vehicles: Vehicle[];
  getUnassignedEmployeesByDate: (
    workDate: string,
    shiftType: string | null
  ) => Employee[];
  isAssignedSameDateDifferentShift: (
    employeeName: string,
    workDate: string,
    currentShiftType: string | null
  ) => boolean;
  getAssignmentCount: (employeeName: string) => number;
  setSelectedDate: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedEmployeeName: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedSiteMemberId: React.Dispatch<React.SetStateAction<string | null>>;
  setDraggingEmployeeName: React.Dispatch<React.SetStateAction<string | null>>;
  setDraggingVehicleName: React.Dispatch<React.SetStateAction<string | null>>;
  setCopiedEmployeeNames: React.Dispatch<React.SetStateAction<string[]>>;
  setCopiedVehicleNames: React.Dispatch<React.SetStateAction<string[]>>;
};

export default function MemberPanel({
  isMobile,
  selectedDate,
  selectedShiftType,
  selectedEmployeeName,
  copiedEmployeeNames,
  copiedVehicleNames,
  employees,
  vehicles,
  getUnassignedEmployeesByDate,
  isAssignedSameDateDifferentShift,
  getAssignmentCount,
  setSelectedDate,
  setSelectedEmployeeName,
  setSelectedSiteMemberId,
  setDraggingEmployeeName,
  setDraggingVehicleName,
  setCopiedEmployeeNames,
  setCopiedVehicleNames,
}: Props) {
  if (isMobile) return null;

  const displayEmployees = selectedDate
    ? getUnassignedEmployeesByDate(selectedDate, selectedShiftType)
    : employees;

  const groupedEmployees = displayEmployees.reduce(
    (acc, employee) => {
      const company = employee.company_name || "未設定";

      if (!acc[company]) {
        acc[company] = [];
      }

      acc[company].push(employee);

      return acc;
    },
    {} as Record<string, Employee[]>
  );

  return (
    <div
      style={{
        position: "fixed",
        right: 4,
        top: 90,
        bottom: 10,
        width: 180,
        overflowY: "auto",
        border: "1px solid #ddd",
        borderRadius: 12,
        backgroundColor: "#fff",
        padding: 8,
        zIndex: 1000,
        boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 6 }}>
        {selectedDate ? "未配置メンバー" : "全メンバー"}
      </div>

      <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>
        {selectedDate
          ? `${selectedDate} / ${selectedShiftType === "night" ? "夜" : "昼"}`
          : "日付未選択"}
      </div>

      {copiedEmployeeNames.length > 0 && (
        <div
          style={{
            marginBottom: 10,
            padding: 8,
            borderRadius: 8,
            backgroundColor: "#dbeafe",
            color: "#1d4ed8",
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          選択中：{copiedEmployeeNames.length}名
          <div style={{ marginTop: 4 }}>{copiedEmployeeNames.join("、")}</div>

          <button
            type="button"
            onClick={() => setCopiedEmployeeNames([])}
            style={{
              marginLeft: 8,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            ×
          </button>
        </div>
      )}

      {copiedVehicleNames.length > 0 && (
        <div
          style={{
            marginBottom: 10,
            padding: 8,
            borderRadius: 8,
            backgroundColor: "#fef3c7",
            color: "#92400e",
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          車両選択中：{copiedVehicleNames.length}台
          <div style={{ marginTop: 4 }}>{copiedVehicleNames.join("、")}</div>

          <button
            type="button"
            onClick={() => setCopiedVehicleNames([])}
            style={{
              marginLeft: 8,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            ×
          </button>
        </div>
      )}

      {selectedDate && (
        <button
          type="button"
          onClick={() => {
            setSelectedDate(null);
            setSelectedEmployeeName(null);
          }}
          style={{
            marginBottom: 10,
            width: "100%",
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #ccc",
            backgroundColor: "#fff",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          全員表示
        </button>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {Object.entries(groupedEmployees).map(([company, members]) => (
          <div key={company}>
            <div
              style={{
                fontWeight: 800,
                backgroundColor: "#f3f4f6",
                padding: "6px 8px",
                borderRadius: 6,
                marginBottom: 6,
              }}
            >
              {company}
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              {members.map((employee) => {
                const isSameDateOtherShift =
                  selectedDate &&
                  isAssignedSameDateDifferentShift(
                    employee.name,
                    selectedDate,
                    selectedShiftType
                  );

                return (
                  <div
                    key={employee.name}
                    draggable={!isMobile}
                    onDragStart={() => setDraggingEmployeeName(employee.name)}
                    onDragEnd={() => setDraggingEmployeeName(null)}
                    onClick={() => {
                      setSelectedEmployeeName(employee.name);
                      setSelectedSiteMemberId(null);
                    }}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 999,
                      backgroundColor:
                        selectedEmployeeName === employee.name
                          ? "#dbeafe"
                          : isSameDateOtherShift
                          ? "#fee2e2"
                          : "#fff7ed",
                      border: isSameDateOtherShift
                        ? "2px solid #ef4444"
                        : "1px solid #fed7aa",
                      color: isSameDateOtherShift ? "#b91c1c" : "#111",
                      cursor: "grab",
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>{employee.name}</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#666",
                        }}
                      >
                        {getAssignmentCount(employee.name)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{ marginTop: 12 }}>
          <div
            style={{
              fontWeight: 800,
              backgroundColor: "#f3f4f6",
              padding: "6px 8px",
              borderRadius: 6,
              marginBottom: 6,
            }}
          >
            車両
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                draggable={!isMobile}
                onDragStart={() => setDraggingVehicleName(vehicle.vehicle_name)}
                onDragEnd={() => setDraggingVehicleName(null)}
                onClick={() => {
                  setSelectedEmployeeName(null);
                  setSelectedSiteMemberId(null);
                  setCopiedEmployeeNames([]);

                  setCopiedVehicleNames((prev) =>
                    prev.includes(vehicle.vehicle_name)
                      ? prev.filter((name) => name !== vehicle.vehicle_name)
                      : [...prev, vehicle.vehicle_name]
                  );
                }}
                style={{
                  padding: "8px 10px",
                  borderRadius: 999,
                  backgroundColor: copiedVehicleNames.includes(vehicle.vehicle_name)
                    ? "#fef3c7"
                    : "#e0f2fe",
                  border: copiedVehicleNames.includes(vehicle.vehicle_name)
                    ? "2px solid #f59e0b"
                    : "1px solid #bae6fd",
                  color: "#0369a1",
                  cursor: "grab",
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                🚚 {vehicle.vehicle_name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}