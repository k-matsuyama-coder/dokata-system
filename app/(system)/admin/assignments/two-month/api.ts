"use client";

import { supabase } from "@/lib/supabase";
import type { Assignment, AssignmentGroupKey } from "./types";

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

function getFileExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");
  return lastDotIndex >= 0 ? fileName.slice(lastDotIndex).toLowerCase() : "";
}

function createSafeStorageFilePath(
  assignmentId: string,
  originalFileName: string
) {
  const extension = getFileExtension(originalFileName);
  const uniqueId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2)}`;

  return `${assignmentId}/${uniqueId}${extension}`;
}

export async function fetchTwoMonthData({
  days,
  organizationId,
}: TwoMonthDataParams) {
  const safeOrganizationId = ensureOrganizationId(organizationId);

  const startDate = days[0];
  const endDate = days[days.length - 1];

  if (!startDate || !endDate) {
    throw new Error("表示期間が取得できません");
  }

  const [
    employeeResult,
    contractorResult,
    contactResult,
    assignmentResult,
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("name, company_name")
      .eq("organization_id", safeOrganizationId)
      .order("name", { ascending: true }),

    supabase
      .from("contractors")
      .select("id, name")
      .eq("organization_id", safeOrganizationId)
      .order("name", { ascending: true }),

    supabase
      .from("contractor_contacts")
      .select("id, contractor_id, manager_name, contact_phone")
      .eq("organization_id", safeOrganizationId),

    supabase
      .from("assignments")
      .select(`
        id,
        assignment_date,
        site_name,
        contractor_name,
        construction_type,
        group_key,
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
      .order("created_at", { ascending: true }),
  ]);

  if (employeeResult.error) {
    throw new Error("社員取得失敗: " + employeeResult.error.message);
  }

  if (contractorResult.error) {
    throw new Error("元請取得失敗: " + contractorResult.error.message);
  }

  if (contactResult.error) {
    throw new Error("担当者取得失敗: " + contactResult.error.message);
  }

  if (assignmentResult.error) {
    throw new Error("現場取得失敗: " + assignmentResult.error.message);
  }

  const assignmentData = assignmentResult.data ?? [];
  const assignmentIds = assignmentData.map((assignment) => assignment.id);

  if (assignmentIds.length === 0) {
    return {
      employees: employeeResult.data ?? [],
      contractors: contractorResult.data ?? [],
      contractorContacts: contactResult.data ?? [],
      assignments: [],
      dailyInfos: [],
      siteMembers: [],
      assignmentFiles: [],
    };
  }

  const [dailyInfoResult, memberResult, fileResult] = await Promise.all([
    supabase
      .from("assignment_site_daily_infos")
      .select(
        "id, assignment_id, work_date, planned_count, detail, vehicle_names"
      )
      .eq("organization_id", safeOrganizationId)
      .in("assignment_id", assignmentIds)
      .gte("work_date", startDate)
      .lte("work_date", endDate),

    supabase
      .from("assignment_site_members")
      .select(
        "id, assignment_id, work_date, employee_name, is_driver, is_operator, is_foreman, heavy_equipment"
      )
      .eq("organization_id", safeOrganizationId)
      .in("assignment_id", assignmentIds)
      .gte("work_date", startDate)
      .lte("work_date", endDate),

    supabase
      .from("assignment_files")
      .select("id, assignment_id, file_name, file_url, file_path")
      .eq("organization_id", safeOrganizationId)
      .in("assignment_id", assignmentIds),
  ]);

  if (dailyInfoResult.error) {
    throw new Error("工程表取得失敗: " + dailyInfoResult.error.message);
  }

  if (memberResult.error) {
    throw new Error("メンバー取得失敗: " + memberResult.error.message);
  }

  if (fileResult.error) {
    throw new Error("ファイル取得失敗: " + fileResult.error.message);
  }

  return {
    employees: employeeResult.data ?? [],
    contractors: contractorResult.data ?? [],
    contractorContacts: contactResult.data ?? [],
    assignments: assignmentData,
    dailyInfos: dailyInfoResult.data ?? [],
    siteMembers: memberResult.data ?? [],
    assignmentFiles: fileResult.data ?? [],
  };
}

