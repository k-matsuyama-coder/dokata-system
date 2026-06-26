import { supabase } from "@/lib/supabase";

type Props = {
  siteMemberId: string;
  assignmentId: string;
  workDate: string;
};

export async function moveSiteMemberAction({
  siteMemberId,
  assignmentId,
  workDate,
}: Props) {
  return await supabase
    .from("assignment_site_members")
    .update({
      assignment_id: assignmentId,
      work_date: workDate,
    })
    .eq("id", siteMemberId);
}