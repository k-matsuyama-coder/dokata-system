import { supabase } from "@/lib/supabase";

type Props = {
  siteMemberId: string;
  assignmentId: string;
  workDate: string;
  organizationId: string;
};

export async function moveSiteMemberAction({
  siteMemberId,
  assignmentId,
  workDate,
  organizationId,
}: Props) {
  return await supabase
    .from("assignment_site_members")
    .update({
      assignment_id: assignmentId,
      work_date: workDate,
    })
    .eq("organization_id", organizationId)
    .eq("id", siteMemberId);
}