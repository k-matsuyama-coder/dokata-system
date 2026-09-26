// app/(system)/admin/assignments/month/hooks/useMonthlyAssignmentDailyInfo.ts
import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";

import { updateDailyInfoAction } from "../actions/updateDailyInfo";
import type { DailyInfo } from "../types";

type Field = "planned_count" | "detail" | "memo" | "vehicle_names";

type Props = {
  dailyInfos: DailyInfo[];
  setDailyInfos: Dispatch<SetStateAction<DailyInfo[]>>;
  organizationId: string;
};

export function useMonthlyAssignmentDailyInfo({
  organizationId,
  dailyInfos,
  setDailyInfos,
}: Props) {
  const dailyInfoMap = useMemo(() => {
    const map = new Map<string, DailyInfo>();

    dailyInfos.forEach((info) => {
      map.set(`${info.assignment_id}_${info.work_date}`, info);
    });

    return map;
  }, [dailyInfos]);

  const getDailyInfo = (assignmentId: string, workDate: string) => {
    return dailyInfoMap.get(`${assignmentId}_${workDate}`);
  };

  const applySavedDailyInfo = (data: DailyInfo) => {
    setDailyInfos((prev) => {
      const index = prev.findIndex(
        (info) =>
          info.assignment_id === data.assignment_id &&
          info.work_date === data.work_date
      );
  
      if (index === -1) {
        return [...prev, data];
      }
  
      const next = [...prev];
      next[index] = data;
      return next;
    });
  };

  const saveDailyInfo = async (
    assignmentId: string,
    workDate: string,
    field: Field,
    value: string
  ) => {
    const existing = getDailyInfo(assignmentId, workDate);

    const { data, error } = await updateDailyInfoAction({
      assignmentId,
      workDate,
      field,
      value,
      organizationId,
      existing,
    });

    if (error || !data) {
      const message = "更新失敗: " + (error?.message || "取得失敗");

      if (field === "memo") {
        throw new Error(message);
      }

      alert(message);
      return false;
    }

    applySavedDailyInfo(data);

    return true;
  };

  const updateDailyInfo = async (
    assignmentId: string,
    workDate: string,
    field: Field,
    value: string
  ) => {
    await saveDailyInfo(assignmentId, workDate, field, value);
  };

  const flushDetailSave = async (
    _assignmentId: string,
    _workDate: string
  ) => {};

  return {
    dailyInfoMap,
    getDailyInfo,
    updateDailyInfo,
    flushDetailSave,
  };
}