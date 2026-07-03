import HolidayJp from "@holiday-jp/holiday_jp";

export function isHoliday(date: string) {
  return HolidayJp.isHoliday(new Date(`${date}T00:00:00`));
}

export function getDayType(date: string) {
  const day = new Date(`${date}T00:00:00`).getDay();

  if (isHoliday(date)) {
    return "holiday";
  }

  if (day === 0) {
    return "sunday";
  }

  if (day === 6) {
    return "saturday";
  }

  return "weekday";
}

export function getDateAccentColors(date: string) {
  const dayType = getDayType(date);

  if (dayType === "holiday") {
    return {
      headerBackground: "#fef2f2",
      headerColor: "#dc2626",
      cellBackground: "#fff5f5",
    };
  }

  if (dayType === "sunday") {
    return {
      headerBackground: "#fee2e2",
      headerColor: "#dc2626",
      cellBackground: "#fff7f7",
    };
  }

  if (dayType === "saturday") {
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