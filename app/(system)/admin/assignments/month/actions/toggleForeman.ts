import { supabase } from "@/lib/supabase";
import type { SiteMember } from "../types";

type Props = {
  member: SiteMember;
  organizationId: string;
};

export async function toggleForemanAction({
  member,
  organizationId,
}: Props) {
  return await supabase
    .from("assignment_site_members")
    .update({
      is_foreman: !member.is_foreman,
    })
    .eq("organization_id", organizationId)
    .eq("id", member.id);
}