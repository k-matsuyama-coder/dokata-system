// app/(system)/admin/assignments/two-month/utils/tableUtils.ts
import type {
  Assignment,
  AssignmentGroupKey,
  AssignmentGroupSetting,
  DailyInfo,
} from "../types";

export const getBandColor = (
  assignment: Assignment,
  groupSettings: AssignmentGroupSetting[] = []
) => {
  const group = groupSettings.find(
    (item) => item.group_key === (assignment.group_key ?? "group1")
  );

  return group?.header_color || "#dcfce7";
};

export const getMonthlyTotal = (
  dailyInfos: DailyInfo[],
  baseMonth: string,
  assignmentId: string,
  targetMonthIndex: 0 | 1
) => {
  const [baseYear, baseMonthNum] = baseMonth.split("-").map(Number);

  const targetDate = new Date(baseYear, baseMonthNum - 1 + targetMonthIndex, 1);
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth() + 1;

  return dailyInfos
    .filter((dailyInfo) => {
      const [year, month] = dailyInfo.work_date.split("-").map(Number);

      return (
        dailyInfo.assignment_id === assignmentId &&
        year === targetYear &&
        month === targetMonth
      );
    })
    .reduce((sum, dailyInfo) => sum + (dailyInfo.planned_count ?? 0), 0);
};

export const getDailyTotal = (dailyInfos: DailyInfo[], workDate: string) => {
  return dailyInfos
    .filter((dailyInfo) => dailyInfo.work_date === workDate)
    .reduce((sum, dailyInfo) => sum + (dailyInfo.planned_count ?? 0), 0);
};

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
          return (a.site_name || "").localeCompare(b.site_name || "", "ja");

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
          return (a.group_key || "").localeCompare(b.group_key || "", "ja");

        case "shift":
          return (a.shift_type || "").localeCompare(b.shift_type || "", "ja");

        default:
          return 0;
      }
    });
};

export const getGroupedAssignments = (
  sortedAssignments: Assignment[],
  groupNameMap: Map<AssignmentGroupKey, string>,
  groupSettings: AssignmentGroupSetting[]
) => {
  const groupedMap = new Map<
    AssignmentGroupKey,
    {
      label: string;
      rows: Assignment[];
      color: string;
    }
  >();

  sortedAssignments.forEach((assignment) => {
    const groupKey = (assignment.group_key ?? "group1") as AssignmentGroupKey;
    const group = groupSettings.find((item) => item.group_key === groupKey);

    if (!group || !group.is_enabled) {
      return;
    }

    if (!groupedMap.has(groupKey)) {
      groupedMap.set(groupKey, {
        label: groupNameMap.get(groupKey) ?? group.display_name ?? groupKey,
        rows: [],
        color: group.header_color || "#eef6ff",
      });
    }

    groupedMap.get(groupKey)!.rows.push(assignment);
  });

  return groupSettings
    .filter((group) => group.is_enabled)
    .map((group) => groupedMap.get(group.group_key as AssignmentGroupKey))
    .filter(
      (
        item
      ): item is {
        label: string;
        rows: Assignment[];
        color: string;
      } => Boolean(item && item.rows.length > 0)
    );
};