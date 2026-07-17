import { useMemo } from "react";
import type {
  Assignment,
  AssignmentGroupKey,
  AssignmentGroupSetting,
} from "../types";

type DailyInfoForSort = {
  assignment_id: string;
  work_date: string;
  planned_count: number | null;
};

type Props = {
  assignments: Assignment[];
  dailyInfos: DailyInfoForSort[];
  sortMode: string;
  showFinished: boolean;
  days: string[];
  todayString: string;
  groupNameMap: Map<AssignmentGroupKey, string>;
  groupSettings: AssignmentGroupSetting[];
};

export function useGroupedAssignments({
  assignments,
  dailyInfos,
  sortMode,
  showFinished,
  days,
  todayString,
  groupNameMap,
  groupSettings,
}: Props) {
  return useMemo(() => {
    const monthStart = days[0];
const monthEnd = days[days.length - 1];
const filtered = assignments.filter((assignment) => {
  const start = assignment.start_date ?? "0000-01-01";
  const end = assignment.end_date ?? "9999-12-31";

  const overlapsMonth =
    start <= monthEnd &&
    end >= monthStart;

  if (!overlapsMonth) {
    return false;
  }

  if (showFinished) {
    return true;
  }

  return end >= todayString;
});

const currentDate = new Date(`${todayString}T00:00:00`);
const dayOfWeek = currentDate.getDay();
const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

const weekStartDate = new Date(currentDate);
weekStartDate.setDate(currentDate.getDate() + mondayOffset);

const weekEndDate = new Date(weekStartDate);
weekEndDate.setDate(weekStartDate.getDate() + 6);

const formatDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;

const currentWeekStart = formatDate(weekStartDate);
const currentWeekEnd = formatDate(weekEndDate);

const plannedThisWeek = new Set(
  dailyInfos
    .filter(
      (info) =>
        (info.planned_count ?? 0) > 0 &&
        info.work_date >= currentWeekStart &&
        info.work_date <= currentWeekEnd
    )
    .map((info) => info.assignment_id)
);

    const groupedMap = new Map<
      string,
      {
        label: string;
        rows: Assignment[];
        color: string;
      }
    >();

    filtered.forEach((assignment) => {
      const groupKey = (assignment.group_key ?? "group1") as AssignmentGroupKey;
      const label = groupNameMap.get(groupKey) ?? "未設定グループ";
      const group = groupSettings.find((item) => item.group_key === groupKey);
      const color = group?.header_color || "#f3f4f6";

      if (!groupedMap.has(groupKey)) {
        groupedMap.set(groupKey, {
          label,
          rows: [],
          color,
        });
      }

      groupedMap.get(groupKey)!.rows.push(assignment);
    });

    if (sortMode === "plannedWeek") {
      groupedMap.forEach((group) => {
        group.rows.sort((a, b) => {
          const aPlanned = plannedThisWeek.has(a.id);
          const bPlanned = plannedThisWeek.has(b.id);
    
          if (aPlanned !== bPlanned) {
            return aPlanned ? -1 : 1;
          }
    
          return a.site_name.localeCompare(b.site_name, "ja");
        });
      });
    }

    return Array.from(groupedMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value);
    }, [
      assignments,
      dailyInfos,
      sortMode,
      showFinished,
      todayString,
      days,
      groupNameMap,
      groupSettings,
    ]);
}