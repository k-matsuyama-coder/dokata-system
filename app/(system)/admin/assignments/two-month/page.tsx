"use client";

import { useEffect, useMemo, useState } from "react";
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
import AssignmentPageLinks from "@/app/components/AssignmentPageLinks";

import {
  getBandColor,
  getSortedAssignments,
  getGroupedAssignments,
} from "./utils/tableUtils";

import { inputStyle, smallButton } from "./styles";

export default function TwoMonthPage() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");

    const updateViewport = () => {
      setIsMobile(mediaQuery.matches);
    };

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => {
      mediaQuery.removeEventListener("change", updateViewport);
    };
  }, []);

  const {
    groupSettings,
    assignments,
    setAssignments,
    dateMemos,
onSaveDateMemo,
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

  const enabledGroups = useMemo(
    () => groupSettings.filter((group) => group.is_enabled),
    [groupSettings]
  );

  const groupNameMap = useMemo(
    () =>
      new Map(
        groupSettings.map((group) => [
          group.group_key,
          group.display_name,
        ])
      ),
    [groupSettings]
  );

  useRealtime(
    fetchData,
    baseMonth,
    organizationId,
    setDailyInfos
  );

  const detailHistory = useDetailHistory(dailyInfos);

  const sortedAssignments = useMemo(
    () =>
      getSortedAssignments(
        assignments,
        days,
        sortMode
      ),
    [assignments, days, sortMode]
  );
  
  const groupedAssignments = useMemo(
    () =>
      getGroupedAssignments(
        sortedAssignments,
        groupNameMap,
        groupSettings
      ),
    [sortedAssignments, groupNameMap, groupSettings]
  );

  const {
    monthlyTotalMap,
    previousMonthTotal,
    nextMonthTotal,
    dailyTotalMap,
  } = useMemo(() => {
    const assignmentMap = new Map(
      assignments.map((item) => [item.id, item])
    );

    const monthlyTotalMap = new Map<string, [number, number]>(
      assignments.map((item) => [item.id, [0, 0]])
    );

    const dailyTotalMap = new Map(
      days.map((date) => [
        date,
        { total: 0, first: 0, second: 0, third: 0 },
      ])
    );

    const [year, month] = baseMonth.split("-").map(Number);
    const next = new Date(year, month, 1);
    const nextMonth =
      `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;

    let previousMonthTotal = 0;
    let nextMonthTotal = 0;

    for (const info of dailyInfos) {
      const assignment = assignmentMap.get(info.assignment_id);
      if (!assignment) continue;

      if (
        assignment.start_date &&
        info.work_date < assignment.start_date
      ) continue;

      if (
        assignment.end_date &&
        info.work_date > assignment.end_date
      ) continue;

      const count = info.planned_count ?? 0;
      const monthKey = info.work_date.slice(0, 7);
      const totals = monthlyTotalMap.get(assignment.id)!;

      if (monthKey === baseMonth) {
        totals[0] += count;
        previousMonthTotal += count;
      } else if (monthKey === nextMonth) {
        totals[1] += count;
        nextMonthTotal += count;
      }

      const daily = dailyTotalMap.get(info.work_date);

      if (daily) {
        daily.total += count;

        const group = assignment.group_key ?? "group1";
        if (group === "group1") daily.first += count;
        if (group === "group2") daily.second += count;
        if (group === "group3") daily.third += count;
      }
    }

    return {
      monthlyTotalMap,
      previousMonthTotal,
      nextMonthTotal,
      dailyTotalMap,
    };
  }, [assignments, dailyInfos, baseMonth, days]);

  const {
    uploadFiles,
    updateAssignment,
    updateAssignmentMemo,
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
    <div
      style={{
        padding: isMobile ? 8 : 16,
        backgroundColor: "#f5f6f8",
        minHeight: "100dvh",
      }}
    >
      <AssignmentPageLinks />

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

      {isMobile === false && (
      <TwoMonthTable
  days={days}
  employees={employees}
  groupSettings={groupSettings}
  dateMemos={dateMemos}
onSaveDateMemo={onSaveDateMemo}
  groupedAssignments={groupedAssignments}
  sortMode={sortMode}
  draggingAssignmentId={draggingAssignmentId}
  setDraggingAssignmentId={setDraggingAssignmentId}
  setEditingAssignment={setEditingAssignment}
  moveAssignmentRow={moveAssignmentRow}
  deleteAssignment={deleteAssignment}
  getDailyTotal={(date) =>
    dailyTotalMap.get(date) ?? {
      total: 0,
      first: 0,
      second: 0,
      third: 0,
    }
  }
  dailyInfos={dailyInfos}
  getMonthlyTotal={(assignmentId, index) =>
    monthlyTotalMap.get(assignmentId)?.[index] ?? 0
  }
  previousMonthTotal={previousMonthTotal}
nextMonthTotal={nextMonthTotal}
  getPlannedCount={getPlannedCount}
  getBandColor={(assignment) => getBandColor(assignment, groupSettings)}
  getDetailTags={getDetailTags}
  removeDetailTag={removeDetailTag}
  addDetailTag={addDetailTag}
  updateDailyInfo={updateDailyInfo}
  updateAssignmentMemo={updateAssignmentMemo}
  groupNameMap={groupNameMap}
/>
      )}

{isMobile === true && (
        <MobileView
          days={days}
          groupedAssignments={groupedAssignments}
          getPlannedCount={getPlannedCount}
          updateDailyInfo={updateDailyInfo}
        />
        )}
    </div>
  );
}