export async function uploadAssignmentFiles(
  assignmentId: string,
  files: FileList | null,
  organizationId: string
) {
  const safeOrganizationId = ensureOrganizationId(organizationId);

  if (!files || files.length === 0) return;

  for (const file of Array.from(files)) {
    const filePath = createSafeStorageFilePath(assignmentId, file.name);

    const { error: uploadError } = await supabase.storage
      .from("assignment-files")
      .upload(filePath, file, {
        upsert: false,
      });

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

  const { data: files, error: filesError } = await supabase
    .from("assignment_files")
    .select("file_path")
    .eq("organization_id", safeOrganizationId)
    .eq("assignment_id", id);

  if (filesError) {
    throw new Error("ファイル一覧取得失敗: " + filesError.message);
  }

  const filePaths = files?.map((file) => file.file_path).filter(Boolean) ?? [];

  if (filePaths.length > 0) {
    const { error: removeStorageError } = await supabase.storage
      .from("assignment-files")
      .remove(filePaths);

    if (removeStorageError) {
      throw new Error("ストレージ削除失敗: " + removeStorageError.message);
    }
  }

  const { error: membersDeleteError } = await supabase
    .from("assignment_site_members")
    .delete()
    .eq("organization_id", safeOrganizationId)
    .eq("assignment_id", id);

  if (membersDeleteError) {
    throw new Error("メンバー削除失敗: " + membersDeleteError.message);
  }

  const { error: dailyInfosDeleteError } = await supabase
    .from("assignment_site_daily_infos")
    .delete()
    .eq("organization_id", safeOrganizationId)
    .eq("assignment_id", id);

  if (dailyInfosDeleteError) {
    throw new Error("工程表削除失敗: " + dailyInfosDeleteError.message);
  }

  const { error: filesDeleteError } = await supabase
    .from("assignment_files")
    .delete()
    .eq("organization_id", safeOrganizationId)
    .eq("assignment_id", id);

  if (filesDeleteError) {
    throw new Error("ファイル削除失敗: " + filesDeleteError.message);
  }

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
      group_key: assignment.group_key,
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

async function getTopSortOrder(organizationId: string) {
  const safeOrganizationId = ensureOrganizationId(organizationId);

  const { data, error } = await supabase
    .from("assignments")
    .select("sort_order")
    .eq("organization_id", safeOrganizationId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("並び順取得失敗: " + error.message);
  }

  const currentTop =
    typeof data?.sort_order === "number" ? data.sort_order : 0;

  return currentTop - 1;
}

export async function addAssignmentApi(
  data: {
    assignment_date: string;
    contractor_name: string;
    site_name: string;
    group_key: AssignmentGroupKey;
    manager_name: string;
    contact_phone: string;
    address: string;
    shift_type: string;
    meeting_time: string;
    start_date: string;
    end_date: string | null;
  },
  organizationId: string
) {
  const safeOrganizationId = ensureOrganizationId(organizationId);
  const sortOrder = await getTopSortOrder(safeOrganizationId);

  const { data: result, error } = await supabase
    .from("assignments")
    .insert({
      organization_id: safeOrganizationId,
      assignment_date: data.assignment_date,
      contractor_name: data.contractor_name,
      site_name: data.site_name,
      group_key: data.group_key,
      manager_name: data.manager_name,
      contact_phone: data.contact_phone,
      address: data.address,
      shift_type: data.shift_type,
      meeting_time: data.meeting_time,
      start_date: data.start_date,
      end_date: data.end_date,
      sort_order: sortOrder,
      start_time: data.shift_type === "night" ? "20:00" : "08:00",
      end_time: data.shift_type === "night" ? "05:00" : "17:00",
    })
    .select(`
  id,
  assignment_date,
  site_name,
  contractor_name,
  construction_type,
  group_key,
  manager_name,
  contact_phone,
  address,
  meeting_time,
  shift_type,
  start_time,
  end_time,
  start_date,
  end_date,
  sort_order
`)
    .single();

  if (error || !result) {
    throw new Error("現場追加失敗: " + (error?.message ?? "ID取得失敗"));
  }

  return result;
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