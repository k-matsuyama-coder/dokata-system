import { supabase } from "@/lib/supabase";
import type { AssignmentFile } from "../types";

type Props = {
  assignmentId: string;
  assignmentFiles: AssignmentFile[];
};

export async function deleteAssignmentAction({
  assignmentId,
  assignmentFiles,
}: Props) {
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
    .eq("assignment_id", assignmentId);

  await supabase
    .from("assignment_site_daily_infos")
    .delete()
    .eq("assignment_id", assignmentId);

  await supabase
    .from("assignment_files")
    .delete()
    .eq("assignment_id", assignmentId);

  const { error } = await supabase
    .from("assignments")
    .delete()
    .eq("id", assignmentId);

  return { error };
}