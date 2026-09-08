import { useMemo } from "react";
import {
  buildNextDetailTags,
  buildRemovedDetailTags,
} from "../utils/detailUtils";
import type { DailyInfo } from "../types";

type Props = {
  dailyInfos: DailyInfo[];
  updateDailyInfo: (
    assignmentId: string,
    workDate: string,
    field: "planned_count" | "detail",
    value: string
  ) => Promise<void>;
};

export function useDetailTags({
  dailyInfos,
  updateDailyInfo,
}: Props) {
  const dailyInfoMap = useMemo(() => {
    return new Map(
      dailyInfos.map((dailyInfo) => [
        `${dailyInfo.assignment_id}_${dailyInfo.work_date}`,
        dailyInfo,
      ])
    );
  }, [dailyInfos]);

  const getDailyInfo = (
    assignmentId: string,
    workDate: string
  ) => {
    return dailyInfoMap.get(`${assignmentId}_${workDate}`);
  };

  const getPlannedCount = (
    assignmentId: string,
    workDate: string
  ): number | "" => {
    return getDailyInfo(assignmentId, workDate)?.planned_count ?? "";
  };

  const getDetailTags = (
    assignmentId: string,
    workDate: string
  ): string[] => {
    const detail = getDailyInfo(assignmentId, workDate)?.detail ?? "";

    if (!detail) return [];

    return detail
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  };

  const addDetailTag = async (
    assignmentId: string,
    workDate: string,
    tag: string
  ) => {
    const current = getDetailTags(assignmentId, workDate);
    const next = buildNextDetailTags(current, tag);

    await updateDailyInfo(
      assignmentId,
      workDate,
      "detail",
      next.join(",")
    );
  };

  const removeDetailTag = async (
    assignmentId: string,
    workDate: string,
    tag: string
  ) => {
    const current = getDetailTags(assignmentId, workDate);
    const next = buildRemovedDetailTags(current, tag);

    await updateDailyInfo(
      assignmentId,
      workDate,
      "detail",
      next.join(",")
    );
  };

  return {
    getPlannedCount,
    getDetailTags,
    addDetailTag,
    removeDetailTag,
  };
}