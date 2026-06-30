import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { updateDailyInfoAction } from "../actions/updateDailyInfo";
import type { DailyInfo } from "../types";

type Field = "planned_count" | "detail" | "vehicle_names";

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
  const [editingDetails, setEditingDetails] = useState<Record<string, string>>({});
  const [saveTimers, setSaveTimers] = useState<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

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

  const getDetailValue = (assignmentId: string, workDate: string) => {
    const key = `${assignmentId}_${workDate}`;
    return editingDetails[key] ?? getDailyInfo(assignmentId, workDate)?.detail ?? "";
  };

  useEffect(() => {
    setEditingDetails((prev) => {
      const next = { ...prev };

      for (const key of Object.keys(next)) {
        if (!(key in saveTimers)) {
          delete next[key];
        }
      }

      return next;
    });
  }, [dailyInfos, saveTimers]);

  const updateDailyInfo = async (
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
      alert("更新失敗: " + (error?.message || "取得失敗"));
      return;
    }

    setDailyInfos((prev) => {
      const exists = prev.some((info) => info.id === data.id);

      if (exists) {
        return prev.map((info) => (info.id === data.id ? data : info));
      }

      return [...prev, data];
    });

    const key = `${assignmentId}_${workDate}`;

    setEditingDetails((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    setSaveTimers((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return {
    dailyInfoMap,
    getDailyInfo,
    getDetailValue,
    updateDailyInfo,
    editingDetails,
    setEditingDetails,
    saveTimers,
    setSaveTimers,
  };
}