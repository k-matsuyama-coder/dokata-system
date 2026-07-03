"use client";

import { useMemo } from "react";
import BackButton from "@/app/components/BackButton";
import AddTwoMonthAssignmentModal from "./components/AddAssignmentModal";
import EditTwoMonthAssignmentModal from "./components/EditAssignmentModal";
import TwoMonthToolbar from "./components/Toolbar";
import { useUndoRedo } from "./hooks/useUndoRedo";
import TwoMonthTable from "./components/Table";
import { useTwoMonthPage } from "./hooks/usePage";
import { useRealtime } from "./hooks/useRealtime";
import { useDailyInfo } from "./hooks/useDailyInfo";
import { useAssignmentActions } from "./hooks/useAssignmentActions";
import { useDetailTags } from "./hooks/useDetailTags";
import { useDetailHistory } from "./hooks/useDetailHistory";
import MobileView from "./components/MobileView";
import { useAssignmentGroups } from "../month/hooks/useAssignmentGroups";

import {
  getBandColor,
  getDailyTotal,
  getMonthlyTotal,
  getSortedAssignments,
  getGroupedAssignments,
} from "./utils/tableUtils";

import { inputStyle, smallButton } from "./styles";

export default function TwoMonthPage() {
  const {
    assignments,
    setAssignments,
    assignmentFiles,
    setAssignmentFiles,
    dailyInfos,
    setDailyInfos,
    siteMembers,
    setSiteMembers,
    employees,
    contractors,
    contractorContacts,
    organizationId,
    baseMonth,
    setBaseMonth,
    days,
    fetchData,

    siteName,
    setSiteName,
    contractorName,
    setContractorName,
    managerName,
    setManagerName,
    contactPhone,
    setContactPhone,
    address,
    setAddress,
    shiftType,
    setShiftType,
    meetingTime,
    setMeetingTime,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    showAddModal,
    setShowAddModal,
    editingAssignment,
    setEditingAssignment,
    newFiles,
    setNewFiles,
    groupKey,
    setGroupKey,
    sortMode,
    setSortMode,
    draggingAssignmentId,
    setDraggingAssignmentId,

    undoStack,
    setUndoStack,
    redoStack,
    setRedoStack,
    isUndoRedo,
    setIsUndoRedo,
  } = useTwoMonthPage();

  const { enabledGroups, groupSettings, groupNameMap } = useAssignmentGroups();

  useRealtime(fetchData, baseMonth);

  const detailHistory = useDetailHistory(dailyInfos);

  const sortedAssignments = getSortedAssignments(assignments, days, sortMode);

  const groupedAssignments = getGroupedAssignments(
    sortedAssignments,
    groupNameMap,
    groupSettings
  );

  const {
    uploadFiles,
    updateAssignment,
    deleteAssignment,
    deleteAssignmentFile,
    moveAssignmentRow,
    handleAddSite,
  } = useAssignmentActions({
    organizationId,
    days,
    siteName,
    contractorName,
    managerName,
    contactPhone,
    address,
    shiftType,
    meetingTime,
    startDate,
    endDate,
    groupKey,
    newFiles,
    editingAssignment,
    sortedAssignments,
    setSiteName,
    setContractorName,
    setManagerName,
    setContactPhone,
    setAddress,
    setShiftType,
    setMeetingTime,
    setGroupKey,
    setStartDate,
    setEndDate,
    setShowAddModal,
    setNewFiles,
    setEditingAssignment,
    setAssignments,
    setAssignmentFiles,
    setDailyInfos,
    setSiteMembers,
    fetchData,
  });

  const { updateDailyInfo } = useDailyInfo({
    organizationId,
    dailyInfos,
    setDailyInfos,
    isUndoRedo,
    setUndoStack,
    setRedoStack,
  });

  const {
    getPlannedCount,
    getDetailTags,
    addDetailTag,
    removeDetailTag,
  } = useDetailTags({
    dailyInfos,
    updateDailyInfo,
  });

  useUndoRedo({
    undoStack,
    redoStack,
    setUndoStack,
    setRedoStack,
    setIsUndoRedo,
    updateDailyInfo,
  });

  return (
    <div style={{ padding: 16 }}>
      <BackButton />

      <h1>2ヶ月工程表</h1>

      <datalist id="detail-history">
        {detailHistory.map((detail) => (
          <option key={detail} value={detail} />
        ))}
      </datalist>

      <TwoMonthToolbar
        baseMonth={baseMonth}
        setBaseMonth={setBaseMonth}
        sortMode={sortMode}
        setSortMode={setSortMode}
        setShowAddModal={setShowAddModal}
        smallButton={smallButton}
      />

      <AddTwoMonthAssignmentModal
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        contractors={contractors}
        contractorContacts={contractorContacts}
        contractorName={contractorName}
        setContractorName={setContractorName}
        siteName={siteName}
        setSiteName={setSiteName}
        groupKey={groupKey}
        setGroupKey={setGroupKey}
        enabledGroups={enabledGroups}
        managerName={managerName}
        setManagerName={setManagerName}
        contactPhone={contactPhone}
        setContactPhone={setContactPhone}
        address={address}
        setAddress={setAddress}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        shiftType={shiftType}
        setShiftType={setShiftType}
        meetingTime={meetingTime}
        setMeetingTime={setMeetingTime}
        addFiles={newFiles}
        setAddFiles={setNewFiles}
        inputStyle={inputStyle}
        handleAddSite={handleAddSite}
      />

      <EditTwoMonthAssignmentModal
        editingAssignment={editingAssignment}
        setEditingAssignment={setEditingAssignment}
        inputStyle={inputStyle}
        assignmentFiles={assignmentFiles}
        enabledGroups={enabledGroups}
        updateAssignment={updateAssignment}
        uploadFiles={uploadFiles}
        deleteAssignmentFile={deleteAssignmentFile}
        deleteAssignment={deleteAssignment}
      />

      <div className="desktop-view">
      <TwoMonthTable
  days={days}
  employees={employees}
  groupedAssignments={groupedAssignments}
  sortMode={sortMode}
  draggingAssignmentId={draggingAssignmentId}
  setDraggingAssignmentId={setDraggingAssignmentId}
  setEditingAssignment={setEditingAssignment}
  moveAssignmentRow={moveAssignmentRow}
  deleteAssignment={deleteAssignment}
  getDailyTotal={(date) => getDailyTotal(dailyInfos, date)}
  getMonthlyTotal={(assignmentId, index) =>
    getMonthlyTotal(dailyInfos, baseMonth, assignmentId, index)
  }
  getPlannedCount={getPlannedCount}
  getBandColor={(assignment) => getBandColor(assignment, groupSettings)}
  getDetailTags={getDetailTags}
  removeDetailTag={removeDetailTag}
  addDetailTag={addDetailTag}
  updateDailyInfo={updateDailyInfo}
  groupNameMap={groupNameMap}
/>
      </div>

      <div className="mobile-view">
        <MobileView
          days={days}
          groupedAssignments={groupedAssignments}
          getPlannedCount={getPlannedCount}
          updateDailyInfo={updateDailyInfo}
        />
      </div>

      <style jsx>{`
        .mobile-view {
          display: none;
        }

        @media (max-width: 768px) {
          .desktop-view {
            display: none;
          }

          .mobile-view {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}