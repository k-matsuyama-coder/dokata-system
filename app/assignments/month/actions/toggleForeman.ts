import { supabase } from "@/lib/supabase";
import type { SiteMember } from "../types";

type Props = {
  member: SiteMember;
};

export async function toggleForemanAction({ member }: Props) {
  return await supabase
    .from("assignment_site_members")
    .update({
      is_foreman: !member.is_foreman,
    })
    .eq("id", member.id);
}