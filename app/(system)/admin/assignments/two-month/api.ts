// app/.../hooks/usePage.ts
import { useEffect, useMemo, useState } from "react";
import { fetchTwoMonthData } from "../api";
import { supabase } from "@/lib/supabase";
import { hasRole } from "@/types/auth";

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

      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select("role")
        .eq("organization_id", organizationId)
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (employeeError) {
        throw new Error(`社員権限取得失敗: ${employeeError.message}`);
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
    fetchData,
  };
}

// app/.../api.ts
import { supabase } from "@/lib/supabase";
import type { Assignment, ConstructionType, ShiftType } from "./types";

type TwoMonthDataParams = {
  days: string[];
  organizationId: string;
};

function ensureOrganizationId(organizationId: string | null | undefined) {
  if (!organizationId) {
    throw new Error("会社情報が取得できません");
  }
  return organizationId;
}

export async function fetchTwoMonthData({
  days,
  organizationId,
}: TwoMonthDataParams) {
  const safeOrganizationId = ensureOrganizationId(organizationId);

  const startDate = days[0];
  const endDate = days[days.length - 1];

  const { data: employeeData, error: employeeError } = await supabase
    .from("employees")
    .select("name, company_name")
    .eq("organization_id", safeOrganizationId)
    .order("name", { ascending: true });

  if (employeeError) {
    throw new Error("社員取得失敗: " + employeeError.message);
  }

  const { data: contractorData, error: contractorError } = await supabase
    .from("contractors")
    .select("id, name")
    .eq("organization_id", safeOrganizationId)
    .order("name", { ascending: true });

  if (contractorError) {
    throw new Error("元請取得失敗: " + contractorError.message);
  }

  const { data: contactData, error: contactError } = await supabase
    .from("contractor_contacts")
    .select("id, contractor_id, manager_name, contact_phone")
    .eq("organization_id", safeOrganizationId);

  if (contactError) {
    throw new Error("担当者取得失敗: " + contactError.message);
  }

  const { data: assignmentData, error: assignmentError } = await supabase
    .from("assignments")
    .select(`
      id,
      assignment_date,
      site_name,
      contractor_name,
      construction_type,
      manager_name,
      contact_phone,
      address,
      meeting_time,
      shift_type,
      start_time,
      end_time,
      start_date,
      end_date
    `)
    .eq("organization_id", safeOrganizationId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (assignmentError) {
    throw new Error("現場取得失敗: " + assignmentError.message);
  }

  const assignmentIds = assignmentData?.map((a) => a.id) ?? [];

  if (assignmentIds.length === 0) {
    return {
      employees: employeeData ?? [],
      contractors: contractorData ?? [],
      contractorContacts: contactData ?? [],
      assignments: [],
      dailyInfos: [],
      siteMembers: [],
      assignmentFiles: [],
    };
  }

  const { data: dailyInfoData, error: dailyInfoError } = await supabase
    .from("assignment_site_daily_infos")
    .select("id, assignment_id, work_date, planned_count, detail, vehicle_names")
    .eq("organization_id", safeOrganizationId)
    .in("assignment_id", assignmentIds)
    .gte("work_date", startDate)
    .lte("work_date", endDate);

  if (dailyInfoError) {
    throw new Error("工程表取得失敗: " + dailyInfoError.message);
  }

  const { data: memberData, error: memberError } = await supabase
    .from("assignment_site_members")
    .select("id, assignment_id, work_date, employee_name, is_driver, is_operator, is_foreman, heavy_equipment")
    .eq("organization_id", safeOrganizationId)
    .in("assignment_id", assignmentIds)
    .gte("work_date", startDate)
    .lte("work_date", endDate);

  if (memberError) {
    throw new Error("メンバー取得失敗: " + memberError.message);
  }

  const { data: fileData, error: fileError } = await supabase
    .from("assignment_files")
    .select("id, assignment_id, file_name, file_url, file_path")
    .eq("organization_id", safeOrganizationId)
    .in("assignment_id", assignmentIds);

  if (fileError) {
    throw new Error("ファイル取得失敗: " + fileError.message);
  }

  return {
    employees: employeeData ?? [],
    contractors: contractorData ?? [],
    contractorContacts: contactData ?? [],
    assignments: assignmentData ?? [],
    dailyInfos: dailyInfoData ?? [],
    siteMembers: memberData ?? [],
    assignmentFiles: fileData ?? [],
  };
}

export async function uploadAssignmentFiles(
  assignmentId: string,
  files: FileList | null,
  organizationId: string
) {
  const safeOrganizationId = ensureOrganizationId(organizationId);
  if (!files) return;

  for (const file of Array.from(files)) {
    const filePath = `${assignmentId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("assignment-files")
      .upload(filePath, file);

    if (uploadError) {
      throw new Error("アップロード失敗: " + uploadError.message);
    }

    const { data } = supabase.storage
      .from("assignment-files")
      .getPublicUrl(filePath);

    const { error: insertError } = await supabase
      .from("assignment_files")
      .insert({
        organization_id: safeOrganizationId,
        assignment_id: assignmentId,
        file_name: file.name,
        file_url: data.publicUrl,
        file_path: filePath,
      });

    if (insertError) {
      throw new Error("ファイル登録失敗: " + insertError.message);
    }
  }
}

export async function deleteAssignmentApi(id: string, organizationId: string) {
  const safeOrganizationId = ensureOrganizationId(organizationId);

  const { data: files } = await supabase
    .from("assignment_files")
    .select("file_path")
    .eq("organization_id", safeOrganizationId)
    .eq("assignment_id", id);

  const filePaths = files?.map((file) => file.file_path).filter(Boolean) ?? [];

  if (filePaths.length > 0) {
    await supabase.storage.from("assignment-files").remove(filePaths);
  }

  await supabase
    .from("assignment_site_members")
    .delete()
    .eq("organization_id", safeOrganizationId)
    .eq("assignment_id", id);

  await supabase
    .from("assignment_site_daily_infos")
    .delete()
    .eq("organization_id", safeOrganizationId)
    .eq("assignment_id", id);

  await supabase
    .from("assignment_files")
    .delete()
    .eq("organization_id", safeOrganizationId)
    .eq("assignment_id", id);

  const { error } = await supabase
    .from("assignments")
    .delete()
    .eq("organization_id", safeOrganizationId)
    .eq("id", id);

  if (error) {
    throw new Error("現場削除失敗: " + error.message);
  }
}

export async function deleteAssignmentFileApi(id: string, organizationId: string) {
  const safeOrganizationId = ensureOrganizationId(organizationId);

  const { data: file, error: selectError } = await supabase
    .from("assignment_files")
    .select("file_path")
    .eq("organization_id", safeOrganizationId)
    .eq("id", id)
    .single();

  if (selectError) {
    throw new Error("ファイル取得失敗: " + selectError.message);
  }

  if (file?.file_path) {
    const { error: storageError } = await supabase.storage
      .from("assignment-files")
      .remove([file.file_path]);

    if (storageError) {
      throw new Error("ストレージ削除失敗: " + storageError.message);
    }
  }

  const { error } = await supabase
    .from("assignment_files")
    .delete()
    .eq("organization_id", safeOrganizationId)
    .eq("id", id);

  if (error) {
    throw new Error("ファイル削除失敗: " + error.message);
  }
}

export async function updateAssignmentApi(
  assignment: Assignment,
  organizationId: string
) {
  const safeOrganizationId = ensureOrganizationId(organizationId);

  const { error } = await supabase
    .from("assignments")
    .update({
      contractor_name: assignment.contractor_name,
      site_name: assignment.site_name,
      construction_type: assignment.construction_type,
      manager_name: assignment.manager_name,
      contact_phone: assignment.contact_phone,
      address: assignment.address,
      meeting_time: assignment.meeting_time,
      shift_type: assignment.shift_type,
      start_time: assignment.shift_type === "night" ? "20:00" : "08:00",
      end_time: assignment.shift_type === "night" ? "05:00" : "17:00",
      start_date: assignment.start_date,
      end_date: assignment.end_date,
    })
    .eq("organization_id", safeOrganizationId)
    .eq("id", assignment.id);

  if (error) {
    throw new Error("現場更新失敗: " + error.message);
  }
}

export async function addAssignmentApi(
  data: {
    assignment_date: string;
    contractor_name: string;
    site_name: string;
    construction_type: ConstructionType;
    manager_name: string;
    contact_phone: string;
    address: string;
    shift_type: ShiftType;
    meeting_time: string;
    start_date: string;
    end_date: string | null;
  },
  organizationId: string
) {
  const safeOrganizationId = ensureOrganizationId(organizationId);

  const { data: result, error } = await supabase
    .from("assignments")
    .insert({
      organization_id: safeOrganizationId,
      ...data,
      start_time: data.shift_type === "night" ? "20:00" : "08:00",
      end_time: data.shift_type === "night" ? "05:00" : "17:00",
    })
    .select("id")
    .single();

  if (error || !result) {
    throw new Error("現場追加失敗: " + (error?.message ?? "ID取得失敗"));
  }

  return result.id;
}

export async function updateDailyInfoApi(
  payload: {
    assignment_id: string;
    work_date: string;
    planned_count: number | null;
    detail: string | null;
  },
  organizationId: string
) {
  const safeOrganizationId = ensureOrganizationId(organizationId);

  const { data, error } = await supabase
    .from("assignment_site_daily_infos")
    .upsert(
      {
        organization_id: safeOrganizationId,
        ...payload,
      },
      {
        onConflict: "organization_id,assignment_id,work_date",
      }
    )
    .select("id, assignment_id, work_date, planned_count, detail, vehicle_names")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "取得失敗");
  }

  return data;
}

export async function updateAssignmentSortOrderApi(
  assignments: { id: string }[],
  organizationId: string
) {
  const safeOrganizationId = ensureOrganizationId(organizationId);

  const results = await Promise.all(
    assignments.map((assignment, index) =>
      supabase
        .from("assignments")
        .update({ sort_order: index })
        .eq("organization_id", safeOrganizationId)
        .eq("id", assignment.id)
    )
  );

  const failed = results.find((result) => result.error);

  if (failed?.error) {
    throw new Error("並び替え保存失敗: " + failed.error.message);
  }
}