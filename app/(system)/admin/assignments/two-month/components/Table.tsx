// app/(system)/admin/assignments/two-month/components/Table.tsx
"use client";

import React, { useCallback, useRef } from "react";
import TwoMonthTableHeader from "./TableHeader";
import TwoMonthAssignmentRow from "./AssignmentRow";
import type { Assignment, AssignmentGroupKey, Employee } from "../types";

type GroupedAssignment = {
  label: string;
  rows: Assignment[];
  color: string;
};

type Props = {
  days: string[];
  employees: Employee[];
  groupedAssignments: GroupedAssignment[];
  sortMode: string;
  draggingAssignmentId: string | null;
  setDraggingAssignmentId: React.Dispatch<React.SetStateAction<string | null>>;
  setEditingAssignment: React.Dispatch<React.SetStateAction<Assignment | null>>;
  moveAssignmentRow: (fromAssignmentId: string, toAssignmentId: string) => void;
  deleteAssignment: (id: string) => void;
  getDailyTotal: (date: string) => {
    total: number;
    first: number;
    second: number;
    third: number;
  };
  getMonthlyTotal: (assignmentId: string, index: 0 | 1) => number;
  getPlannedCount: (assignmentId: string, workDate: string) => number | "";
  getBandColor: (assignment: Assignment) => string;
  getDetailTags: (assignmentId: string, workDate: string) => string[];
  removeDetailTag: (
    assignmentId: string,
    workDate: string,
    tag: string
  ) => void;
  addDetailTag: (
    assignmentId: string,
    workDate: string,
    tag: string
  ) => void;
  updateDailyInfo: (
    assignmentId: string,
    workDate: string,
    field: "planned_count" | "detail",
    value: string
  ) => void;
  groupNameMap: Map<AssignmentGroupKey, string>;
};

const AUTO_SCROLL_EDGE = 72;
const AUTO_SCROLL_STEP = 28;

export default function TwoMonthTable({
  days,
  employees,
  groupedAssignments,
  sortMode,
  draggingAssignmentId,
  setDraggingAssignmentId,
  setEditingAssignment,
  moveAssignmentRow,
  deleteAssignment,
  getDailyTotal,
  getMonthlyTotal,
  getPlannedCount,
  getBandColor,
  getDetailTags,
  removeDetailTag,
  addDetailTag,
  updateDailyInfo,
  groupNameMap,
}: Props) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const handleAutoScroll = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const { clientX, clientY } = event;

      const distanceToTop = clientY - rect.top;
      const distanceToBottom = rect.bottom - clientY;
      const distanceToLeft = clientX - rect.left;
      const distanceToRight = rect.right - clientX;

      if (distanceToTop < AUTO_SCROLL_EDGE) {
        const ratio = (AUTO_SCROLL_EDGE - distanceToTop) / AUTO_SCROLL_EDGE;
        container.scrollTop -= Math.ceil(AUTO_SCROLL_STEP * ratio);
      } else if (distanceToBottom < AUTO_SCROLL_EDGE) {
        const ratio = (AUTO_SCROLL_EDGE - distanceToBottom) / AUTO_SCROLL_EDGE;
        container.scrollTop += Math.ceil(AUTO_SCROLL_STEP * ratio);
      }

      if (distanceToLeft < AUTO_SCROLL_EDGE) {
        const ratio = (AUTO_SCROLL_EDGE - distanceToLeft) / AUTO_SCROLL_EDGE;
        container.scrollLeft -= Math.ceil(AUTO_SCROLL_STEP * ratio);
      } else if (distanceToRight < AUTO_SCROLL_EDGE) {
        const ratio = (AUTO_SCROLL_EDGE - distanceToRight) / AUTO_SCROLL_EDGE;
        container.scrollLeft += Math.ceil(AUTO_SCROLL_STEP * ratio);
      }
    },
    []
  );

  return (
    <div
      ref={scrollContainerRef}
      onDragOver={handleAutoScroll}
      style={{
        overflow: "auto",
        maxHeight: "calc(100vh - 180px)",
        border: "1px solid #ddd",
        borderRadius: 12,
        backgroundColor: "#fff",
      }}
    >
      <table
        style={{
          borderCollapse: "separate",
          borderSpacing: 0,
          minWidth: 2200,
          width: "100%",
          fontSize: 12,
        }}
      >
        <TwoMonthTableHeader
          days={days}
          employees={employees}
          getDailyTotal={getDailyTotal}
        />

        <tbody>
          {groupedAssignments.map((group) => (
            <React.Fragment key={group.label}>
              <tr>
                <td
                  colSpan={days.length + 3}
                  style={{
                    backgroundColor: group.color,
                    fontWeight: 900,
                    fontSize: 16,
                    padding: 10,
                    border: "1px solid #ddd",
                    textAlign: "left",
                    position: "sticky",
                    top: 50,
                    left: 0,
                    zIndex: 50,
                  }}
                >
                  {group.label}
                </td>
              </tr>

              {group.rows.map((assignment) => (
                <TwoMonthAssignmentRow
                  key={assignment.id}
                  assignment={assignment}
                  days={days}
                  sortMode={sortMode}
                  draggingAssignmentId={draggingAssignmentId}
                  setDraggingAssignmentId={setDraggingAssignmentId}
                  setEditingAssignment={setEditingAssignment}
                  moveAssignmentRow={moveAssignmentRow}
                  deleteAssignment={deleteAssignment}
                  getMonthlyTotal={getMonthlyTotal}
                  getPlannedCount={getPlannedCount}
                  getBandColor={getBandColor}
                  getDetailTags={getDetailTags}
                  removeDetailTag={removeDetailTag}
                  addDetailTag={addDetailTag}
                  updateDailyInfo={updateDailyInfo}
                  groupNameMap={groupNameMap}
                />
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}