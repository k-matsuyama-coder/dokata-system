import { supabase } from "@/lib/supabase";
import type { Assignment } from "../types";

type Props = {
  editingAssignment: Assignment | null;
};

export async function updateAssignmentAction({
  editingAssignment,
}: Props) {
  if (!editingAssignment) return { error: null };

  const { error } = await supabase
    .from("assignments")
    .update({
      contractor_name: editingAssignment.contractor_name,
      site_name: editingAssignment.site_name,
      construction_type: editingAssignment.construction_type,
      manager_name: editingAssignment.manager_name,
      contact_phone: editingAssignment.contact_phone,
      address: editingAssignment.address,
      meeting_time: editingAssignment.meeting_time,
      shift_type: editingAssignment.shift_type,

      start_time:
        editingAssignment.shift_type === "night"
          ? "20:00"
          : "08:00",

      end_time:
        editingAssignment.shift_type === "night"
          ? "05:00"
          : "17:00",

      start_date: editingAssignment.start_date,
      end_date: editingAssignment.end_date,
    })
    .eq("id", editingAssignment.id);

  return { error };
}