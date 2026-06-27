import type { Assignment, DailyInfo } from "../types";

export const getBandColor = (assignment: Assignment) => {
  return assignment.construction_type === "第二工事"
    ? "#dbeafe"
    : "#dcfce7";
};

export const getMonthlyTotal = (
  dailyInfos: DailyInfo[],
  baseMonth: string,
  assignmentId: string,
  targetMonthIndex: 0 | 1
) => {
  const [baseYear, baseMonthNum] = baseMonth.split("-").map(Number);

  const targetDate = new Date(
    baseYear,
    baseMonthNum - 1 + targetMonthIndex,
    1
  );

  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth() + 1;

  return dailyInfos
    .filter((d) => {
      const [year, month] = d.work_date.split("-").map(Number);

      return (
        d.assignment_id === assignmentId &&
        year === targetYear &&
        month === targetMonth
      );
    })
    .reduce((sum, d) => sum + (d.planned_count ?? 0), 0);
};

export const getDailyTotal = (
  dailyInfos: DailyInfo[],
  workDate: string
) => {
  return dailyInfos
    .filter((d) => d.work_date === workDate)
    .reduce((sum, d) => sum + (d.planned_count ?? 0), 0);
};

import type { Assignment } from "../types";

export const getSortedAssignments = (
  assignments: Assignment[],
  days: string[],
  sortMode: string
) => {
  return [...assignments]
    .filter((assignment) => {
      if (!assignment.start_date && !assignment.end_date) {
        return true;
      }

      if (!assignment.start_date || !assignment.end_date) {
        return true;
      }

      return (
        assignment.start_date <= days[days.length - 1] &&
        assignment.end_date >= days[0]
      );
    })
    .sort((a, b) => {
      switch (sortMode) {
        case "site":
          return (a.site_name || "").localeCompare(
            b.site_name || "",
            "ja"
          );

        case "contractor":
          return (a.contractor_name || "").localeCompare(
            b.contractor_name || "",
            "ja"
          );

        case "manager":
          return (a.manager_name || "").localeCompare(
            b.manager_name || "",
            "ja"
          );

        case "construction":
          return (a.construction_type || "").localeCompare(
            b.construction_type || "",
            "ja"
          );

        case "shift":
          return (a.shift_type || "").localeCompare(
            b.shift_type || "",
            "ja"
          );

        default:
          return 0;
      }
    });
};

export const getGroupedAssignments = (
    sortedAssignments: Assignment[]
  ) => {
    return [
      {
        label: "第一工事",
        rows: sortedAssignments.filter(
          (assignment) => assignment.construction_type === "第一工事"
        ),
        color: "#eef6ff",
      },
      {
        label: "第二工事",
        rows: sortedAssignments.filter(
          (assignment) => assignment.construction_type === "第二工事"
        ),
        color: "#fff8e6",
      },
    ];
  };