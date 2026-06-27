"use client";

import { createContext, useContext } from "react";

import type { SiteMember } from "../types";

export type MonthlyAssignmentActionContextValue = {
  moveAssignmentRow: (
    fromAssignmentId: string,
    toAssignmentId: string
  ) => void;

  deleteAssignment: (id: string) => void;

  moveSiteMember: (
    siteMemberId: string,
    assignmentId: string,
    workDate: string
  ) => void;

  addEmployeeToCell: (
    employeeName: string,
    assignmentId: string,
    workDate: string,
    autoForeman?: boolean
  ) => void;

  moveVehicleToCell: (
    vehicleName: string,
    fromAssignmentId: string,
    fromWorkDate: string,
    toAssignmentId: string,
    toWorkDate: string
  ) => void;

  addVehicleToCell: (
    vehicleName: string,
    assignmentId: string,
    workDate: string
  ) => void;

  removeVehicleFromCell: (
    vehicleName: string,
    assignmentId: string,
    workDate: string
  ) => void;

  updateDailyInfo: (
    assignmentId: string,
    workDate: string,
    field: "planned_count" | "detail" | "vehicle_names",
    value: string
  ) => void;

  deleteSiteMember: (id: string) => void;

  toggleForeman: (member: SiteMember) => void;
};

export const MonthlyAssignmentActionContext =
  createContext<MonthlyAssignmentActionContextValue | null>(null);

export function useMonthlyAssignmentActionContext() {
  const context = useContext(MonthlyAssignmentActionContext);

  if (!context) {
    throw new Error(
      "useMonthlyAssignmentActionContext must be used inside MonthlyAssignmentActionContext.Provider"
    );
  }

  return context;
}