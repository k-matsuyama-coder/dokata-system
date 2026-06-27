import { useState } from "react";

type DraggingVehicleFrom = {
  assignmentId: string;
  workDate: string;
  vehicleName: string;
};

export function useMonthlyAssignmentSelection() {
  const [draggingEmployeeName, setDraggingEmployeeName] = useState<string | null>(null);
  const [draggingAssignmentId, setDraggingAssignmentId] =
  useState<string | null>(null);
  const [draggingSiteMemberId, setDraggingSiteMemberId] = useState<string | null>(null);
  const [draggingVehicleName, setDraggingVehicleName] = useState<string | null>(null);

  const [draggingVehicleFrom, setDraggingVehicleFrom] =
    useState<DraggingVehicleFrom | null>(null);

  const [copiedVehicleNames, setCopiedVehicleNames] = useState<string[]>([]);
  const [copiedEmployeeNames, setCopiedEmployeeNames] = useState<string[]>([]);

  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string | null>(null);
  const [selectedSiteMemberId, setSelectedSiteMemberId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedShiftType, setSelectedShiftType] = useState<string | null>(null);

  return {
    draggingEmployeeName,
    setDraggingEmployeeName,
    draggingSiteMemberId,
    setDraggingSiteMemberId,
    draggingVehicleName,
    setDraggingVehicleName,
    draggingVehicleFrom,
    setDraggingVehicleFrom,
    draggingAssignmentId,
    setDraggingAssignmentId,

    copiedVehicleNames,
    setCopiedVehicleNames,
    copiedEmployeeNames,
    setCopiedEmployeeNames,

    selectedEmployeeName,
    setSelectedEmployeeName,
    selectedSiteMemberId,
    setSelectedSiteMemberId,
    selectedDate,
    setSelectedDate,
    selectedShiftType,
    setSelectedShiftType,
  };
}