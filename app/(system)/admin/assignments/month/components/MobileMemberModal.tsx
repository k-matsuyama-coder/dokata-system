"use client";

import type React from "react";
import type { Employee, Vehicle } from "../types";

type Props = {
  show: boolean;
  selectedDate: string | null;
  selectedShiftType: string | null;
  employees: Employee[];
  vehicles: Vehicle[];
  isVehicleAssignedDifferentShift: (
    vehicleName: string,
    workDate: string,
    shiftType: string | null
  ) => boolean;
  selectedEmployeeName: string | null;
  copiedVehicleNames: string[];
  getUnassignedEmployeesByDate: (
    workDate: string,
    shiftType: string | null
  ) => Employee[];
  setShowMemberModal: (value: boolean) => void;
  setSelectedEmployeeName: (value: string | null) => void;
  setSelectedSiteMemberId: (value: string | null) => void;
  setCopiedEmployeeNames: React.Dispatch<React.SetStateAction<string[]>>;
  setCopiedVehicleNames: React.Dispatch<React.SetStateAction<string[]>>;
  getAssignmentCount: (employeeName: string) => number;
  getConsecutiveCount: (employeeName: string) => number;
};

export default function MobileMemberModal({
  show,
  selectedDate,
  selectedShiftType,
  employees,
  vehicles,
  isVehicleAssignedDifferentShift,
  selectedEmployeeName,
  copiedVehicleNames,
  getUnassignedEmployeesByDate,
  setShowMemberModal,
  setSelectedEmployeeName,
  setSelectedSiteMemberId,
  setCopiedEmployeeNames,
  setCopiedVehicleNames,
  getAssignmentCount,
  getConsecutiveCount,
}: Props) {
  if (!show) return null;

  const displayEmployees = selectedDate
    ? getUnassignedEmployeesByDate(selectedDate, selectedShiftType)
    : employees;

    const isVehicleOnOtherShift = (vehicleName: string) =>
    selectedDate !== null &&
    isVehicleAssignedDifferentShift(
      vehicleName,
      selectedDate,
      selectedShiftType
    );

    const groupedEmployees = displayEmployees.reduce(
      (groups, employee) => {
        const companyName = employee.company_name || "未設定";
    
        if (!groups[companyName]) {
          groups[companyName] = [];
        }
    
        groups[companyName].push(employee);
    
        return groups;
      },
      {} as Record<string, Employee[]>
    );

  return (
    <div
      onClick={() => setShowMemberModal(false)}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        zIndex: 3000,
        padding: 12,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
          backgroundColor: "#fff",
          borderRadius: "16px 16px 0 0",
          padding: 14,
        }}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <strong>{selectedDate ? "未配置メンバー" : "全メンバー"}</strong>

            <button type="button" onClick={() => setShowMemberModal(false)}>
              閉じる
            </button>
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
  {Object.entries(groupedEmployees).map(
    ([companyName, companyEmployees]) => (
      <div key={companyName}>
        <div
          style={{
            marginBottom: 6,
            padding: "6px 8px",
            borderRadius: 6,
            backgroundColor: "#f3f4f6",
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          {companyName}
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {companyEmployees.map((employee) => (
            <button
              key={employee.name}
              type="button"
              onClick={() => {
                setSelectedEmployeeName(employee.name);
                setShowMemberModal(false);
              }}
              style={{
                padding: 12,
                borderRadius: 10,
                border:
                  selectedEmployeeName === employee.name
                    ? "2px solid #2563eb"
                    : "1px solid #ddd",
                backgroundColor:
                  selectedEmployeeName === employee.name
                    ? "#dbeafe"
                    : "#fff",
                textAlign: "left",
                fontWeight: 700,
              }}
            >
              <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
  }}
>
  <span
    title={employee.name}
    style={{
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    }}
  >
    {employee.name}
  </span>

  <span
    title="当月の稼働数 / 通し数"
    aria-label={`稼働 ${getAssignmentCount(employee.name)}、通し ${getConsecutiveCount(employee.name)}`}
    style={{
      display: "grid",
      gridTemplateColumns: "3ch 1ch 2ch",
      alignItems: "center",
      columnGap: 2,
      flexShrink: 0,
      fontSize: 11,
      fontWeight: 700,
      fontVariantNumeric: "tabular-nums",
      textAlign: "right",
      whiteSpace: "nowrap",
      color: "#64748b",
    }}
  >
    <span>{getAssignmentCount(employee.name)}</span>
    <span style={{ color: "#cbd5e1", textAlign: "center" }}>/</span>
    <span>{getConsecutiveCount(employee.name)}</span>
  </span>
</div>
            </button>
          ))}
        </div>
      </div>
    )
  )}
</div>

          <div style={{ marginTop: 18 }}>
            <div
              style={{
                fontWeight: 800,
                marginBottom: 8,
                paddingTop: 12,
                borderTop: "1px solid #ddd",
              }}
            >
              車両
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {vehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => {
                    setSelectedEmployeeName(null);
                    setSelectedSiteMemberId(null);
                    setCopiedEmployeeNames([]);

                    setCopiedVehicleNames((prev) =>
                      prev.includes(vehicle.vehicle_name)
                        ? prev.filter((name) => name !== vehicle.vehicle_name)
                        : [...prev, vehicle.vehicle_name]
                    );

                    setShowMemberModal(false);
                  }}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    border: isVehicleOnOtherShift(vehicle.vehicle_name)
                    ? "2px solid #ef4444"
                    : copiedVehicleNames.includes(vehicle.vehicle_name)
                      ? "2px solid #f59e0b"
                      : "1px solid #ddd",
                  backgroundColor: isVehicleOnOtherShift(vehicle.vehicle_name)
                    ? "#fee2e2"
                    : copiedVehicleNames.includes(vehicle.vehicle_name)
                      ? "#fef3c7"
                      : "#fff",
                  color: isVehicleOnOtherShift(vehicle.vehicle_name)
                    ? "#b91c1c"
                    : "#111",
                    textAlign: "left",
                    fontWeight: 800,
                  }}
                >
                  🚚 {vehicle.vehicle_name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}