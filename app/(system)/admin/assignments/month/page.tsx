"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
import BackButton from "@/app/components/BackButton";
import AssignmentEditModal from "./components/AssignmentEditModal";
import AddAssignmentModal from "./components/AddAssignmentModal";
import MemberPanel from "./components/MemberPanel";
import MonthlyAssignmentsTable from "./components/MonthlyAssignmentsTable";
import AssignmentToolbar from "./components/AssignmentToolbar";
import { useResponsive } from "./hooks/useResponsive";
import MobileMemberModal from "./components/MobileMemberModal";
import AssignmentGroups from "./components/AssignmentGroups";
import { useMonthlyAssignmentCalendar } from "./hooks/useMonthlyAssignmentCalendar";
import { useMonthlyAssignmentData } from "./hooks/useMonthlyAssignmentData";
import { useMonthlyAssignmentAdmin } from "./hooks/useMonthlyAssignmentAdmin";
import { useMonthlyAssignmentRealtime } from "./hooks/useMonthlyAssignmentRealtime";
import { useMonthlyAssignmentActions } from "./hooks/useMonthlyAssignmentActions";
import { useMonthlyAssignmentMembers } from "./hooks/useMonthlyAssignmentMembers";
import { useMonthlyAssignmentVehicles } from "./hooks/useMonthlyAssignmentVehicles";
import { useMonthlyAssignmentDailyInfo } from "./hooks/useMonthlyAssignmentDailyInfo";
import { useMonthlyAssignmentComputed } from "./hooks/useMonthlyAssignmentComputed";
import { useGroupedAssignments } from "./hooks/useGroupedAssignments";
import { useMonthlyAssignmentSelection } from "./hooks/useMonthlyAssignmentSelection";
import { useMonthlyAssignmentUI } from "./hooks/useMonthlyAssignmentUI";
import { useAddAssignmentForm } from "./hooks/useAddAssignmentForm";
import { useMonthlyAssignmentRows } from "./hooks/useMonthlyAssignmentRows";
import type { MonthlyAssignmentContextValue } from "./contexts/monthlyAssignmentContext";
import { MonthlyAssignmentContext } from "./contexts/monthlyAssignmentContext";
import {
  MonthlyAssignmentSelectionContext,
  type MonthlyAssignmentSelectionContextValue,
} from "./contexts/monthlyAssignmentSelectionContext";
import {
  MonthlyAssignmentActionContext,
  type MonthlyAssignmentActionContextValue,
} from "./contexts/monthlyAssignmentActionContext";
import { getWeekStart } from "./utils";

