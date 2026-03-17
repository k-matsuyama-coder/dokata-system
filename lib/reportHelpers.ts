export function formatReportValue(key: string, value: unknown) {
    if (value === null || value === undefined || value === "") {
      return "-";
    }
  
    if (key === "shift_type") {
      return value === "day" ? "昼" : value === "night" ? "夜" : String(value);
    }
  
    return String(value);
  }