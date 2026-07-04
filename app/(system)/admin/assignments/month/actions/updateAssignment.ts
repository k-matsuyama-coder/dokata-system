import { supabase } from "@/lib/supabase";
import type { Assignment } from "../types";

async function getCurrentOrganization() {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    throw new Error("ログイン情報なし");
  }

  const res = await fetch("/api/current-organization", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || "会社情報取得失敗");
  }

  return result.organizationId as string;
}

type Props = {
  editingAssignment: Assignment | null;
};

export async function updateAssignmentAction({
  editingAssignment,
}: Props) {
  if (!editingAssignment) return { error: null };

  const organizationId = await getCurrentOrganization();

  const { error } = await supabase
    .from("assignments")
    .update({
      contractor_name: editingAssignment.contractor_name,
      site_name: editingAssignment.site_name,
      group_key: editingAssignment.group_key,
      construction_type: editingAssignment.construction_type,
      manager_name: editingAssignment.manager_name,
      contact_phone: editingAssignment.contact_phone,
      address: editingAssignment.address,
      meeting_time: editingAssignment.meeting_time,
      shift_type: editingAssignment.shift_type,
      start_time:
        editingAssignment.shift_type === "night" ? "20:00" : "08:00",
      end_time:
        editingAssignment.shift_type === "night" ? "05:00" : "17:00",
      start_date: editingAssignment.start_date,
      end_date: editingAssignment.end_date,
    })
    .eq("organization_id", organizationId)
    .eq("id", editingAssignment.id);

  return { error };
}