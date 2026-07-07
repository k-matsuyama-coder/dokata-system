"use client";

import { useCallback, useMemo } from "react";
import type {
  Assignment,
  AssignmentGroupSetting,
  DailyInfo,
  SiteMember,
} from "./useAssignmentViewData";

type AssignmentGroupKey =
  | "group1"
  | "group2"
  | "group3"
  | "group4"
  | "group5";

type FilterMode = "all" | AssignmentGroupKey;

type Props = {
  assignments: Assignment[];
  siteMembers: SiteMember[];
  dailyInfos: DailyInfo[];
  displayDates: string[];
  enabledGroups: AssignmentGroupSetting[];
  filterMode: FilterMode;
};

export function useAssignmentViewBoard({
  assignments,
  siteMembers,
  dailyInfos,
  displayDates,
  enabledGroups,
  filterMode,
}: Props) {
  const getMembers = useCallback(
    (assignmentId: string, workDate: string) => {
      return siteMembers.filter(
        (member) =>
          member.assignment_id === assignmentId && member.work_date === workDate
      );
    },
    [siteMembers]
  );

  const getDailyInfo = useCallback(
    (assignmentId: string, workDate: string) => {
      return dailyInfos.find(
        (dailyInfo) =>
          dailyInfo.assignment_id === assignmentId &&
          dailyInfo.work_date === workDate
      );
    },
    [dailyInfos]
  );

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      if (filterMode === "all") return true;
      return (assignment.group_key ?? "group1") === filterMode;
    });
  }, [assignments, filterMode]);

  const visibleAssignments = useMemo(() => {
    return filteredAssignments.filter((assignment) => {
      return displayDates.some((workDate) => {
        const members = getMembers(assignment.id, workDate);
        const dailyInfo = getDailyInfo(assignment.id, workDate);

        return (
          members.length > 0 ||
          (dailyInfo?.planned_count ?? 0) > 0 ||
          Boolean(dailyInfo?.detail) ||
          Boolean(dailyInfo?.vehicle_names?.length)
        );
      });
    });
  }, [filteredAssignments, displayDates, getMembers, getDailyInfo]);

  const groupedVisibleAssignments = useMemo(() => {
    return enabledGroups
      .map((group) => ({
        ...group,
        rows: visibleAssignments.filter(
          (assignment) => (assignment.group_key ?? "group1") === group.group_key
        ),
      }))
      .filter((group) => group.rows.length > 0);
  }, [enabledGroups, visibleAssignments]);

  return {
    getMembers,
    getDailyInfo,
    filteredAssignments,
    visibleAssignments,
    groupedVisibleAssignments,
  };
}