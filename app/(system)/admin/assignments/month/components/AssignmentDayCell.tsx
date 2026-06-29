"use client";

import type { DailyInfo } from "../types";

type Props = {
  isMobile: boolean;
  isOutOfPeriod: boolean;
  plannedCount: number | null;
  memberCount: number;

  assignmentId: string;
  workDate: string;
  dailyInfo: DailyInfo | undefined;

  updateDailyInfo: (
    assignmentId: string,
    workDate: string,
    field: "planned_count" | "detail" | "vehicle_names",
    value: string
  ) => void;
};

export default function AssignmentDayCell({
  isMobile,
  isOutOfPeriod,
  plannedCount,
  memberCount,
  assignmentId,
  workDate,
  dailyInfo,
  updateDailyInfo,
}: Props) {
  const isShort =
    plannedCount !== null &&
    plannedCount > 0 &&
    memberCount < plannedCount;

  const isPerfect =
    plannedCount !== null &&
    plannedCount > 0 &&
    memberCount === plannedCount;

  return (
    <>
      {isOutOfPeriod && (
        <div
          style={{
            padding: "4px 6px",
            borderRadius: 6,
            backgroundColor: "#d1d5db",
            color: "#374151",
            textAlign: "center",
            fontWeight: 800,
            fontSize: 11,
            marginBottom: 4,
          }}
        >
          工期外
        </div>
      )}

      <div
        style={{
          fontSize: isMobile ? 10 : 11,
          fontWeight: 800,
          color: isShort
            ? "#d11a2a"
            : isPerfect
            ? "#16a34a"
            : "#555",
          display: "grid",
          gap: 2,
          lineHeight: 1.4,
        }}
      >
        <div>予定人数：{plannedCount ?? "-"}</div>
        <div>
          人数：{plannedCount ? `${memberCount}/${plannedCount}` : memberCount}
        </div>
      </div>

      <input
  type="number"
  value={dailyInfo?.planned_count ?? ""}
  onChange={(e) =>
    updateDailyInfo(
      assignmentId,
      workDate,
      "planned_count",
      e.target.value
    )
  }
  placeholder="人"
  disabled={isOutOfPeriod}
  style={{
    width: "100%",
    padding: "4px 6px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: isMobile ? 10 : 11,
    fontWeight: 700,
    backgroundColor: "#fff",
    boxSizing: "border-box",
  }}
/>
    </>
  );
}