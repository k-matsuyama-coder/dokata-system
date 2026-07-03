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
  flushDetailSave?: (assignmentId: string, workDate: string) => void | Promise<void>;
  updateDailyInfo: (
    assignmentId: string,
    workDate: string,
    field: "planned_count" | "detail" | "vehicle_names",
    value: string
  ) => void;
};

function moveDetailFocus(
  event: React.KeyboardEvent<HTMLTextAreaElement>,
  direction: "left" | "right"
) {
  const currentTextarea = event.currentTarget;
  const row = currentTextarea.closest("tr");

  if (!row) return;

  const textareas = Array.from(
    row.querySelectorAll<HTMLTextAreaElement>('textarea[data-detail-input="true"]')
  ).filter((textarea) => !textarea.disabled);

  const currentIndex = textareas.findIndex(
    (textarea) => textarea === currentTextarea
  );

  if (currentIndex === -1) return;

  const nextIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
  const nextTextarea = textareas[nextIndex];

  if (!nextTextarea) return;

  event.preventDefault();
  nextTextarea.focus();
  nextTextarea.select?.();
}

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
  flushDetailSave,
  updateDailyInfo,
}: Props) {
  const key = `${assignmentId}_${workDate}`;

  return (
    <textarea
  data-detail-input="true"
  value={key in editingDetails ? editingDetails[key] : dailyInfo?.detail ?? ""}
  onClick={(e) => e.stopPropagation()}
  onMouseDown={(e) => e.stopPropagation()}
  onFocus={(e) => e.stopPropagation()}
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
      updateDailyInfo(assignmentId, workDate, "detail", value);
    }, 500);

    setSaveTimers((prev) => ({
      ...prev,
      [key]: timer,
    }));
  }}
  onBlur={() => {
    flushDetailSave?.(assignmentId, workDate);
  }}
  onKeyDown={(e) => {
    if (e.key === "ArrowLeft" && !e.shiftKey && !e.nativeEvent.isComposing) {
      const start = e.currentTarget.selectionStart ?? 0;
      const end = e.currentTarget.selectionEnd ?? 0;

      if (start === 0 && end === 0) {
        moveDetailFocus(e, "left");
      }
      return;
    }

    if (e.key === "ArrowRight" && !e.shiftKey && !e.nativeEvent.isComposing) {
      const valueLength = e.currentTarget.value.length;
      const start = e.currentTarget.selectionStart ?? 0;
      const end = e.currentTarget.selectionEnd ?? 0;

      if (start === valueLength && end === valueLength) {
        moveDetailFocus(e, "right");
      }
    }
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