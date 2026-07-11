"use client";

import { createContext, useContext } from "react";
import type React from "react";

import type {
  Assignment,
  DailyInfo,
  Employee,
  SiteMember,
} from "../types";

export type DraggingVehicleFrom = {
  assignmentId: string;
  workDate: string;
  vehicleName: string;
};

export type MonthlyAssignmentContextValue = {
  days: string[];
  isMobile: boolean;
  viewMode: "month" | "week";
  sortMode: string;

  draggingAssignmentId: string | null;
  draggingSiteMemberId: string | null;
  draggingEmployeeName: string | null;
  draggingVehicleName: string | null;
  draggingVehicleFrom: DraggingVehicleFrom | null;

  selectedSiteMemberId: string | null;
  selectedEmployeeName: string | null;

  copiedEmployeeNames: string[];
  copiedVehicleNames: string[];

  employees: Employee[];

  getCellMembers: (assignmentId: string, workDate: string) => SiteMember[];
  getDailyInfo: (assignmentId: string, workDate: string) => DailyInfo | undefined;
  getCellStyle: (
    date: string,
    plannedCount: number | null | undefined,
    memberCount: number,
    shiftType: string | null
  ) => React.CSSProperties;

  setDraggingAssignmentId: (id: string | null) => void;
  setDraggingSiteMemberId: (id: string | null) => void;
  setDraggingEmployeeName: (name: string | null) => void;
  setDraggingVehicleName: (name: string | null) => void;
  setDraggingVehicleFrom: React.Dispatch<
    React.SetStateAction<DraggingVehicleFrom | null>
  >;

  setSelectedDate: (date: string | null) => void;
  setSelectedShiftType: (shiftType: string | null) => void;
  setSelectedSiteMemberId: (id: string | null) => void;
  setSelectedEmployeeName: (name: string | null) => void;
  setShowMemberModal: (value: boolean) => void;

  setCopiedEmployeeNames: React.Dispatch<React.SetStateAction<string[]>>;
  setCopiedVehicleNames: React.Dispatch<React.SetStateAction<string[]>>;

  setEditingAssignment: (assignment: Assignment | null) => void;

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

  flushDetailSave: (
    assignmentId: string,
    workDate: string
  ) => Promise<void>;

  deleteSiteMember: (id: string) => void;
  toggleForeman: (member: SiteMember) => void;

  getEditingUsers: (cellKey: string) => {
    userId: string;
    userName: string;
    cellKey: string;
    startedAt: string;
  }[];
  startEditing: (cellKey: string) => void | Promise<void>;
  stopEditing: () => void | Promise<void>;
};

export const MonthlyAssignmentContext =
  createContext<MonthlyAssignmentContextValue | null>(null);

export function useMonthlyAssignmentContext() {
  const context = useContext(MonthlyAssignmentContext);

  if (!context) {
    throw new Error(
      "useMonthlyAssignmentContext must be used inside MonthlyAssignmentContext.Provider"
    );
  }

  return context;
}