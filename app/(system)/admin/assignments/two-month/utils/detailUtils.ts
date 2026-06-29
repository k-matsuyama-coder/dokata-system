import type { DailyInfo } from "../types";

export const getPlannedCountFromDailyInfos = (
  dailyInfos: DailyInfo[],
  assignmentId: string,
  workDate: string
) => {
  return (
    dailyInfos.find(
      (d) =>
        d.assignment_id === assignmentId &&
        d.work_date === workDate
    )?.planned_count ?? ""
  );
};

export const getDetailFromDailyInfos = (
  dailyInfos: DailyInfo[],
  assignmentId: string,
  workDate: string
) => {
  return (
    dailyInfos.find(
      (d) =>
        d.assignment_id === assignmentId &&
        d.work_date === workDate
    )?.detail ?? ""
  );
};

export const getDetailTagsFromDailyInfos = (
  dailyInfos: DailyInfo[],
  assignmentId: string,
  workDate: string
) => {
  const detail = getDetailFromDailyInfos(
    dailyInfos,
    assignmentId,
    workDate
  );

  if (!detail) return [];

  return detail
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
};

export const buildNextDetailTags = (
    current: string[],
    tag: string
  ) => {
    if (!tag.trim()) return current;
  
    if (current.includes(tag)) return current;
  
    return [...current, tag];
  };
  
  export const buildRemovedDetailTags = (
    current: string[],
    tag: string
  ) => {
    return current.filter((v) => v !== tag);
  };

