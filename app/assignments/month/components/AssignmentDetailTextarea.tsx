"use client";

import type React from "react";
import type { DailyInfo } from "../types";

type Props = {
  isMobile: boolean;
  isOutOfPeriod: boolean;
  assignmentId: string;
  workDate: string;
  dailyInfo: DailyInfo | undefined;

  editingDetails: Record<string, string>;
  setEditingDetails: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;

  saveTimers: Record<string, ReturnType<typeof setTimeout>>;
  setSaveTimers: React.Dispatch<
    React.SetStateAction<Record<string, ReturnType<typeof setTimeout>>>
  >;

  updateDailyInfo: (
    assignmentId: string,
    workDate: string,
    field: "planned_count" | "detail" | "vehicle_names",
    value: string
  ) => void;
};

export default function AssignmentDetailTextarea({
  isMobile,
  isOutOfPeriod,
  assignmentId,
  workDate,
  dailyInfo,
  editingDetails,
  setEditingDetails,
  saveTimers,
  setSaveTimers,
  updateDailyInfo,
}: Props) {
  const key = `${assignmentId}_${workDate}`;

  return (
    <textarea
      value={editingDetails[key] ?? dailyInfo?.detail ?? ""}
      onChange={(e) => {
        const value = e.target.value;

        setEditingDetails((prev) => ({
          ...prev,
          [key]: value,
        }));

        if (saveTimers[key]) {
          clearTimeout(saveTimers[key]);
        }

        const timer = setTimeout(() => {
          updateDailyInfo(
            assignmentId,
            workDate,
            "detail",
            value
          );
        }, 500);

        setSaveTimers((prev) => ({
          ...prev,
          [key]: timer,
        }));
      }}
      disabled={isOutOfPeriod}
      placeholder="詳細"
      style={{
        width: "100%",
        padding: "4px 6px",
        border: "1px solid #e5e7eb",
        borderRadius: 6,
        fontSize: isMobile ? 10 : 11,
        backgroundColor: "#fff",
        boxSizing: "border-box",
      }}
    />
  );
}