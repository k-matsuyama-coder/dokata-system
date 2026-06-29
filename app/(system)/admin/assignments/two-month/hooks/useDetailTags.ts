import {
  getPlannedCountFromDailyInfos,
  getDetailTagsFromDailyInfos,
  buildNextDetailTags,
  buildRemovedDetailTags,
} from "../utils/detailUtils";
  
  import { DailyInfo } from "../types";
  
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
    const getPlannedCount = (assignmentId: string, workDate: string) =>
    getPlannedCountFromDailyInfos(dailyInfos, assignmentId, workDate);

  const getDetailTags = (assignmentId: string, workDate: string) =>
    getDetailTagsFromDailyInfos(dailyInfos, assignmentId, workDate);

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