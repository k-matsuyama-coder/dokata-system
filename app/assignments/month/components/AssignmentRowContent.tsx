"use client";

import type React from "react";

import AssignmentRow from "./AssignmentRow";
import AssignmentCell from "./AssignmentCell";
import AssignmentCellContent from "./AssignmentCellContent";

import type {
  Assignment,
  DailyInfo,
  SiteMember,
} from "../types";

import {
  td,
  stickyTd1,
  stickyTd2,
  stickyTd3,
} from "../styles";

import { isOutOfAssignmentPeriod } from "../utils";

type DraggingVehicleFrom = {
  assignmentId: string;
  workDate: string;
  vehicleName: string;
};

type Props = {
  assignment: Assignment;
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

export default function AssignmentRowContent({
  assignment,
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
    <AssignmentRow
      style={{
        backgroundColor:
          assignment.shift_type === "night"
            ? "#f3f4f6"
            : "#fff",
      }}
    >
      {!isMobile && (
        <td
          style={{
            ...td,
            ...stickyTd1,
            backgroundColor:
              assignment.shift_type === "night" ? "#e5e7eb" : "#fff",
          }}
        >
          {assignment.contractor_name || "-"}
        </td>
      )}

      <td
        draggable={!isMobile && sortMode === "manual"}
        onDragStart={() => setDraggingAssignmentId(assignment.id)}
        onDragEnd={() => setDraggingAssignmentId(null)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => {
          if (!draggingAssignmentId) return;

          moveAssignmentRow(
            draggingAssignmentId,
            assignment.id
          );
        }}
        style={{
          ...td,
          ...stickyTd2,
          left: isMobile ? 0 : 70,
          fontWeight: 800,
          cursor: !isMobile && sortMode === "manual" ? "grab" : "pointer",
          backgroundColor:
            draggingAssignmentId === assignment.id
              ? "#dbeafe"
              : assignment.shift_type === "night"
              ? "#e5e7eb"
              : "#fff",
          minWidth: viewMode === "week" ? 260 : 180,
          width: viewMode === "week" ? 260 : 180,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <span
            onClick={() => setEditingAssignment(assignment)}
            style={{
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {assignment.site_name || "-"}
          </span>

          <button
            type="button"
            onClick={() => deleteAssignment(assignment.id)}
            style={{
              backgroundColor: "#d11a2a",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: isMobile ? "6px 10px" : "4px 8px",
              cursor: "pointer",
              fontSize: isMobile ? 11 : 12,
            }}
          >
            削除
          </button>
        </div>
      </td>

      {!isMobile && (
        <td
          style={{
            ...td,
            ...stickyTd3,
            backgroundColor:
              assignment.shift_type === "night" ? "#e5e7eb" : "#fff",
          }}
        >
          {assignment.manager_name || "-"}
        </td>
      )}

      <td
        style={{
          ...td,
          fontWeight: 800,
          color: assignment.shift_type === "night" ? "#fff" : "#111",
          backgroundColor:
            assignment.shift_type === "night" ? "#374151" : "#f3f4f6",
          textAlign: "center",
        }}
      >
        {assignment.shift_type === "night" ? "夜" : "昼"}
      </td>

      {days.map((date) => {
        const cellMembers = getCellMembers(assignment.id, date);
        const dailyInfo = getDailyInfo(assignment.id, date);
        const isOutOfPeriod = isOutOfAssignmentPeriod(
          date,
          assignment.start_date,
          assignment.end_date
        );

        const plannedCount = dailyInfo?.planned_count ?? null;
        const memberCount = cellMembers.length;

        const baseCellStyle = getCellStyle(
          date,
          plannedCount,
          memberCount,
          assignment.shift_type
        );

        return (
          <AssignmentCell
            key={date}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (isOutOfPeriod) return;

              if (draggingSiteMemberId) {
                moveSiteMember(
                  draggingSiteMemberId,
                  assignment.id,
                  date
                );
                return;
              }

              if (draggingEmployeeName) {
                addEmployeeToCell(
                  draggingEmployeeName,
                  assignment.id,
                  date
                );
                return;
              }

              if (draggingVehicleFrom) {
                moveVehicleToCell(
                  draggingVehicleFrom.vehicleName,
                  draggingVehicleFrom.assignmentId,
                  draggingVehicleFrom.workDate,
                  assignment.id,
                  date
                );
                setDraggingVehicleFrom(null);
                return;
              }

              if (draggingVehicleName) {
                addVehicleToCell(
                  draggingVehicleName,
                  assignment.id,
                  date
                );
                setDraggingVehicleName(null);
              }
            }}
            onClick={(e) => {
              if (isOutOfPeriod) return;

              setSelectedDate(date);
              setSelectedShiftType(assignment.shift_type ?? "day");

              if (selectedSiteMemberId) {
                moveSiteMember(
                  selectedSiteMemberId,
                  assignment.id,
                  date
                );
                setSelectedSiteMemberId(null);
                return;
              }

              if (selectedEmployeeName) {
                addEmployeeToCell(
                  selectedEmployeeName,
                  assignment.id,
                  date
                );

                setSelectedEmployeeName(null);

                if (isMobile) {
                  setShowMemberModal(false);
                }

                return;
              }

              if (copiedEmployeeNames.length > 0) {
                const isMultiPaste = copiedEmployeeNames.length > 1;

                copiedEmployeeNames.forEach((name) => {
                  addEmployeeToCell(
                    name,
                    assignment.id,
                    date,
                    !isMultiPaste
                  );
                });

                if (!e.shiftKey) {
                  setCopiedEmployeeNames([]);
                }
              }

              if (copiedVehicleNames.length > 0) {
                copiedVehicleNames.forEach((name) => {
                  addVehicleToCell(name, assignment.id, date);
                });

                setCopiedVehicleNames([]);

                if (isMobile) {
                  setShowMemberModal(false);
                }
              }
            }}
            style={{
              ...baseCellStyle,
              backgroundColor: isOutOfPeriod
                ? "#e5e7eb"
                : baseCellStyle.backgroundColor,
              opacity: isOutOfPeriod ? 0.6 : 1,
            }}
          >
            <AssignmentCellContent
              isMobile={isMobile}
              assignment={assignment}
              date={date}
              dailyInfo={dailyInfo}
              cellMembers={cellMembers}
              plannedCount={plannedCount}
              memberCount={memberCount}
              isOutOfPeriod={isOutOfPeriod}
              editingDetails={editingDetails}
              setEditingDetails={setEditingDetails}
              saveTimers={saveTimers}
              setSaveTimers={setSaveTimers}
              copiedVehicleNames={copiedVehicleNames}
              setCopiedVehicleNames={setCopiedVehicleNames}
              setDraggingVehicleFrom={setDraggingVehicleFrom}
              copiedEmployeeNames={copiedEmployeeNames}
              setDraggingSiteMemberId={setDraggingSiteMemberId}
              setCopiedEmployeeNames={setCopiedEmployeeNames}
              setSelectedSiteMemberId={setSelectedSiteMemberId}
              setSelectedEmployeeName={setSelectedEmployeeName}
              updateDailyInfo={updateDailyInfo}
              removeVehicleFromCell={removeVehicleFromCell}
              deleteSiteMember={deleteSiteMember}
              toggleForeman={toggleForeman}
            />
          </AssignmentCell>
        );
      })}
    </AssignmentRow>
  );
}