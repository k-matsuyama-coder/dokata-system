// app/(system)/admin/assignments/month/hooks/useMonthlyAssignmentDailyInfo.ts
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

const DETAIL_SAVE_DELAY_MS = 1200;

export function useMonthlyAssignmentDailyInfo({
  organizationId,
  dailyInfos,
  setDailyInfos,
}: Props) {
  const [editingDetails, setEditingDetails] = useState<Record<string, string>>(
    {}
  );
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
    return (
      editingDetails[key] ?? getDailyInfo(assignmentId, workDate)?.detail ?? ""
    );
  };

  const clearSaveTimer = (key: string) => {
    setSaveTimers((prev) => {
      const timer = prev[key];

      if (timer) {
        clearTimeout(timer);
      }

      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const applySavedDailyInfo = (data: DailyInfo) => {
    setDailyInfos((prev) => {
      const exists = prev.some((info) => info.id === data.id);

      if (exists) {
        return prev.map((info) => (info.id === data.id ? data : info));
      }

      return [...prev, data];
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

    if (field === "detail") {
      setEditingDetails((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }

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

      setEditingDetails((prev) => ({
        ...prev,
        [key]: value,
      }));

      setSaveTimers((prev) => {
        const current = prev[key];

        if (current) {
          clearTimeout(current);
        }

        const timer = setTimeout(() => {
          void saveDailyInfo(assignmentId, workDate, field, value);
        }, DETAIL_SAVE_DELAY_MS);

        return {
          ...prev,
          [key]: timer,
        };
      });

      return;
    }

    await saveDailyInfo(assignmentId, workDate, field, value);
  };

  const flushDetailSave = async (assignmentId: string, workDate: string) => {
    const key = `${assignmentId}_${workDate}`;
    const value = editingDetails[key];

    clearSaveTimer(key);

    if (value === undefined) {
      return;
    }

    await saveDailyInfo(assignmentId, workDate, "detail", value);
  };

  useEffect(() => {
    return () => {
      Object.values(saveTimers).forEach((timer) => clearTimeout(timer));
    };
  }, [saveTimers]);

  return {
    dailyInfoMap,
    getDailyInfo,
    getDetailValue,
    updateDailyInfo,
    flushDetailSave,
    editingDetails,
    setEditingDetails,
    saveTimers,
    setSaveTimers,
  };
}