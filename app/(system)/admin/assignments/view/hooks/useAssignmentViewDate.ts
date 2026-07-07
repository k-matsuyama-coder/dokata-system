"use client";

import { useMemo, useState } from "react";

export type AssignmentViewMode = "day" | "3days" | "week";

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getWeekStartDate(baseDate: Date) {
  const next = new Date(baseDate);
  const day = next.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diffToMonday);
  return next;
}

export function useAssignmentViewDate() {
  const [date, setDate] = useState(() => formatLocalDate(new Date()));
  const [viewMode, setViewMode] = useState<AssignmentViewMode>("day");

  const displayDates = useMemo(() => {
    if (viewMode === "3days") {
      return Array.from({ length: 3 }, (_, index) => {
        const nextDate = parseLocalDate(date);
        nextDate.setDate(nextDate.getDate() + index);
        return formatLocalDate(nextDate);
      });
    }

    if (viewMode === "week") {
      const start = getWeekStartDate(parseLocalDate(date));

      return Array.from({ length: 7 }, (_, index) => {
        const nextDate = new Date(start);
        nextDate.setDate(start.getDate() + index);
        return formatLocalDate(nextDate);
      });
    }

    return [date];
  }, [date, viewMode]);

  const moveDate = (amount: number) => {
    const nextDate = parseLocalDate(date);
    nextDate.setDate(nextDate.getDate() + amount);
    setDate(formatLocalDate(nextDate));
  };

  const movePrev = () => {
    moveDate(viewMode === "week" ? -7 : -1);
  };

  const moveNext = () => {
    moveDate(viewMode === "week" ? 7 : 1);
  };

  const moveToday = () => {
    const today = new Date();

    if (viewMode === "week") {
      setDate(formatLocalDate(getWeekStartDate(today)));
      return;
    }

    setDate(formatLocalDate(today));
  };

  const changeViewMode = (nextMode: AssignmentViewMode) => {
    if (nextMode === "3days") {
      setDate(formatLocalDate(new Date()));
    }

    if (nextMode === "week") {
      setDate(formatLocalDate(getWeekStartDate(new Date())));
    }

    setViewMode(nextMode);
  };

  return {
    date,
    setDate,
    viewMode,
    setViewMode,
    displayDates,
    movePrev,
    moveNext,
    moveToday,
    changeViewMode,
  };
}