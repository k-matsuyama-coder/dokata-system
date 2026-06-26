import { supabase } from "@/lib/supabase";
import type { AssignmentFile } from "../types";

type Props = {
  file: AssignmentFile;
};

export async function deleteAssignmentFileAction({ file }: Props) {
  const { error: storageError } = await supabase.storage
    .from("assignment-files")
    .remove([file.file_path]);

  if (storageError) {
    return { error: storageError };
  }

  const { error } = await supabase
    .from("assignment_files")
    .delete()
    .eq("id", file.id);

  return { error };
}