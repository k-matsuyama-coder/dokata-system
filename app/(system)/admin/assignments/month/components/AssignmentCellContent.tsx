"use client";

import React from "react";

import AssignmentDayCell from "./AssignmentDayCell";
import AssignmentDetailTextarea from "./AssignmentDetailTextarea";
import AssignmentVehicleSection from "./AssignmentVehicleSection";
import AssignmentMemberSection from "./AssignmentMemberSection";

import type {
  Assignment,
  DailyInfo,
  Employee,
  SiteMember,
} from "../types";

type DraggingVehicleFrom = {
  assignmentId: string;
  workDate: string;
  vehicleName: string;
};

type Props = {
  isMobile: boolean;
  assignment: Assignment;
  date: string;
  dailyInfo: DailyInfo | undefined;
  cellMembers: SiteMember[];
  plannedCount: number | null;
  memberCount: number;
  isOutOfPeriod: boolean;
  employees: Employee[];

  editingDetails: Record<string, string>;
  setEditingDetails: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;

  saveTimers: Record<string, ReturnType<typeof setTimeout>>;
  setSaveTimers: React.Dispatch<
    React.SetStateAction<Record<string, ReturnType<typeof setTimeout>>>
  >;

  copiedVehicleNames: string[];
  setCopiedVehicleNames: React.Dispatch<React.SetStateAction<string[]>>;
  setDraggingVehicleFrom: React.Dispatch<
    React.SetStateAction<DraggingVehicleFrom | null>
  >;

  copiedEmployeeNames: string[];
  setDraggingSiteMemberId: (id: string | null) => void;
  setCopiedEmployeeNames: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedSiteMemberId: (id: string | null) => void;
  setSelectedEmployeeName: (name: string | null) => void;

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

  removeVehicleFromCell: (
    vehicleName: string,
    assignmentId: string,
    workDate: string
  ) => void;

  deleteSiteMember: (id: string) => void;
  toggleForeman: (member: SiteMember) => void;
};

function AssignmentCellContent({
  isMobile,
  assignment,
  date,
  dailyInfo,
  cellMembers,
  plannedCount,
  memberCount,
  isOutOfPeriod,
  employees,

  editingDetails,
  setEditingDetails,
  saveTimers,
  setSaveTimers,

  copiedVehicleNames,
  setCopiedVehicleNames,
  setDraggingVehicleFrom,

  copiedEmployeeNames,
  setDraggingSiteMemberId,
  setCopiedEmployeeNames,
  setSelectedSiteMemberId,
  setSelectedEmployeeName,

  updateDailyInfo,
  flushDetailSave,
  removeVehicleFromCell,
  deleteSiteMember,
  toggleForeman,
}: Props) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <AssignmentDayCell
        isMobile={isMobile}
        isOutOfPeriod={isOutOfPeriod}
        plannedCount={plannedCount}
        memberCount={memberCount}
        assignmentId={assignment.id}
        workDate={date}
        dailyInfo={dailyInfo}
        updateDailyInfo={updateDailyInfo}
      />

<AssignmentDetailTextarea
  isMobile={isMobile}
  isOutOfPeriod={isOutOfPeriod}
  assignmentId={assignment.id}
  workDate={date}
  dailyInfo={dailyInfo}
  editingDetails={editingDetails}
  setEditingDetails={setEditingDetails}
  saveTimers={saveTimers}
  setSaveTimers={setSaveTimers}
  flushDetailSave={flushDetailSave}
  updateDailyInfo={updateDailyInfo}
/>

      <AssignmentVehicleSection
        isMobile={isMobile}
        assignmentId={assignment.id}
        workDate={date}
        dailyInfo={dailyInfo}
        copiedVehicleNames={copiedVehicleNames}
        setCopiedVehicleNames={setCopiedVehicleNames}
        setDraggingVehicleFrom={setDraggingVehicleFrom}
        removeVehicleFromCell={removeVehicleFromCell}
      />

      <AssignmentMemberSection
        isMobile={isMobile}
        cellMembers={cellMembers}
        employees={employees}
        copiedEmployeeNames={copiedEmployeeNames}
        setDraggingSiteMemberId={setDraggingSiteMemberId}
        setCopiedEmployeeNames={setCopiedEmployeeNames}
        setSelectedSiteMemberId={setSelectedSiteMemberId}
        setSelectedEmployeeName={setSelectedEmployeeName}
        deleteSiteMember={deleteSiteMember}
        toggleForeman={toggleForeman}
      />
    </div>
  );
}
export default React.memo(AssignmentCellContent);