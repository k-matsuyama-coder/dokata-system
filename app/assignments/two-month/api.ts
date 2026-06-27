import { supabase } from "@/lib/supabase";
import type { Assignment } from "./types";

export async function fetchTwoMonthData(days: string[]) {
  const startDate = days[0];
  const endDate = days[days.length - 1];

  const { data: employeeData } = await supabase
    .from("employees")
    .select("name")
    .order("name", { ascending: true });

  const { data: contractorData } = await supabase
    .from("contractors")
    .select("id, name")
    .order("name", { ascending: true });

  const { data: contactData } = await supabase
    .from("contractor_contacts")
    .select("id, contractor_id, manager_name, contact_phone");

  const { data: assignmentData, error: assignmentError } = await supabase
    .from("assignments")
    .select(`
      id,
      site_name,
      contractor_name,
      construction_type,
      manager_name,
      contact_phone,
      address,
      meeting_time,
      shift_type,
      start_date,
      end_date
    `)
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
    .select("id, assignment_id, work_date, planned_count, detail")
    .in("assignment_id", assignmentIds)
    .gte("work_date", startDate)
    .lte("work_date", endDate);

  if (dailyInfoError) {
    throw new Error("工程表取得失敗: " + dailyInfoError.message);
  }

  const { data: memberData, error: memberError } = await supabase
    .from("assignment_site_members")
    .select("id, assignment_id, work_date, employee_name")
    .in("assignment_id", assignmentIds)
    .gte("work_date", startDate)
    .lte("work_date", endDate);

  if (memberError) {
    throw new Error("メンバー取得失敗: " + memberError.message);
  }

  const { data: fileData, error: fileError } = await supabase
    .from("assignment_files")
    .select("id, assignment_id, file_name, file_url");

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
    files: FileList | null
  ) {
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
          assignment_id: assignmentId,
          file_name: file.name,
          file_url: data.publicUrl,
        });
  
      if (insertError) {
        throw new Error("ファイル登録失敗: " + insertError.message);
      }
    }
  }

  export async function deleteAssignmentApi(id: string) {
    const { error } = await supabase
      .from("assignments")
      .delete()
      .eq("id", id);
  
    if (error) {
      throw new Error("現場削除失敗: " + error.message);
    }
  }

  export async function deleteAssignmentFileApi(id: string) {
    const { error } = await supabase
      .from("assignment_files")
      .delete()
      .eq("id", id);
  
    if (error) {
      throw new Error("ファイル削除失敗: " + error.message);
    }
  }

  export async function updateAssignmentApi(assignment: Assignment) {
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
        start_time:
          assignment.shift_type === "night" ? "20:00" : "08:00",
        end_time:
          assignment.shift_type === "night" ? "05:00" : "17:00",
        start_date: assignment.start_date,
        end_date: assignment.end_date,
      })
      .eq("id", assignment.id);
  
    if (error) {
      throw new Error("現場更新失敗: " + error.message);
    }
  }

  export async function addAssignmentApi(data: {
    assignment_date: string;
    contractor_name: string;
    site_name: string;
    construction_type: string;
    manager_name: string;
    contact_phone: string;
    address: string;
    shift_type: string;
    meeting_time: string;
    start_date: string;
    end_date: string | null;
  }) {
    const { data: result, error } = await supabase
      .from("assignments")
      .insert({
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
    }
  ) {
    const { data, error } = await supabase
      .from("assignment_site_daily_infos")
      .upsert(payload, {
        onConflict: "assignment_id,work_date",
      })
      .select("id, assignment_id, work_date, planned_count, detail")
      .single();
  
    if (error || !data) {
      throw new Error(error?.message ?? "取得失敗");
    }
  
    return data;
  }

  export async function updateAssignmentSortOrderApi(
    assignments: { id: string }[]
  ) {
    const results = await Promise.all(
      assignments.map((assignment, index) =>
        supabase
          .from("assignments")
          .update({ sort_order: index })
          .eq("id", assignment.id)
      )
    );
  
    const failed = results.find((result) => result.error);
  
    if (failed?.error) {
      throw new Error("並び替え保存失敗: " + failed.error.message);
    }
  }