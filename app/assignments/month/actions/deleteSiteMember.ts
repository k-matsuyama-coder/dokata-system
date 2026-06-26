import { supabase } from "@/lib/supabase";

export async function deleteSiteMemberAction(id: string) {
  return await supabase
    .from("assignment_site_members")
    .delete()
    .eq("id", id);
}