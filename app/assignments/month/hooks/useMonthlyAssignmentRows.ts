import type { Dispatch, SetStateAction } from "react";

import { moveAssignmentRowAction } from "../actions/moveAssignmentRow";

import type { Assignment } from "../types";

type Props = {
  assignments: Assignment[];
  setAssignments: Dispatch<SetStateAction<Assignment[]>>;
  fetchData: () => Promise<void>;
};

export function useMonthlyAssignmentRows({
  assignments,
  setAssignments,
  fetchData,
}: Props) {
  const moveAssignmentRow = async (
    fromAssignmentId: string,
    toAssignmentId: string
  ) => {
    const { nextAssignments, error } = await moveAssignmentRowAction({
      assignments,
      fromAssignmentId,
      toAssignmentId,
    });

    setAssignments(nextAssignments);

    if (error) {
      alert("並び替え保存失敗: " + error.message);
      fetchData();
    }
  };

  return {
    moveAssignmentRow,
  };
}