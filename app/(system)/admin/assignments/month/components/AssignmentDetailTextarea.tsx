"use client";

import React, { useEffect, useRef, useState } from "react";
import type { DailyInfo } from "../types";

type Props = {
  isMobile: boolean;
  isOutOfPeriod: boolean;
  assignmentId: string;
  workDate: string;
  dailyInfo: DailyInfo | undefined;
  flushDetailSave?: (assignmentId: string, workDate: string) => void | Promise<void>;
  updateDailyInfo: (
    assignmentId: string,
    workDate: string,
    field: "planned_count" | "detail" | "vehicle_names",
    value: string
  ) => void | Promise<void>;
};

const LOCAL_SAVE_DELAY_MS = 350;

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

function AssignmentDetailTextarea({
  isMobile,
  isOutOfPeriod,
  assignmentId,
  workDate,
  dailyInfo,
  flushDetailSave,
  updateDailyInfo,
}: Props) {
  const externalValue = dailyInfo?.detail ?? "";
  const [draft, setDraft] = useState(externalValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestExternalValueRef = useRef(externalValue);

  useEffect(() => {
    if (latestExternalValueRef.current !== externalValue) {
      latestExternalValueRef.current = externalValue;
      setDraft(externalValue);
    }
  }, [externalValue]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const scheduleSave = (value: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      void updateDailyInfo(assignmentId, workDate, "detail", value);
    }, LOCAL_SAVE_DELAY_MS);
  };

  const flushSave = async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    await updateDailyInfo(assignmentId, workDate, "detail", draft);
    await flushDetailSave?.(assignmentId, workDate);
  };

  return (
    <textarea
      data-detail-input="true"
      value={draft}
      onClick={(e) => e.stopPropagation()}
onMouseDown={(e) => e.stopPropagation()}
onTouchStart={(e) => e.stopPropagation()}
onTouchEnd={(e) => e.stopPropagation()}
onFocus={(e) => e.stopPropagation()}
      onChange={(e) => {
        const value = e.target.value;
        setDraft(value);
        scheduleSave(value);
      }}
      onBlur={() => {
        void flushSave();
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
        WebkitUserSelect: "text",
userSelect: "text",
touchAction: "manipulation",
      }}
    />
  );
}

export default React.memo(AssignmentDetailTextarea);