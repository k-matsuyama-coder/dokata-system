import { useMemo } from "react";

import { th, cellTd } from "../styles";
import { toDateString } from "../utils";
import { getDateAccentColors } from "../utils/dateColors";

type Props = {
  month: string;
  viewMode: "month" | "week";
  weekStart: string;
  isMobile: boolean;
};

export function useMonthlyAssignmentCalendar({
  month,
  viewMode,
  weekStart,
  isMobile,
}: Props) {
  const days = useMemo(() => {
    if (viewMode === "week") {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return toDateString(d);
      });
    }

    const [year, monthNum] = month.split("-").map(Number);

    const firstDay = new Date(year, monthNum - 1, 1);
    const lastDay = new Date(year, monthNum, 0);

    const start = new Date(firstDay);
    start.setDate(start.getDate() - 7);

    const end = new Date(lastDay);
    end.setDate(end.getDate() + 7);

    const result: string[] = [];
    const current = new Date(start);

    while (current <= end) {
      result.push(toDateString(current));
      current.setDate(current.getDate() + 1);
    }

    return result;
  }, [month, viewMode, weekStart]);

  const todayString = new Date().toISOString().slice(0, 10);

  const getDateHeaderStyle = (date: string) => {
    const colors = getDateAccentColors(date);
    const isToday = date === todayString;

    return {
      ...th,
      boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
      backgroundColor: isToday ? "#fff3cd" : colors.headerBackground,
      color: colors.headerColor,
      fontWeight: 800,
    };
  };

  const getCellStyle = (
    date: string,
    plannedCount: number | null | undefined,
    memberCount: number,
    shiftType: string | null
  ) => {
    const colors = getDateAccentColors(date);
    const isToday = date === todayString;

    const isShort =
      plannedCount !== null &&
      plannedCount !== undefined &&
      plannedCount > 0 &&
      memberCount < plannedCount;

    const isPerfect =
      plannedCount !== null &&
      plannedCount !== undefined &&
      plannedCount > 0 &&
      memberCount === plannedCount;

    return {
      ...cellTd,
      minWidth:
        viewMode === "week"
          ? isMobile
            ? 160
            : 220
          : isMobile
            ? 120
            : 150,
      height: isMobile ? 120 : 140,
      padding: isMobile ? 4 : 6,
      backgroundColor:
  isShort
    ? "#fee2e2"
    : isPerfect
      ? "#e8f7e8"
      : shiftType === "night"
        ? "#c3d1e6"
        : isToday
          ? "#fffdf0"
          : colors.cellBackground,
    };
  };

  return {
    days,
    todayString,
    getDateHeaderStyle,
    getCellStyle,
  };
}