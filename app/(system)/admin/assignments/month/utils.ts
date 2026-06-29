import type { ShiftType } from "./types";

export function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function getDayType(
  date: string
): "weekday" | "saturday" | "sunday" {
  switch (new Date(date).getDay()) {
    case 0:
      return "sunday";
    case 6:
      return "saturday";
    default:
      return "weekday";
  }
}

export function isOutOfAssignmentPeriod(
  date: string,
  startDate: string | null,
  endDate: string | null
): boolean {
  return (
    (startDate !== null && date < startDate) ||
    (endDate !== null && date > endDate)
  );
}