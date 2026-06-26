import { supabase } from "@/lib/supabase";

type Props = {
  employeeName: string;
  assignmentId: string;
  workDate: string;
  isFirstMember: boolean;
};

export async function addEmployeeToCellAction({
  employeeName,
  assignmentId,
  workDate,
  isFirstMember,
}: Props) {
  const { data, error } = await supabase
    .from("assignment_site_members")
    .insert({
      assignment_id: assignmentId,
      work_date: workDate,
      employee_name: employeeName,
      is_driver: false,
      is_operator: false,
      is_foreman: isFirstMember,
      heavy_equipment: "",
    })
    .select(
      "id, assignment_id, work_date, employee_name, is_driver, is_operator, is_foreman, heavy_equipment"
    )
    .single();

  return { data, error };
}