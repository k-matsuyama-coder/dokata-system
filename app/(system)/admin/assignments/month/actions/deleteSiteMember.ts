import { supabase } from "@/lib/supabase";

type Props = {
  id: string;
  organizationId: string;
};

export async function deleteSiteMemberAction({
  id,
  organizationId,
}: Props) {
  return await supabase
    .from("assignment_site_members")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", id);
}