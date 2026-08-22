"use client";

import React, { useState } from "react";

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
    field: "planned_count" | "detail" | "memo" | "vehicle_names",
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

  editingUsers: {
    userId: string;
    userName: string;
    cellKey: string;
    startedAt: string;
  }[];
  startEditing: (cellKey: string) => void | Promise<void>;
  stopEditing: () => void | Promise<void>;
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
  editingUsers,
  startEditing,
  stopEditing,
}: Props) {
const [isMemoHovered, setIsMemoHovered] = useState(false);
const [isMemoEditing, setIsMemoEditing] = useState(false);
const [memoDraft, setMemoDraft] = useState("");
const [isMemoPreviewVisible, setIsMemoPreviewVisible] = useState(false);
  return (
    <div
    onMouseEnter={() => {
      setIsMemoHovered(true);
      setIsMemoPreviewVisible(true);
    }}
    onMouseLeave={() => {
      setIsMemoHovered(false);
      setIsMemoPreviewVisible(false);
    }}
  style={{
    position: "relative",
    display: "grid",
    gap: 4,
  }}
>

{isMemoHovered && !isMemoEditing && !dailyInfo?.memo && (
  <button
    type="button"
    onClick={(event) => {
      event.stopPropagation();
      setMemoDraft("");
      setIsMemoEditing(true);
    }}
    aria-label="メモを追加"
    style={{
      position: "absolute",
      top: 4,
      right: 4,
      zIndex: 10,
      padding: 2,
      border: "none",
      borderRadius: 4,
      backgroundColor: "#fff",
      cursor: "pointer",
      fontSize: 14,
    }}
  >
    💬
  </button>
)}

{dailyInfo?.memo && !isMemoEditing && (
  <div
  title={dailyInfo.memo}
  onClick={() => {
    setMemoDraft(dailyInfo.memo ?? "");
    setIsMemoEditing(true);
  }}
  style={{
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: "50%",
    backgroundColor: "#2563eb",
    zIndex: 10,
    cursor: "pointer",
  }}
/>
)}

{isMemoPreviewVisible && dailyInfo?.memo && !isMemoEditing && (
  <div
    onClick={() => {
      setMemoDraft(dailyInfo.memo ?? "");
      setIsMemoEditing(true);
    }}
    style={{
      position: "absolute",
      top: 4,
      left: "calc(100% + 8px)",
      width: 240,
      padding: 10,
      backgroundColor: "#fff",
      border: "1px solid #ccc",
      borderRadius: 8,
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      whiteSpace: "pre-wrap",
      fontSize: 12,
      zIndex: 1000,
      cursor: "pointer",
    }}
  >
    {dailyInfo.memo}
  </div>
)}

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
  flushDetailSave={flushDetailSave}
  updateDailyInfo={updateDailyInfo}
  editingUsers={editingUsers}
  startEditing={startEditing}
  stopEditing={stopEditing}
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

{isMemoEditing && (
  <div
  onClick={(e) => e.stopPropagation()}
    style={{
      position: "absolute",
      top: 4,
      left: "calc(100% + 8px)",
      width: 240,
      padding: 10,
      backgroundColor: "#fff",
      border: "1px solid #ccc",
      borderRadius: 8,
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 1000,
    }}
  >
    <textarea
      value={memoDraft}
      onChange={(e) => setMemoDraft(e.target.value)}
      placeholder="メモを入力"
      style={{
        width: "100%",
        minHeight: 100,
        resize: "vertical",
      }}
    />

    <button
      type="button"
      onClick={async () => {
        await updateDailyInfo(
          assignment.id,
          date,
          "memo",
          memoDraft
        );
      
        setIsMemoEditing(false);
        setIsMemoPreviewVisible(false);
        setMemoDraft("");
      }}
      style={{
        marginTop: 8,
        width: "100%",
        padding: "6px 0",
        border: "none",
        borderRadius: 6,
        backgroundColor: "#2563eb",
        color: "#fff",
        cursor: "pointer",
        fontWeight: 700,
      }}
    >
      保存
    </button>
  </div>
)}
    </div>
  );
}
export default React.memo(AssignmentCellContent);