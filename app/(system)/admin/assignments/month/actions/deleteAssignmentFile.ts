import { supabase } from "@/lib/supabase";
import type { AssignmentFile } from "../types";

async function getCurrentOrganization() {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    throw new Error("ログイン情報なし");
  }

  const res = await fetch("/api/current-organization", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || "会社情報取得失敗");
  }

  return result.organizationId as string;
}

type Props = {
  file: AssignmentFile;
};

export async function deleteAssignmentFileAction({ file }: Props) {
  const organizationId = await getCurrentOrganization();
  const { error: storageError } = await supabase.storage
    .from("assignment-files")
    .remove([file.file_path]);

  if (storageError) {
    return { error: storageError };
  }

  const { error } = await supabase
  .from("assignment_files")
  .delete()
  .eq("organization_id", organizationId)
  .eq("id", file.id);

  return { error };
}