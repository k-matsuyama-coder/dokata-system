export const toDateString = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
  };
  
  export const getWeekStart = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  };
  
  export const getDayType = (date: string) => {
    const day = new Date(date).getDay();
  
    if (day === 0) return "sunday";
    if (day === 6) return "saturday";
    return "weekday";
  };
  
  export const isOutOfAssignmentPeriod = (
    date: string,
    startDate: string | null,
    endDate: string | null
  ) => {
    return Boolean(
      (startDate && date < startDate) ||
        (endDate && date > endDate)
    );
  };