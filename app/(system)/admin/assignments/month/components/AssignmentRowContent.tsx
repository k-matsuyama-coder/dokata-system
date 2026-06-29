"use client";

import React from "react";

import AssignmentRow from "./AssignmentRow";
import AssignmentCell from "./AssignmentCell";
import AssignmentCellContent from "./AssignmentCellContent";
import { useMonthlyAssignmentContext } from "../contexts/monthlyAssignmentContext";
import { useMonthlyAssignmentSelectionContext } from "../contexts/monthlyAssignmentSelectionContext";
import { useMonthlyAssignmentActionContext } from "../contexts/monthlyAssignmentActionContext";

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

type Props = {
    assignment: Assignment;
  };

  function AssignmentRowContent({
    assignment,
  }: Props) {
    const {
        days,
        isMobile,
        viewMode,
        sortMode,
        editingDetails,
        saveTimers,
        getCellMembers,
        getDailyInfo,
        getCellStyle,
        setShowMemberModal,
        setEditingDetails,
        setSaveTimers,
        setEditingAssignment,
      } = useMonthlyAssignmentContext();
      
      const {
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
      } = useMonthlyAssignmentActionContext();
      
      const {
        draggingAssignmentId,
        setDraggingAssignmentId,
        draggingSiteMemberId,
        setDraggingSiteMemberId,
        draggingEmployeeName,
        draggingVehicleName,
        draggingVehicleFrom,
        setDraggingVehicleFrom,
        selectedSiteMemberId,
        setSelectedSiteMemberId,
        selectedEmployeeName,
        setSelectedEmployeeName,
        setSelectedDate,
        setSelectedShiftType,
        copiedEmployeeNames,
        setCopiedEmployeeNames,
        copiedVehicleNames,
        setCopiedVehicleNames,
        setDraggingVehicleName,
      } = useMonthlyAssignmentSelectionContext();
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
      fontSize: 15,
      fontWeight: 700,
      textAlign: "center",
      verticalAlign: "middle",
      padding: "10px 8px",
      lineHeight: 1.4,
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
          textAlign: "center",
          verticalAlign: "middle",
          padding: "10px 8px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            minHeight: 80,
          }}
        >
          <span
            onClick={() => setEditingAssignment(assignment)}
            style={{
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: 17,
              fontWeight: 900,
              lineHeight: 1.4,
              textAlign: "center",
            }}
          >
            {assignment.site_name || "-"}
          </span>
        </div>
      </td>

      {!isMobile && (
  <td
    style={{
      ...td,
      ...stickyTd3,
      backgroundColor:
        assignment.shift_type === "night" ? "#e5e7eb" : "#fff",
      fontSize: 15,
      fontWeight: 700,
      textAlign: "center",
      verticalAlign: "middle",
      padding: "10px 8px",
      lineHeight: 1.4,
    }}
  >
    {assignment.manager_name || "-"}
  </td>
)}

<td
  style={{
    ...td,
    position: "sticky",
    left: isMobile ? 0 : 310, // ←重要
    zIndex: 15,

    fontWeight: 800,
    color: assignment.shift_type === "night" ? "#fff" : "#111",
    backgroundColor:
      assignment.shift_type === "night"
        ? "#374151"
        : "#f3f4f6",

    textAlign: "center",
    verticalAlign: "middle",
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
export default React.memo(AssignmentRowContent);