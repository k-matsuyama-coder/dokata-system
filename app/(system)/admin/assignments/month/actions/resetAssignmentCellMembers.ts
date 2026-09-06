import { supabase } from "@/lib/supabase";

type Props = {
  organizationId: string;
  assignmentId: string;
  workDate: string;
};

export async function resetAssignmentCellMembersAction({
  organizationId,
  assignmentId,
  workDate,
}: Props) {
  return await supabase
    .from("assignment_site_members")
    .delete()
    .eq("organization_id", organizationId)
    .eq("assignment_id", assignmentId)
    .eq("work_date", workDate);
}