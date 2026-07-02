// app/(system)/admin/assignments/month/components/AssignmentDayCell.tsx
"use client";

import type React from "react";
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

function movePlannedCountFocus(
  event: React.KeyboardEvent<HTMLInputElement>,
  direction: "left" | "right"
) {
  const currentInput = event.currentTarget;
  const row = currentInput.closest("tr");

  if (!row) return;

  const inputs = Array.from(
    row.querySelectorAll<HTMLInputElement>('input[data-planned-count="true"]')
  ).filter((input) => !input.disabled);

  const currentIndex = inputs.findIndex((input) => input === currentInput);

  if (currentIndex === -1) return;

  const nextIndex =
    direction === "left" ? currentIndex - 1 : currentIndex + 1;

  const nextInput = inputs[nextIndex];

  if (!nextInput) return;

  event.preventDefault();
  nextInput.focus();
  nextInput.select();
}

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
          color: isShort ? "#d11a2a" : isPerfect ? "#16a34a" : "#555",
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
  min={0}
  data-planned-count="true"
  value={dailyInfo?.planned_count ?? ""}
  onChange={(e) => {
    const rawValue = e.target.value;

    if (rawValue === "") {
      updateDailyInfo(assignmentId, workDate, "planned_count", "");
      return;
    }

    const nextValue = Math.max(0, Number(rawValue));
    updateDailyInfo(
      assignmentId,
      workDate,
      "planned_count",
      String(nextValue)
    );
  }}
  onFocus={(e) => e.currentTarget.select()}
  onKeyDown={(e) => {
    if (e.key === "ArrowLeft") {
      movePlannedCountFocus(e, "left");
      return;
    }

    if (e.key === "ArrowRight") {
      movePlannedCountFocus(e, "right");
    }
  }}
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