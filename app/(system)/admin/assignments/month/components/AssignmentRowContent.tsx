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

function AssignmentRowContent({ assignment }: Props) {
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
    flushDetailSave,
    getEditingUsers,
    startEditing,
    stopEditing,
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

  const canDragRow = !isMobile && sortMode === "manual";

  const handleAssignmentDragStart = () => {
    if (!canDragRow) return;
    setDraggingAssignmentId(assignment.id);
  };

  const handleAssignmentDragEnd = () => {
    setDraggingAssignmentId(null);
  };

  const handleAssignmentDragOver = (
    e: React.DragEvent<HTMLTableCellElement>
  ) => {
    if (!canDragRow) return;
    e.preventDefault();
  };

  const handleAssignmentDrop = () => {
    if (!canDragRow) return;
    if (!draggingAssignmentId) return;
    if (draggingAssignmentId === assignment.id) return;

    moveAssignmentRow(draggingAssignmentId, assignment.id);
  };

  const rowDropHighlight =
    canDragRow && draggingAssignmentId && draggingAssignmentId !== assignment.id;

    const fixedCellBackground =
    draggingAssignmentId === assignment.id
      ? "#dbeafe"
      : rowDropHighlight
        ? "#eff6ff"
        : assignment.shift_type === "night"
          ? "#c3d1e6"
          : "#fff";

  return (
    <AssignmentRow
      style={{
        backgroundColor: assignment.shift_type === "night" ? "#f3f4f6" : "#fff",
      }}
    >
      {!isMobile && (
        <td
          draggable={canDragRow}
          onDragStart={handleAssignmentDragStart}
          onDragEnd={handleAssignmentDragEnd}
          onDragOver={handleAssignmentDragOver}
          onDrop={handleAssignmentDrop}
          style={{
            ...td,
            ...stickyTd1,
            backgroundColor: fixedCellBackground,
            fontSize: 15,
            fontWeight: 700,
            textAlign: "center",
            verticalAlign: "middle",
            padding: "10px 8px",
            lineHeight: 1.4,
            cursor: canDragRow ? "grab" : "default",
          }}
        >
          {assignment.contractor_name || "-"}
        </td>
      )}

      <td
        draggable={canDragRow}
        onDragStart={handleAssignmentDragStart}
        onDragEnd={handleAssignmentDragEnd}
        onDragOver={handleAssignmentDragOver}
        onDrop={handleAssignmentDrop}
        style={{
          ...td,
          ...stickyTd2,
          left: isMobile ? 0 : 70,
          fontWeight: 800,
          cursor: canDragRow ? "grab" : "pointer",
          backgroundColor: fixedCellBackground,
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
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            minHeight: 80,
          }}
        >
          {canDragRow && (
            <span
              title="ドラッグして上下移動"
              style={{
                fontSize: 18,
                lineHeight: 1,
                opacity: 0.55,
                userSelect: "none",
              }}
            >
              ☰
            </span>
          )}

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
          draggable={canDragRow}
          onDragStart={handleAssignmentDragStart}
          onDragEnd={handleAssignmentDragEnd}
          onDragOver={handleAssignmentDragOver}
          onDrop={handleAssignmentDrop}
          style={{
            ...td,
            ...stickyTd3,
            backgroundColor: fixedCellBackground,
            fontSize: 15,
            fontWeight: 700,
            textAlign: "center",
            verticalAlign: "middle",
            padding: "10px 8px",
            lineHeight: 1.4,
            cursor: canDragRow ? "grab" : "default",
          }}
        >
          {assignment.manager_name || "-"}
        </td>
      )}

      <td
        draggable={canDragRow}
        onDragStart={handleAssignmentDragStart}
        onDragEnd={handleAssignmentDragEnd}
        onDragOver={handleAssignmentDragOver}
        onDrop={handleAssignmentDrop}
        style={{
          ...td,
          position: "sticky",
          left: isMobile ? 0 : 310,
          zIndex: 15,
          fontWeight: 800,
          color: assignment.shift_type === "night" ? "#fff" : "#111",
          backgroundColor:
            draggingAssignmentId === assignment.id
              ? "#dbeafe"
              : rowDropHighlight
              ? "#eff6ff"
              : assignment.shift_type === "night"
              ? "#374151"
              : "#f3f4f6",
          textAlign: "center",
          verticalAlign: "middle",
          cursor: canDragRow ? "grab" : "default",
        }}
      >
        {assignment.shift_type === "night" ? "夜" : "昼"}
      </td>

      {days.map((date) => {
        const cellMembers = getCellMembers(assignment.id, date);
        const dailyInfo = getDailyInfo(assignment.id, date);
        const detailCellKey = `${assignment.id}_${date}_detail`;
        const isOutOfPeriod = isOutOfAssignmentPeriod(
          date,
          assignment.start_date,
          assignment.end_date
        );

        const plannedCount = dailyInfo?.planned_count ?? null;
        const memberCount = cellMembers.length;

        const isPlannedCountEmpty =
  plannedCount === null || plannedCount === undefined;
const shouldFadeText = isOutOfPeriod || isPlannedCountEmpty;

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
                moveSiteMember(draggingSiteMemberId, assignment.id, date);
                return;
              }

              if (draggingEmployeeName) {
                addEmployeeToCell(draggingEmployeeName, assignment.id, date);
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
                addVehicleToCell(draggingVehicleName, assignment.id, date);
                setDraggingVehicleName(null);
              }
            }}
            onClick={(e) => {
              if (isOutOfPeriod) return;

              setSelectedDate(date);
              setSelectedShiftType(assignment.shift_type ?? "day");

              if (selectedSiteMemberId) {
                moveSiteMember(selectedSiteMemberId, assignment.id, date);
                setSelectedSiteMemberId(null);
                return;
              }

              if (selectedEmployeeName) {
                addEmployeeToCell(selectedEmployeeName, assignment.id, date);
                setSelectedEmployeeName(null);

                if (isMobile) {
                  setShowMemberModal(false);
                }

                return;
              }

              if (copiedEmployeeNames.length > 0) {
                const isMultiPaste = copiedEmployeeNames.length > 1;

                copiedEmployeeNames.forEach((name) => {
                  addEmployeeToCell(name, assignment.id, date, !isMultiPaste);
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
                ? "#d1d5db"
                : baseCellStyle.backgroundColor,
              backgroundImage: isOutOfPeriod
                ? "repeating-linear-gradient(135deg, rgba(255,255,255,0.28) 0px, rgba(255,255,255,0.28) 8px, transparent 8px, transparent 16px)"
                : "none",
              opacity: 1,
            }}
          >
      
<div
  style={{
    opacity: shouldFadeText ? 0.45 : 1,
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
    flushDetailSave={flushDetailSave}
    removeVehicleFromCell={removeVehicleFromCell}
    deleteSiteMember={deleteSiteMember}
    toggleForeman={toggleForeman}
    editingUsers={getEditingUsers(detailCellKey)}
startEditing={startEditing}
stopEditing={stopEditing}
  />
</div>

          </AssignmentCell>
        );
      })}
    </AssignmentRow>
  );
}

export default React.memo(AssignmentRowContent);