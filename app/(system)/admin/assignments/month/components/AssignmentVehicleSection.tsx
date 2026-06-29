"use client";

import type { DailyInfo } from "../types";

type DraggingVehicleFrom = {
  assignmentId: string;
  workDate: string;
  vehicleName: string;
};

type Props = {
  isMobile: boolean;
  assignmentId: string;
  workDate: string;
  dailyInfo: DailyInfo | undefined;
  copiedVehicleNames: string[];
  setCopiedVehicleNames: React.Dispatch<React.SetStateAction<string[]>>;
  setDraggingVehicleFrom: React.Dispatch<
    React.SetStateAction<DraggingVehicleFrom | null>
  >;
  removeVehicleFromCell: (
    vehicleName: string,
    assignmentId: string,
    workDate: string
  ) => void;
};

export default function AssignmentVehicleSection({
  isMobile,
  assignmentId,
  workDate,
  dailyInfo,
  copiedVehicleNames,
  setCopiedVehicleNames,
  setDraggingVehicleFrom,
  removeVehicleFromCell,
}: Props) {
  return (
    <div
      style={{
        marginTop: 0,
        padding: 6,
        borderRadius: 8,
        backgroundColor: "#f9fafb",
        fontSize: isMobile ? 10 : 11,
      }}
    >
      <div style={{ fontWeight: 800, color: "#555", marginBottom: 4 }}>
        車両
      </div>

      {dailyInfo?.vehicle_names?.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {dailyInfo.vehicle_names.map((name) => (
            <div
              key={name}
              draggable={!isMobile}
              onDragStart={() =>
                setDraggingVehicleFrom({
                  assignmentId,
                  workDate,
                  vehicleName: name,
                })
              }
              onDragEnd={() => setDraggingVehicleFrom(null)}
              onClick={(e) => {
                e.stopPropagation();
                setCopiedVehicleNames((prev) =>
                  prev.includes(name)
                    ? prev.filter((v) => v !== name)
                    : [...prev, name]
                );
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                removeVehicleFromCell(name, assignmentId, workDate);
              }}
              style={{
                padding: "3px 7px",
                borderRadius: 999,
                backgroundColor: copiedVehicleNames.includes(name)
                  ? "#fef3c7"
                  : "#e0f2fe",
                border: copiedVehicleNames.includes(name)
                  ? "2px solid #f59e0b"
                  : "1px solid #bae6fd",
                color: "#0369a1",
                fontWeight: 800,
                cursor: "grab",
                width: "fit-content",
              }}
            >
              🚚 {name}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: "#999" }}>未配置</div>
      )}
    </div>
  );
}