export default function MonthlyAssignmentsPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [weekStart, setWeekStart] = useState(getWeekStart);
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string | null>(null);

  const [creatingPublicLink, setCreatingPublicLink] = useState(false);
  const [publicViewMode, setPublicViewMode] = useState<"week" | "next3days">("next3days");

  const getCurrentOrganization = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
  
    if (token) {
      const res = await fetch("/api/current-organization", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (res.ok) {
        const result = await res.json();
        if (result.organizationId) {
          return result.organizationId as string;
        }
      }
    }
  
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
  
    if (!user) return null;
  
    const { data: employee } = await supabase
      .from("employees")
      .select("organization_id")
      .eq("auth_user_id", user.id)
      .single();
  
    return employee?.organization_id ?? null;
  };

  const getAccessToken = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData.session?.access_token ?? null;
  };

  const createPublicLink = async () => {
    try {
      setCreatingPublicLink(true);
  
      const token = await getAccessToken();
  
      if (!token) {
        alert("ログイン情報がありません");
        return;
      }
  
      const res = await fetch("/api/admin/public/assignments/create-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          expiresInDays: 7,
          viewMode: publicViewMode,
          baseDate: new Date().toISOString().slice(0, 10),
        }),
      });
  
      const result = await res.json();
      console.log("create public link result:", result);
  
      if (!res.ok || !result.success) {
        alert(result.message ?? JSON.stringify(result) ?? "公開URLの発行に失敗しました");
        return;
      }
  
      const publicUrl = result.url as string;
  
      await navigator.clipboard.writeText(publicUrl);
      alert(`公開URLを発行しました\nコピー済み:\n${publicUrl}`);
    } catch (error) {
      console.error("createPublicLink error:", error);
      alert(error instanceof Error ? error.message : "公開URLの発行に失敗しました");
    } finally {
      setCreatingPublicLink(false);
    }
  };

  const {
    siteName,
    setSiteName,
    contractorName,
    setContractorName,
    shiftType,
    setShiftType,
    managerName,
    setManagerName,
    contactPhone,
    setContactPhone,
    address,
    setAddress,
    meetingTime,
    setMeetingTime,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    constructionType,
    setConstructionType,
    addFiles,
    setAddFiles,
  } = useAddAssignmentForm();

  const {
    showAddModal,
    setShowAddModal,
    showMemberModal,
    setShowMemberModal,
    editingAssignment,
    setEditingAssignment,
    sortMode,
    setSortMode,
    showFinished,
    setShowFinished,
  } = useMonthlyAssignmentUI();

  const {
    draggingAssignmentId,
    setDraggingAssignmentId,
    draggingEmployeeName,
    setDraggingEmployeeName,
    draggingSiteMemberId,
    setDraggingSiteMemberId,
    draggingVehicleName,
    setDraggingVehicleName,
    draggingVehicleFrom,
    setDraggingVehicleFrom,
    copiedVehicleNames,
    setCopiedVehicleNames,
    copiedEmployeeNames,
    setCopiedEmployeeNames,
    selectedEmployeeName,
    setSelectedEmployeeName,
    selectedSiteMemberId,
    setSelectedSiteMemberId,
    selectedDate,
    setSelectedDate,
    selectedShiftType,
    setSelectedShiftType,
  } = useMonthlyAssignmentSelection();

  useEffect(() => {
    const fetchOrganization = async () => {
      const organizationId = await getCurrentOrganization();

      if (!organizationId) {
        alert("会社情報が取得できません");
        return;
      }

      setCurrentOrganizationId(organizationId);
    };

    fetchOrganization();
  }, []);

  const { isMobile } = useResponsive();

  const {
    days,
    todayString,
    getDateHeaderStyle,
    getCellStyle,
  } = useMonthlyAssignmentCalendar({
    month,
    viewMode,
    weekStart,
    isMobile,
  });

  const {
    assignments,
    setAssignments,
    assignmentFiles,
    setAssignmentFiles,
    siteMembers,
    setSiteMembers,
    dailyInfos,
    setDailyInfos,
    shiftRequests,
    employees,
    vehicles,
    contractors,
    contractorContacts,
    fetchMasterData,
    fetchScheduleData,
    fetchData,
  } = useMonthlyAssignmentData({
    days,
    organizationId: currentOrganizationId,
  });

  useEffect(() => {
    void fetchMasterData();
  }, [fetchMasterData]);

  const {
    assignmentMap,
    getCellMembers,
    dailySummaryMap,
    getAssignmentCount,
    getUnassignedEmployeesByDate,
    isAssignedSameDateDifferentShift,
  } = useMonthlyAssignmentComputed({
    days,
    assignments,
    siteMembers,
    dailyInfos,
    employees,
    shiftRequests,
  });

  const {
    updateAssignment,
    uploadFiles,
    deleteAssignmentFile,
    handleAddSite,
    deleteAssignment,
  } = useMonthlyAssignmentActions({
    month,
    siteName,
    setSiteName,
    contractorName,
    setContractorName,
    shiftType,
    setShiftType,
    managerName,
    setManagerName,
    contactPhone,
    setContactPhone,
    address,
    setAddress,
    meetingTime,
    setMeetingTime,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    constructionType,
    setConstructionType,
    addFiles,
    setAddFiles,
    editingAssignment,
    setEditingAssignment,
    assignmentFiles,
    setAssignmentFiles,
    setAssignments,
    setSiteMembers,
    setShowAddModal,
    fetchData,
  });

  useMonthlyAssignmentAdmin({
    month,
    viewMode,
    weekStart,
    fetchData: fetchScheduleData,
  });

  useMonthlyAssignmentRealtime({
    month,
    viewMode,
    weekStart,
    fetchData: fetchScheduleData,
  });

  useEffect(() => {
    if (viewMode !== "week") return;
    setWeekStart(getWeekStart());
  }, [month, viewMode]);

  const { moveAssignmentRow } = useMonthlyAssignmentRows({
    organizationId: currentOrganizationId ?? "",
    assignments,
    setAssignments,
    fetchData,
  });

  const {
    getDailyInfo,
    updateDailyInfo,
    editingDetails,
    setEditingDetails,
    saveTimers,
    setSaveTimers,
  } = useMonthlyAssignmentDailyInfo({
    organizationId: currentOrganizationId ?? "",
    dailyInfos,
    setDailyInfos,
  });

  const {
    addEmployeeToCell,
    moveSiteMember,
    deleteSiteMember,
    toggleForeman,
  } = useMonthlyAssignmentMembers({
    organizationId: currentOrganizationId ?? "",
    siteMembers,
    setSiteMembers,
    getCellMembers,
    setDraggingEmployeeName,
    setDraggingSiteMemberId,
    setSelectedSiteMemberId,
    fetchData,
  });

  const {
    addVehicleToCell,
    removeVehicleFromCell,
    moveVehicleToCell,
  } = useMonthlyAssignmentVehicles({
    getDailyInfo,
    updateDailyInfo,
  });

  const inputStyle = {
    width: "100%",
    padding: 10,
    border: "1px solid #ccc",
    borderRadius: 8,
    fontSize: 15,
    boxSizing: "border-box" as const,
  };

  const groupedAssignments = useGroupedAssignments({
    assignments,
    sortMode,
    showFinished,
    days,
    todayString,
  });

  const assignmentContextValue = useMemo<MonthlyAssignmentContextValue>(
    () => ({
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
    }),
    [
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
      setShowMemberModal,
      setEditingAssignment,
    ]
  );

  const selectionContextValue = useMemo<MonthlyAssignmentSelectionContextValue>(
    () => ({
      draggingAssignmentId,
      setDraggingAssignmentId,
      draggingSiteMemberId,
      setDraggingSiteMemberId,
      draggingEmployeeName,
      setDraggingEmployeeName,
      draggingVehicleName,
      setDraggingVehicleName,
      draggingVehicleFrom,
      setDraggingVehicleFrom,
      selectedSiteMemberId,
      setSelectedSiteMemberId,
      selectedEmployeeName,
      setSelectedEmployeeName,
      selectedDate,
      setSelectedDate,
      selectedShiftType,
      setSelectedShiftType,
      copiedEmployeeNames,
      setCopiedEmployeeNames,
      copiedVehicleNames,
      setCopiedVehicleNames,
    }),
    [
      draggingAssignmentId,
      draggingSiteMemberId,
      draggingEmployeeName,
      draggingVehicleName,
      draggingVehicleFrom,
      selectedSiteMemberId,
      selectedEmployeeName,
      selectedDate,
      selectedShiftType,
      copiedEmployeeNames,
      copiedVehicleNames,
    ]
  );

  const actionContextValue = useMemo<MonthlyAssignmentActionContextValue>(
    () => ({
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
    }),
    [
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
    ]
  );

  if (!currentOrganizationId) {
    return <div style={{ padding: 16 }}>読み込み中...</div>;
  }

  return (
    <div style={{ padding: isMobile ? 8 : 16 }}>
      <BackButton />

      <div
        style={{
          width: "100%",
          paddingRight: isMobile ? 0 : 190,
          paddingBottom: isMobile ? 110 : 0,
        }}
      >
        <AssignmentToolbar
  month={month}
  setMonth={setMonth}
  viewMode={viewMode}
  setViewMode={setViewMode}
  weekStart={weekStart}
  setWeekStart={setWeekStart}
  sortMode={sortMode}
  setSortMode={setSortMode}
  showFinished={showFinished}
  setShowFinished={setShowFinished}
  setShowAddModal={setShowAddModal}
  onCreatePublicLink={createPublicLink}
  creatingPublicLink={creatingPublicLink}
  publicViewMode={publicViewMode}
  setPublicViewMode={setPublicViewMode}
/>

        <AddAssignmentModal
          showAddModal={showAddModal}
          setShowAddModal={setShowAddModal}
          contractors={contractors}
          contractorContacts={contractorContacts}
          contractorName={contractorName}
          setContractorName={setContractorName}
          siteName={siteName}
          setSiteName={setSiteName}
          constructionType={constructionType}
          setConstructionType={setConstructionType}
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
          addFiles={addFiles}
          setAddFiles={setAddFiles}
          inputStyle={inputStyle}
          handleAddSite={handleAddSite}
        />

        <AssignmentEditModal
          editingAssignment={editingAssignment}
          setEditingAssignment={setEditingAssignment}
          inputStyle={inputStyle}
          assignmentFiles={assignmentFiles}
          updateAssignment={updateAssignment}
          uploadFiles={uploadFiles}
          deleteAssignmentFile={deleteAssignmentFile}
          deleteAssignment={deleteAssignment}
        />

        <MonthlyAssignmentContext.Provider value={assignmentContextValue}>
          <MonthlyAssignmentSelectionContext.Provider value={selectionContextValue}>
            <MonthlyAssignmentActionContext.Provider value={actionContextValue}>
              <MonthlyAssignmentsTable
                isMobile={isMobile}
                viewMode={viewMode}
                days={days}
                dailySummaryMap={dailySummaryMap}
                assignmentMap={assignmentMap}
                getDateHeaderStyle={getDateHeaderStyle}
              >
                <tbody>
                  <AssignmentGroups groupedAssignments={groupedAssignments} />
                </tbody>
              </MonthlyAssignmentsTable>
            </MonthlyAssignmentActionContext.Provider>
          </MonthlyAssignmentSelectionContext.Provider>
        </MonthlyAssignmentContext.Provider>

        {isMobile && (selectedEmployeeName || copiedVehicleNames.length > 0) && (
          <div
            style={{
              position: "fixed",
              left: 16,
              right: 16,
              bottom: 72,
              padding: 10,
              borderRadius: 12,
              backgroundColor: "#fff",
              border: "1px solid #ddd",
              zIndex: 2000,
              fontSize: 13,
              fontWeight: 800,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            {selectedEmployeeName && <>選択中：{selectedEmployeeName}</>}
            {copiedVehicleNames.length > 0 && (
              <div>車両選択中：{copiedVehicleNames.join("、")}</div>
            )}
          </div>
        )}

        {isMobile && (
          <button
            type="button"
            onClick={() => setShowMemberModal(true)}
            style={{
              position: "fixed",
              left: 16,
              right: 16,
              bottom: 16,
              padding: 14,
              borderRadius: 999,
              border: "none",
              backgroundColor: "#111",
              color: "#fff",
              fontWeight: 800,
              fontSize: 16,
              zIndex: 2000,
            }}
          >
            メンバー・車両を選ぶ
          </button>
        )}

        {isMobile && (
          <MobileMemberModal
            show={showMemberModal}
            selectedDate={selectedDate}
            selectedShiftType={selectedShiftType}
            employees={employees}
            vehicles={vehicles}
            selectedEmployeeName={selectedEmployeeName}
            copiedVehicleNames={copiedVehicleNames}
            getUnassignedEmployeesByDate={getUnassignedEmployeesByDate}
            setShowMemberModal={setShowMemberModal}
            setSelectedEmployeeName={setSelectedEmployeeName}
            setSelectedSiteMemberId={setSelectedSiteMemberId}
            setCopiedEmployeeNames={setCopiedEmployeeNames}
            setCopiedVehicleNames={setCopiedVehicleNames}
          />
        )}

        <MemberPanel
          isMobile={isMobile}
          selectedDate={selectedDate}
          selectedShiftType={selectedShiftType}
          selectedEmployeeName={selectedEmployeeName}
          copiedEmployeeNames={copiedEmployeeNames}
          copiedVehicleNames={copiedVehicleNames}
          employees={employees}
          vehicles={vehicles}
          getUnassignedEmployeesByDate={getUnassignedEmployeesByDate}
          isAssignedSameDateDifferentShift={isAssignedSameDateDifferentShift}
          getAssignmentCount={getAssignmentCount}
          setSelectedDate={setSelectedDate}
          setSelectedEmployeeName={setSelectedEmployeeName}
          setSelectedSiteMemberId={setSelectedSiteMemberId}
          setDraggingEmployeeName={setDraggingEmployeeName}
          setDraggingVehicleName={setDraggingVehicleName}
          setCopiedEmployeeNames={setCopiedEmployeeNames}
          setCopiedVehicleNames={setCopiedVehicleNames}
        />

        <p style={{ color: "#666", fontSize: 13 }}>
          ※ メンバーを外す場合は、配置済みの名前をダブルクリックしてください。
        </p>
      </div>
    </div>
  );
}