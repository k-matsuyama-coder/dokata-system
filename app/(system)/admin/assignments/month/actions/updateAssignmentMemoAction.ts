// app/(system)/admin/assignments/month/actions/updateAssignmentMemoAction.ts
import { supabase } from "@/lib/supabase";

type Props = {
  assignmentId: string;
  memo: string;
  organizationId: string;
};

const toNullableMemo = (value: string) => {
  const trimmed = value.trim();
  return trimmed === "" ? null : value;
};

export async function updateAssignmentMemoAction({
  assignmentId,
  memo,
  organizationId,
}: Props) {
  const { data, error } = await supabase
    .from("assignments")
    .update({
      memo: toNullableMemo(memo),
    })
    .eq("organization_id", organizationId)
    .eq("id", assignmentId)
    .select("id, memo")
    .single();

  return { data, error };
}