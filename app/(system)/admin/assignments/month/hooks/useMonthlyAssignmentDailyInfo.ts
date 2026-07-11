// app/(system)/admin/assignments/month/hooks/useMonthlyAssignmentDailyInfo.ts
import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { updateDailyInfoAction } from "../actions/updateDailyInfo";
import type { DailyInfo } from "../types";

type Field = "planned_count" | "detail" | "vehicle_names";

type Props = {
  dailyInfos: DailyInfo[];
  setDailyInfos: Dispatch<SetStateAction<DailyInfo[]>>;
  organizationId: string;
};

const DETAIL_SAVE_DELAY_MS = 350;

export function useMonthlyAssignmentDailyInfo({
  organizationId,
  dailyInfos,
  setDailyInfos,
}: Props) {
  const saveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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

  const clearSaveTimer = (key: string) => {
    const timer = saveTimersRef.current[key];
  
    if (timer) {
      clearTimeout(timer);
      delete saveTimersRef.current[key];
    }
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
      alert("更新失敗: " + (error?.message || "取得失敗"));
      return false;
    }

    applySavedDailyInfo(data);

    const key = `${assignmentId}_${workDate}`;

    clearSaveTimer(key);
    return true;
  };

  const updateDailyInfo = async (
    assignmentId: string,
    workDate: string,
    field: Field,
    value: string
  ) => {
    if (field === "detail") {
      const key = `${assignmentId}_${workDate}`;
    
      clearSaveTimer(key);
    
      saveTimersRef.current[key] = setTimeout(() => {
        void saveDailyInfo(assignmentId, workDate, field, value);
      }, DETAIL_SAVE_DELAY_MS);
    
      return;
    }

    await saveDailyInfo(assignmentId, workDate, field, value);
  };

  const flushDetailSave = async (assignmentId: string, workDate: string) => {
    const key = `${assignmentId}_${workDate}`;
    clearSaveTimer(key);
  };

  useEffect(() => {
    return () => {
      Object.values(saveTimersRef.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return {
    dailyInfoMap,
    getDailyInfo,
    updateDailyInfo,
    flushDetailSave,
  };
}