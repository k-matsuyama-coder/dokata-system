import { useMemo } from "react";
import type { Assignment } from "../types";

type Props = {
  assignments: Assignment[];
  sortMode: string;
  showFinished: boolean;
  days: string[];
  todayString: string;
};

export function useGroupedAssignments({
  assignments,
  sortMode,
  showFinished,
  days,
  todayString,
}: Props) {
  const sortedAssignments = useMemo(() => {
    return [...assignments].sort((a, b) => {
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
          return (a.construction_type || "").localeCompare(
            b.construction_type || "",
            "ja"
          );

        case "shift":
          return (a.shift_type || "").localeCompare(b.shift_type || "", "ja");

        default:
          return 0;
      }
    });
  }, [assignments, sortMode]);

  const visibleAssignments = useMemo(() => {
    return sortedAssignments.filter((assignment) => {
      if (showFinished) return true;

      if (!assignment.start_date || !assignment.end_date) {
        return true;
      }

      return (
        assignment.start_date <= days[days.length - 1] &&
        assignment.end_date >= todayString
      );
    });
  }, [sortedAssignments, showFinished, days, todayString]);

  const groupedAssignments = useMemo(() => {
    return [
      {
        label: "第一工事",
        rows: visibleAssignments.filter(
          (a) => a.construction_type === "第一工事"
        ),
        color: "#eef6ff",
      },
      {
        label: "第二工事",
        rows: visibleAssignments.filter(
          (a) => a.construction_type === "第二工事"
        ),
        color: "#fff8e6",
      },
    ];
  }, [visibleAssignments]);

  return groupedAssignments;
}