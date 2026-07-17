import { useMemo } from "react";
import type {
  Assignment,
  AssignmentGroupKey,
  AssignmentGroupSetting,
} from "../types";

type Props = {
  assignments: Assignment[];
  sortMode: string;
  showFinished: boolean;
  days: string[];
  todayString: string;
  groupNameMap: Map<AssignmentGroupKey, string>;
  groupSettings: AssignmentGroupSetting[];
};

export function useGroupedAssignments({
  assignments,
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

    return Array.from(groupedMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value);
    }, [assignments, showFinished, todayString, groupNameMap, groupSettings]);
}