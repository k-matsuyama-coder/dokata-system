"use client";

import type React from "react";
import type { Employee, Vehicle } from "../types";

type Props = {
  show: boolean;
  selectedDate: string | null;
  selectedShiftType: string | null;
  employees: Employee[];
  vehicles: Vehicle[];
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
};

export default function MobileMemberModal({
  show,
  selectedDate,
  selectedShiftType,
  employees,
  vehicles,
  selectedEmployeeName,
  copiedVehicleNames,
  getUnassignedEmployeesByDate,
  setShowMemberModal,
  setSelectedEmployeeName,
  setSelectedSiteMemberId,
  setCopiedEmployeeNames,
  setCopiedVehicleNames,
  getAssignmentCount,
}: Props) {
  if (!show) return null;

  const displayEmployees = selectedDate
    ? getUnassignedEmployeesByDate(selectedDate, selectedShiftType)
    : employees;

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

          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          {displayEmployees.map((employee) => (
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
        selectedEmployeeName === employee.name ? "#dbeafe" : "#fff",
      textAlign: "left",
      fontWeight: 700,
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span>{employee.name}</span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: "#666",
          flexShrink: 0,
        }}
      >
        {getAssignmentCount(employee.name)}
      </span>
    </div>
  </button>
))}
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
                    border: copiedVehicleNames.includes(vehicle.vehicle_name)
                      ? "2px solid #f59e0b"
                      : "1px solid #ddd",
                    backgroundColor: copiedVehicleNames.includes(
                      vehicle.vehicle_name
                    )
                      ? "#fef3c7"
                      : "#fff",
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