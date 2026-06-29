import type { DailyInfo } from "../types";
import { updateDailyInfoApi } from "../api";

type HistoryItem = {
  assignmentId: string;
  workDate: string;
  before: string;
  after: string;
};

type Props = {
  organizationId: string;
  dailyInfos: DailyInfo[];
  setDailyInfos: React.Dispatch<React.SetStateAction<DailyInfo[]>>;
  isUndoRedo: boolean;
  setUndoStack: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  setRedoStack: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
};

export function useDailyInfo({
  organizationId,
  dailyInfos,
  setDailyInfos,
  isUndoRedo,
  setUndoStack,
  setRedoStack,
}: Props) {
  const updateDailyInfo = async (
    assignmentId: string,
    workDate: string,
    field: "planned_count" | "detail",
    value: string
  ) => {
    const existing = dailyInfos.find(
      (d) =>
        d.assignment_id === assignmentId &&
        d.work_date === workDate
    );

    const before = String(existing?.planned_count ?? "");

    if (!isUndoRedo && field === "planned_count" && before !== value) {
      setUndoStack((prev) => [
        ...prev,
        {
          assignmentId,
          workDate,
          before,
          after: value,
        },
      ]);

      setRedoStack([]);
    }

    const payload = {
      assignment_id: assignmentId,
      work_date: workDate,
      planned_count:
        field === "planned_count"
          ? value === ""
            ? null
            : Number(value)
          : existing?.planned_count ?? null,
      detail:
        field === "detail"
          ? value
          : existing?.detail ?? null,
    };

    let data;

    try {
      data = await updateDailyInfoApi(
        organizationId,
        payload);
    } catch (error) {
      alert(error instanceof Error ? "更新失敗: " + error.message : "更新失敗");
      return;
    }

    setDailyInfos((prev) => {
      const exists = prev.some(
        (d) =>
          d.assignment_id === assignmentId &&
          d.work_date === workDate
      );

      if (exists) {
        return prev.map((d) =>
          d.assignment_id === assignmentId &&
          d.work_date === workDate
            ? data
            : d
        );
      }

      return [...prev, data];
    });
  };

  return {
    updateDailyInfo,
  };
}