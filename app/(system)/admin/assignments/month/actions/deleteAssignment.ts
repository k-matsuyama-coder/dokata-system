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
  assignmentId: string;
  assignmentFiles: AssignmentFile[];
};

export async function deleteAssignmentAction({
  assignmentId,
  assignmentFiles,
}: Props) {
  const organizationId = await getCurrentOrganization();
  const filesToDelete = assignmentFiles.filter(
    (file) =>
      file.assignment_id === assignmentId &&
      file.file_path
  );

  if (filesToDelete.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("assignment-files")
      .remove(filesToDelete.map((file) => file.file_path));

    if (storageError) {
      return { error: storageError };
    }
  }

  await supabase
  .from("assignment_site_members")
  .delete()
  .eq("organization_id", organizationId)
  .eq("assignment_id", assignmentId);

  await supabase
  .from("assignment_site_daily_infos")
  .delete()
  .eq("organization_id", organizationId)
  .eq("assignment_id", assignmentId);

  await supabase
  .from("assignment_files")
  .delete()
  .eq("organization_id", organizationId)
  .eq("assignment_id", assignmentId);

  const { error } = await supabase
  .from("assignments")
  .delete()
  .eq("organization_id", organizationId)
  .eq("id", assignmentId);

  return { error };
}