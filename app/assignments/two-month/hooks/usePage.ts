import { useEffect, useMemo, useState } from "react";
import { fetchTwoMonthData } from "../api";

import type {
  Assignment,
  AssignmentFile,
  Contractor,
  ContractorContact,
  DailyInfo,
  Employee,
  SiteMember,
} from "../types";

type HistoryItem = {
  assignmentId: string;
  workDate: string;
  before: string;
  after: string;
};

export function useTwoMonthPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentFiles, setAssignmentFiles] = useState<AssignmentFile[]>([]);
  const [dailyInfos, setDailyInfos] = useState<DailyInfo[]>([]);
  const [siteMembers, setSiteMembers] = useState<SiteMember[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [contractorContacts, setContractorContacts] = useState<
    ContractorContact[]
  >([]);

  const [baseMonth, setBaseMonth] = useState(() => {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;

    if (month % 2 !== 0) {
      month -= 1;
    }

    if (month === 0) {
      month = 12;
      year -= 1;
    }

    return `${year}-${String(month).padStart(2, "0")}`;
  });

  const [siteName, setSiteName] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [shiftType, setShiftType] = useState("day");
  const [meetingTime, setMeetingTime] = useState("08:00");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState<Assignment | null>(null);
  const [newFiles, setNewFiles] = useState<FileList | null>(null);
  const [constructionType, setConstructionType] = useState("第一工事");
  const [sortMode, setSortMode] = useState("manual");
  const [draggingAssignmentId, setDraggingAssignmentId] =
    useState<string | null>(null);

  const [undoStack, setUndoStack] = useState<HistoryItem[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryItem[]>([]);
  const [isUndoRedo, setIsUndoRedo] = useState(false);

  const days = useMemo(() => {
    const [year, month] = baseMonth.split("-").map(Number);
    const start = new Date(year, month - 1, 1);

    return Array.from({ length: 62 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");

      return `${y}-${m}-${day}`;
    });
  }, [baseMonth]);

  const fetchData = async () => {
    try {
      const result = await fetchTwoMonthData(days);
  
      setEmployees(result.employees);
      setContractors(result.contractors);
      setContractorContacts(result.contractorContacts);
      setAssignments(result.assignments);
      setDailyInfos(result.dailyInfos);
      setSiteMembers(result.siteMembers);
      setAssignmentFiles(result.assignmentFiles);
    } catch (error) {
      alert(error instanceof Error ? error.message : "データ取得に失敗しました");
    }
  };

  useEffect(() => {
    fetchData();
  }, [baseMonth]);

  return {
    assignments,
    setAssignments,
    assignmentFiles,
    setAssignmentFiles,
    dailyInfos,
    setDailyInfos,
    siteMembers,
    setSiteMembers,
    employees,
    setEmployees,
    contractors,
    setContractors,
    contractorContacts,
    setContractorContacts,

    baseMonth,
    setBaseMonth,
    days,

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
    constructionType,
    setConstructionType,
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
    fetchData,
  };
}