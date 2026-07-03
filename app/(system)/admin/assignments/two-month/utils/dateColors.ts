// app/(system)/admin/assignments/month/utils/dateColors.ts
import HolidayJp from "@holiday-jp/holiday_jp";

export function getDateAccentColors(date: string) {
  const value = new Date(`${date}T00:00:00`);
  const day = value.getDay();
  const isHoliday = HolidayJp.isHoliday(value);

  if (isHoliday) {
    return {
      headerBackground: "#fef2f2",
      headerColor: "#dc2626",
      cellBackground: "#fff5f5",
    };
  }

  if (day === 0) {
    return {
      headerBackground: "#fee2e2",
      headerColor: "#dc2626",
      cellBackground: "#fff7f7",
    };
  }

  if (day === 6) {
    return {
      headerBackground: "#dbeafe",
      headerColor: "#2563eb",
      cellBackground: "#f7fbff",
    };
  }

  return {
    headerBackground: "#f9fafb",
    headerColor: "#111827",
    cellBackground: "#fff",
  };
}