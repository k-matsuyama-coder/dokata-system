const japanDateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  
  // 日本時間の日付を「2026-10-01」の形式で返す
  export function getJapanDate(date: Date = new Date()): string {
    const parts = japanDateFormatter.formatToParts(date);
  
    const year = parts.find((part) => part.type === "year")!.value;
    const month = parts.find((part) => part.type === "month")!.value;
    const day = parts.find((part) => part.type === "day")!.value;
  
    return `${year}-${month}-${day}`;
  }
  
  // 日本時間の年月を「2026-10」の形式で返す
  export function getJapanMonth(date: Date = new Date()): string {
    return getJapanDate(date).slice(0, 7);
  }