"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import BackButton from "@/app/components/BackButton";
import { getDateAccentColors } from "@/app/(system)/admin/assignments/month/utils/dateColors";
import AssignmentViewModals from "./components/AssignmentViewModals";
import DetailPreview from "./components/DetailPreview";
import AssignmentSearchBar from "./components/AssignmentSearchBar";
import { useAssignmentViewBoard } from "./hooks/useAssignmentViewBoard";
import { useAssignmentMemberSearch } from "./hooks/useAssignmentMemberSearch";
import AssignmentViewToolbar from "./components/AssignmentViewToolbar";
import AssignmentViewTable from "./components/AssignmentViewTable";
import {
  useAssignmentViewData,
  type AssignmentFile,
} from "./hooks/useAssignmentViewData";
import { useAssignmentViewDate } from "./hooks/useAssignmentViewDate";

type AssignmentGroupKey =
  | "group1"
  | "group2"
  | "group3"
  | "group4"
  | "group5";

type FilterMode = "all" | AssignmentGroupKey;

function getWeekday(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  const weekday = parsed.getDay();
  return ["日", "月", "火", "水", "木", "金", "土"][weekday] ?? "";
}

export default function AssignmentViewPage() {
  const {
    date,
    setDate,
    viewMode,
    displayDates,
    movePrev,
    moveNext,
    moveToday,
    changeViewMode,
  } = useAssignmentViewDate();
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const [detailModalAssignment, setDetailModalAssignment] = useState<{
    site_name: string | null;
    contractor_name: string | null;
    manager_name: string | null;
    contact_phone: string | null;
    address: string | null;
    shift_type: string | null;
    files: AssignmentFile[];
  } | null>(null);

  const [detailTextModal, setDetailTextModal] = useState<{
    title: string;
    text: string;
  } | null>(null);

  const [isMobile, setIsMobile] = useState(false);

  const pdfRef = useRef<HTMLDivElement>(null);
  const matchElementMapRef = useRef<Record<string, HTMLDivElement | null>>({});
const tableScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);

    return () => {
      window.removeEventListener("resize", updateIsMobile);
    };
  }, []);

  const {
    assignments,
    siteMembers,
    dailyInfos,
    assignmentFiles,
    groupSettings,
  } = useAssignmentViewData({
    displayDates,
    date,
    viewMode,
  });

  const enabledGroups = useMemo(() => {
    return [...groupSettings]
      .filter((group) => group.is_enabled)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [groupSettings]);

  const {
    getMembers,
    getDailyInfo,
    groupedVisibleAssignments,
  } = useAssignmentViewBoard({
    assignments,
    siteMembers,
    dailyInfos,
    displayDates,
    enabledGroups,
    filterMode,
  });

  const {
    activeMatchIndex,
    memberSearchMatches,
    memberSearchMatchKeySet,
    goToNextMatch,
    goToPrevMatch,
    highlightMemberName,
  } = useAssignmentMemberSearch({
    memberSearchQuery,
    groupedVisibleAssignments,
    displayDates,
    getMembers,
    matchElementMapRef,
    tableScrollRef,
  });

  const toTelHref = (phone: string) => {
    return `tel:${phone.replace(/[^\d+]/g, "")}`;
  };

  const downloadImage = async () => {
    const html2canvas = (await import("html2canvas")).default;
  
    if (!pdfRef.current) return;
  
    try {
      setIsExportingImage(true);
  
      await new Promise((resolve) => setTimeout(resolve, 80));
  
      const canvas = await html2canvas(pdfRef.current, {
        scale: 1.6,
        backgroundColor: "#f5f6f8",
        useCORS: true,
      });
  
      const link = document.createElement("a");
      link.download = `番割_${date}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
    } finally {
      setIsExportingImage(false);
    }
  };

  return (
    <div
      style={{
        padding: isMobile ? 10 : 16,
        background: "linear-gradient(180deg, #f3f4f6 0%, #eef2f7 100%)",
        minHeight: "100vh",
      }}
    >
      <BackButton />

      <h1 style={{ marginBottom: 12 }}>番割</h1>

      <AssignmentViewToolbar
  date={date}
  setDate={setDate}
  viewMode={viewMode}
  filterMode={filterMode}
  setFilterMode={setFilterMode}
  enabledGroups={enabledGroups}
  movePrev={movePrev}
  moveNext={moveNext}
  moveToday={moveToday}
  changeViewMode={changeViewMode}
  downloadImage={downloadImage}
/>

      <AssignmentSearchBar
  memberSearchQuery={memberSearchQuery}
  setMemberSearchQuery={setMemberSearchQuery}
  memberSearchMatchesLength={memberSearchMatches.length}
  activeMatchIndex={activeMatchIndex}
  goToPrevMatch={goToPrevMatch}
  goToNextMatch={goToNextMatch}
/>

<AssignmentViewTable
  pdfRef={pdfRef}
  tableScrollRef={tableScrollRef}
  isMobile={isMobile}
  isExportingImage={isExportingImage}
  displayDates={displayDates}
  groupedVisibleAssignments={groupedVisibleAssignments}
  assignmentFiles={assignmentFiles}
  memberSearchMatches={memberSearchMatches}
  activeMatchIndex={activeMatchIndex}
  memberSearchMatchKeySet={memberSearchMatchKeySet}
  matchElementMapRef={matchElementMapRef}
  getWeekday={getWeekday}
  getMembers={getMembers}
  getDailyInfo={getDailyInfo}
  highlightMemberName={highlightMemberName}
  setDetailModalAssignment={setDetailModalAssignment}
  setDetailTextModal={setDetailTextModal}
/>

      <AssignmentViewModals
        detailModalAssignment={detailModalAssignment}
        setDetailModalAssignment={setDetailModalAssignment}
        detailTextModal={detailTextModal}
        setDetailTextModal={setDetailTextModal}
        toTelHref={toTelHref}
      />
    </div>
  );
}
