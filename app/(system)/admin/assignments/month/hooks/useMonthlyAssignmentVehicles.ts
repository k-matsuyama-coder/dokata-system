import type { DailyInfo } from "../types";

type Props = {
  getDailyInfo: (
    assignmentId: string,
    workDate: string
  ) => DailyInfo | undefined;

  updateDailyInfo: (
    assignmentId: string,
    workDate: string,
    field: "planned_count" | "detail" | "vehicle_names",
    value: string
  ) => Promise<void>;
};

export function useMonthlyAssignmentVehicles({
  getDailyInfo,
  updateDailyInfo,
}: Props) {
  const addVehicleToCell = async (
    vehicleName: string,
    assignmentId: string,
    workDate: string
  ) => {
    const existing = getDailyInfo(assignmentId, workDate);
    const current = existing?.vehicle_names ?? [];

    if (current.includes(vehicleName)) return;

    await updateDailyInfo(
      assignmentId,
      workDate,
      "vehicle_names",
      [...current, vehicleName].join(",")
    );
  };

  const removeVehicleFromCell = async (
    vehicleName: string,
    assignmentId: string,
    workDate: string
  ) => {
    const existing = getDailyInfo(assignmentId, workDate);
    const current = existing?.vehicle_names ?? [];

    await updateDailyInfo(
      assignmentId,
      workDate,
      "vehicle_names",
      current.filter((name) => name !== vehicleName).join(",")
    );
  };

  const moveVehicleToCell = async (
    vehicleName: string,
    fromAssignmentId: string,
    fromWorkDate: string,
    toAssignmentId: string,
    toWorkDate: string
  ) => {
    await removeVehicleFromCell(
      vehicleName,
      fromAssignmentId,
      fromWorkDate
    );

    await addVehicleToCell(
      vehicleName,
      toAssignmentId,
      toWorkDate
    );
  };

  return {
    addVehicleToCell,
    removeVehicleFromCell,
    moveVehicleToCell,
  };
}