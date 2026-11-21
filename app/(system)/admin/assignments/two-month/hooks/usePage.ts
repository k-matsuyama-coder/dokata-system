import { fetchAllRows } from "@/lib/fetchAllRows";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchTwoMonthData } from "../api";
import { supabase } from "@/lib/supabase";
import { hasRole } from "@/app/types/auth";

import type {
  Assignment,
  AssignmentFile,
  AssignmentGroupKey,
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
  const [contractorContacts, setContractorContacts] = useState<ContractorContact[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const [dateMemos, setDateMemos] = useState<Map<string, string>>(
    () => new Map()
  );

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
  const [groupKey, setGroupKey] = useState<AssignmentGroupKey>("group1");
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

  const requestIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const isCurrent = () => requestIdRef.current === requestId;

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      
      const user = session?.user;
      const token = session?.access_token;
      
      if (sessionError || !user || !token) {
        window.location.href = "/login";
        return;
      }

      const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("organization_id, role")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!isCurrent()) return;

    if (employeeError) {
      throw new Error(employeeError.message);
    }

    if (!employee?.organization_id) {
      throw new Error("会社情報が取得できません");
    }

    if (!hasRole(employee.role, "admin")) {
      alert("管理者のみ閲覧できます");
      window.location.href = "/home";
      return;
    }

    const nextOrganizationId = employee.organization_id;
    setOrganizationId(nextOrganizationId);

      const resultData = await fetchTwoMonthData({
        days,
        organizationId: nextOrganizationId,
        onCoreData: (core) => {
          if (!isCurrent()) return;

          setEmployees(core.employees);
          setAssignments(core.assignments);
          setDailyInfos(core.dailyInfos);
        },
      });

      if (!isCurrent()) return;

      setContractors(resultData.contractors);
      setContractorContacts(resultData.contractorContacts);
      setSiteMembers(resultData.siteMembers);
      setAssignmentFiles(resultData.assignmentFiles);

      const { data: memoRows, error: memoError } = await fetchAllRows((pageFrom, pageTo) => supabase
  .from("assignment_date_memos")
  .select("work_date, memo")
  .eq("organization_id", nextOrganizationId)
  .gte("work_date", days[0])
  .lte("work_date", days[days.length - 1])
.order("id", { ascending: true }).range(pageFrom, pageTo));

if (!isCurrent()) return;

if (memoError) {
  throw memoError;
}

setDateMemos(
  new Map(
    (memoRows ?? []).map((row) => [
      row.work_date as string,
      (row.memo as string | null) ?? "",
    ])
  )
);
} catch (error) {
  if (!isCurrent()) return;

  alert(
    error instanceof Error
      ? error.message
      : "データ取得に失敗しました"
  );
}
}, [days]);

  const onSaveDateMemo = async (date: string, memo: string) => {
    if (!organizationId) {
      throw new Error("会社情報を取得できていません。再読み込みしてください。");
    }
  
    const { error: saveError } = await supabase
      .from("assignment_date_memos")
      .upsert(
        {
          organization_id: organizationId,
          work_date: date,
          memo,
        },
        {
          onConflict: "organization_id,work_date",
        }
      );
  
    if (saveError) {
      throw new Error(`日付メモの保存に失敗しました: ${saveError.message}`);
    }
  
    // 開き直したときと同じ条件で、DBから取得できることを確認する
    const { data: savedMemo, error: readError } = await supabase
      .from("assignment_date_memos")
      .select("work_date, memo")
      .eq("organization_id", organizationId)
      .eq("work_date", date)
      .single();
  
    if (readError) {
      throw new Error(
        `保存後の読み込み確認に失敗しました: ${readError.message}`
      );
    }
  
    if (!savedMemo || savedMemo.memo !== memo) {
      throw new Error(
        "保存内容を確認できませんでした。入力内容を残しています。"
      );
    }
  
    setDateMemos((prev) => {
      const next = new Map(prev);
      next.set(savedMemo.work_date, savedMemo.memo ?? "");
      return next;
    });
  };

  useEffect(() => {
    void fetchData();

    return () => {
      requestIdRef.current += 1;
    };
  }, [fetchData]);

  return {
    assignments,
    setAssignments,
    dateMemos,
setDateMemos,
onSaveDateMemo,
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
    organizationId,
    setOrganizationId,
    fetchData,
  };
}