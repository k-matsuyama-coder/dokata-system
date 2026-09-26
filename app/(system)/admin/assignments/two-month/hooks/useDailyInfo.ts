import type { DailyInfo } from "../types";
import { updateDailyInfoApi } from "../api";

type HistoryItem = {
  assignmentId: string;
  workDate: string;
  before: string;
  after: string;
};

type Props = {
  organizationId: string | null;
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
    field: "planned_count" | "detail" | "memo",
    value: string
  ) => {
    try {
      if (!organizationId) {
        throw new Error("会社情報が取得できません");
      }

      if (!assignmentId || assignmentId === "undefined") {
        throw new Error("現場IDが取得できません");
      }

      const existing = dailyInfos.find(
        (item) =>
          item.assignment_id === assignmentId &&
          item.work_date === workDate
      );

      const before = String(existing?.planned_count ?? "");

      const payload: {
        assignment_id: string;
        work_date: string;
        planned_count?: number | null;
        detail?: string | null;
        memo?: string | null;
      } = {
        assignment_id: assignmentId,
        work_date: workDate,
      };

      // 変更した項目だけ保存する
      if (field === "planned_count") {
        const count = value.trim() === "" ? null : Number(value);

        if (count !== null && (!Number.isFinite(count) || count < 0)) {
          throw new Error("人数は0以上の数値で入力してください");
        }

        payload.planned_count = count;
      } else if (field === "detail") {
        payload.detail = value.trim() === "" ? null : value;
      } else {
        payload.memo = value.trim() === "" ? null : value;
      }

      const data = await updateDailyInfoApi(payload, organizationId);

      setDailyInfos((prev) => {
        const exists = prev.some(
          (item) =>
            item.assignment_id === assignmentId &&
            item.work_date === workDate
        );

        if (!exists) return [...prev, data];

        return prev.map((item) =>
          item.assignment_id === assignmentId &&
          item.work_date === workDate
            ? data
            : item
        );
      });

      // 保存できた操作だけ履歴に記録する
      if (!isUndoRedo && field === "planned_count" && before !== value) {
        setUndoStack((prev) => [
          ...prev,
          { assignmentId, workDate, before, after: value },
        ]);
        setRedoStack([]);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "保存に失敗しました";

      if (field === "memo") {
        throw new Error(message);
      }

      alert("更新失敗: " + message);
    }
  };

  return { updateDailyInfo };
}