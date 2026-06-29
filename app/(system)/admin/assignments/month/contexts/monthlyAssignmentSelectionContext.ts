"use client";

import { createContext, useContext } from "react";
import type React from "react";
import type { DraggingVehicleFrom } from "./monthlyAssignmentContext";

export type MonthlyAssignmentSelectionContextValue = {
  draggingAssignmentId: string | null;
  setDraggingAssignmentId: (id: string | null) => void;

  draggingSiteMemberId: string | null;
  setDraggingSiteMemberId: (id: string | null) => void;

  draggingEmployeeName: string | null;
  setDraggingEmployeeName: (name: string | null) => void;

  draggingVehicleName: string | null;
  setDraggingVehicleName: (name: string | null) => void;

  draggingVehicleFrom: DraggingVehicleFrom | null;
  setDraggingVehicleFrom: React.Dispatch<
    React.SetStateAction<DraggingVehicleFrom | null>
  >;

  selectedSiteMemberId: string | null;
  setSelectedSiteMemberId: (id: string | null) => void;

  selectedEmployeeName: string | null;
  setSelectedEmployeeName: (name: string | null) => void;

  selectedDate: string | null;
  setSelectedDate: (date: string | null) => void;

  selectedShiftType: string | null;
  setSelectedShiftType: (shiftType: string | null) => void;

  copiedEmployeeNames: string[];
  setCopiedEmployeeNames: React.Dispatch<React.SetStateAction<string[]>>;

  copiedVehicleNames: string[];
  setCopiedVehicleNames: React.Dispatch<React.SetStateAction<string[]>>;
};

export const MonthlyAssignmentSelectionContext =
  createContext<MonthlyAssignmentSelectionContextValue | null>(null);

export function useMonthlyAssignmentSelectionContext() {
  const context = useContext(MonthlyAssignmentSelectionContext);

  if (!context) {
    throw new Error(
      "useMonthlyAssignmentSelectionContext must be used inside MonthlyAssignmentSelectionContext.Provider"
    );
  }

  return context;
}