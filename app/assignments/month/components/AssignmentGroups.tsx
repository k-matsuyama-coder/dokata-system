"use client";

import { Fragment } from "react";
import AssignmentRowContent from "./AssignmentRowContent";

import type {
  Assignment,
  DailyInfo,
  SiteMember,
} from "../types";

import { td } from "../styles";

type DraggingVehicleFrom = {
  assignmentId: string;
  workDate: string;
  vehicleName: string;
};

type Group = {
  label: string;
  rows: Assignment[];
  color: string;
};

type Props = {
  groupedAssignments: Group[];
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
  editingDetails: Record<string, string>;
  saveTimers: Record<string, ReturnType<typeof setTimeout>>;

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
  setEditingDetails: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  setSaveTimers: React.Dispatch<
    React.SetStateAction<Record<string, ReturnType<typeof setTimeout>>>
  >;
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
  deleteSiteMember: (id: string) => void;
  toggleForeman: (member: SiteMember) => void;
};

export default function AssignmentGroups({
  groupedAssignments,
  days,
  isMobile,
  viewMode,
  sortMode,
  draggingAssignmentId,
  draggingSiteMemberId,
  draggingEmployeeName,
  draggingVehicleName,
  draggingVehicleFrom,
  selectedSiteMemberId,
  selectedEmployeeName,
  copiedEmployeeNames,
  copiedVehicleNames,
  editingDetails,
  saveTimers,

  getCellMembers,
  getDailyInfo,
  getCellStyle,

  setDraggingAssignmentId,
  setDraggingSiteMemberId,
  setDraggingEmployeeName,
  setDraggingVehicleName,
  setDraggingVehicleFrom,
  setSelectedDate,
  setSelectedShiftType,
  setSelectedSiteMemberId,
  setSelectedEmployeeName,
  setShowMemberModal,
  setCopiedEmployeeNames,
  setCopiedVehicleNames,
  setEditingDetails,
  setSaveTimers,
  setEditingAssignment,

  moveAssignmentRow,
  deleteAssignment,
  moveSiteMember,
  addEmployeeToCell,
  moveVehicleToCell,
  addVehicleToCell,
  removeVehicleFromCell,
  updateDailyInfo,
  deleteSiteMember,
  toggleForeman,
}: Props) {
  return (
    <>
      {groupedAssignments.map((group) => (
        <Fragment key={group.label}>
          <tr>
            <td
              colSpan={days.length + (isMobile ? 2 : 4)}
              style={{
                ...td,
                backgroundColor: group.color,
                color: "#111",
                fontWeight: 900,
                fontSize: 14,
              }}
            >
              {group.label}
            </td>
          </tr>

          {group.rows.map((assignment) => (
            <AssignmentRowContent
              key={assignment.id}
              assignment={assignment}
              days={days}
              isMobile={isMobile}
              viewMode={viewMode}
              sortMode={sortMode}
              draggingAssignmentId={draggingAssignmentId}
              draggingSiteMemberId={draggingSiteMemberId}
              draggingEmployeeName={draggingEmployeeName}
              draggingVehicleName={draggingVehicleName}
              draggingVehicleFrom={draggingVehicleFrom}
              selectedSiteMemberId={selectedSiteMemberId}
              selectedEmployeeName={selectedEmployeeName}
              copiedEmployeeNames={copiedEmployeeNames}
              copiedVehicleNames={copiedVehicleNames}
              editingDetails={editingDetails}
              saveTimers={saveTimers}
              getCellMembers={getCellMembers}
              getDailyInfo={getDailyInfo}
              getCellStyle={getCellStyle}
              setDraggingAssignmentId={setDraggingAssignmentId}
              setDraggingSiteMemberId={setDraggingSiteMemberId}
              setDraggingEmployeeName={setDraggingEmployeeName}
              setDraggingVehicleName={setDraggingVehicleName}
              setDraggingVehicleFrom={setDraggingVehicleFrom}
              setSelectedDate={setSelectedDate}
              setSelectedShiftType={setSelectedShiftType}
              setSelectedSiteMemberId={setSelectedSiteMemberId}
              setSelectedEmployeeName={setSelectedEmployeeName}
              setShowMemberModal={setShowMemberModal}
              setCopiedEmployeeNames={setCopiedEmployeeNames}
              setCopiedVehicleNames={setCopiedVehicleNames}
              setEditingDetails={setEditingDetails}
              setSaveTimers={setSaveTimers}
              setEditingAssignment={setEditingAssignment}
              moveAssignmentRow={moveAssignmentRow}
              deleteAssignment={deleteAssignment}
              moveSiteMember={moveSiteMember}
              addEmployeeToCell={addEmployeeToCell}
              moveVehicleToCell={moveVehicleToCell}
              addVehicleToCell={addVehicleToCell}
              removeVehicleFromCell={removeVehicleFromCell}
              updateDailyInfo={updateDailyInfo}
              deleteSiteMember={deleteSiteMember}
              toggleForeman={toggleForeman}
            />
          ))}
        </Fragment>
      ))}
    </>
  );
}