"use client";

import React, { Fragment } from "react";
import AssignmentRowContent from "./AssignmentRowContent";
import { useMonthlyAssignmentContext } from "../contexts/monthlyAssignmentContext";

import type { Assignment } from "../types";
import { td } from "../styles";

type Group = {
  label: string;
  rows: Assignment[];
  color: string;
};

type Props = {
    groupedAssignments: Group[];
  };

  function AssignmentGroups({
    groupedAssignments,
  }: Props) {
    const {
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
    } = useMonthlyAssignmentContext();

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
          />
          ))}
        </Fragment>
      ))}
    </>
  );
}

export default React.memo(AssignmentGroups);