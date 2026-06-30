import { useEffect, useMemo, useState } from "react";
import { fetchTwoMonthData } from "../api";
import { supabase } from "@/lib/supabase";
import { hasRole } from "@/app/types/auth";

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

type CurrentOrganizationResponse = {
  organizationId: string | null;
  impersonating?: boolean;
  isSuperAdmin?: boolean;
  message?: string;
  error?: string;
};

export function useTwoMonthPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentFiles, setAssignmentFiles] = useState<AssignmentFile[]>([]);
  const [dailyInfos, setDailyInfos] = useState<DailyInfo[]>([]);
  const [siteMembers, setSiteMembers] = useState<SiteMember[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [contractorContacts, setContractorContacts] = useState<ContractorContact[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const [baseMonth, setBaseMonth] = useState(() => {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;

    if (month % 2 !== 0) month -= 1;
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
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [newFiles, setNewFiles] = useState<FileList | null>(null);
  const [constructionType, setConstructionType] = useState("第一工事");
  const [sortMode, setSortMode] = useState("manual");
  const [draggingAssignmentId, setDraggingAssignmentId] = useState<string | null>(null);

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
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/login";
        return;
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      if (sessionError || !token) {
        window.location.href = "/login";
        return;
      }

      const res = await fetch("/api/current-organization", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const orgResult = (await res.json()) as CurrentOrganizationResponse;

      if (!res.ok) {
        alert(orgResult.error ?? orgResult.message ?? "会社情報の取得に失敗しました");
        return;
      }

      if (!orgResult.organizationId) {
        if (orgResult.isSuperAdmin && !orgResult.impersonating) {
          alert("対象会社が未選択です。会社を選択してから開いてください。");
          return;
        }

        alert("会社情報が取得できません");
        return;
      }

      const organizationId = orgResult.organizationId;
      setOrganizationId(organizationId);

      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select("role")
        .eq("organization_id", organizationId)
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (employeeError) {
        throw employeeError;
      }

      if (!employee || !hasRole(employee.role, "admin")) {
        alert("管理者のみ閲覧できます");
        window.location.href = "/home";
        return;
      }

      const resultData = await fetchTwoMonthData({
        days,
        organizationId,
      });

      setEmployees(resultData.employees ?? []);
      setContractors(resultData.contractors ?? []);
      setContractorContacts(resultData.contractorContacts ?? []);
      setAssignments(resultData.assignments ?? []);
      setDailyInfos(resultData.dailyInfos ?? []);
      setSiteMembers(resultData.siteMembers ?? []);
      setAssignmentFiles(resultData.assignmentFiles ?? []);
    } catch (error) {
      alert(error instanceof Error ? error.message : "データ取得に失敗しました");
    }
  };

  useEffect(() => {
    void fetchData();
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
    organizationId,
    setOrganizationId,
    fetchData,
  };
}