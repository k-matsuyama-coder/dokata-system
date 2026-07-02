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
  flushDetailSave: (assignmentId: string, workDate: string) => Promise<void>;

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
  flushDetailSave,
  updateDailyInfo,
}: Props) {
  const key = `${assignmentId}_${workDate}`;

  return (
    <textarea
      value={key in editingDetails ? editingDetails[key] : dailyInfo?.detail ?? ""}
      onChange={(e) => {
        updateDailyInfo(assignmentId, workDate, "detail", e.target.value);
      }}
      onBlur={() => {
        void flushDetailSave(assignmentId, workDate);
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