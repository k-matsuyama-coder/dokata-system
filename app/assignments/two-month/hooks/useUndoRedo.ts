import { useEffect } from "react";

type HistoryItem = {
  assignmentId: string;
  workDate: string;
  before: string;
  after: string;
};

type Props = {
  undoStack: HistoryItem[];
  redoStack: HistoryItem[];
  setUndoStack: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  setRedoStack: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  setIsUndoRedo: React.Dispatch<React.SetStateAction<boolean>>;
  updateDailyInfo: (
    assignmentId: string,
    workDate: string,
    field: "planned_count" | "detail",
    value: string
  ) => Promise<void>;
};

export function useUndoRedo({
  undoStack,
  redoStack,
  setUndoStack,
  setRedoStack,
  setIsUndoRedo,
  updateDailyInfo,
}: Props) {
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const isUndo =
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "z" &&
        !e.shiftKey;

      const isRedo =
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
        ((e.ctrlKey || e.metaKey) &&
          e.key.toLowerCase() === "z" &&
          e.shiftKey);

      if (!isUndo && !isRedo) return;

      e.preventDefault();
      e.stopPropagation();

      if (isUndo) {
        const last = undoStack[undoStack.length - 1];
        if (!last) return;

        setIsUndoRedo(true);

        setUndoStack((prev) => prev.slice(0, -1));
        setRedoStack((prev) => [...prev, last]);

        const input = document.querySelector<HTMLInputElement>(
          `input[data-assignment-id="${last.assignmentId}"][data-work-date="${last.workDate}"]`
        );

        if (input) {
          input.value = last.before;
          input.focus();
          input.select();
        }

        await updateDailyInfo(
          last.assignmentId,
          last.workDate,
          "planned_count",
          last.before
        );

        setIsUndoRedo(false);
      }

      if (isRedo) {
        const last = redoStack[redoStack.length - 1];
        if (!last) return;

        setIsUndoRedo(true);

        setRedoStack((prev) => prev.slice(0, -1));
        setUndoStack((prev) => [...prev, last]);

        const input = document.querySelector<HTMLInputElement>(
          `input[data-assignment-id="${last.assignmentId}"][data-work-date="${last.workDate}"]`
        );

        if (input) {
          input.value = last.after;
          input.focus();
          input.select();
        }

        await updateDailyInfo(
          last.assignmentId,
          last.workDate,
          "planned_count",
          last.after
        );

        setIsUndoRedo(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [
    undoStack,
    redoStack,
    setUndoStack,
    setRedoStack,
    setIsUndoRedo,
    updateDailyInfo,
  ]);
}