import { supabase } from "@/lib/supabase";

export async function uploadFilesAction(
  assignmentId: string,
  files: FileList | null
) {
  if (!files) return { error: null };

  for (const file of Array.from(files)) {
    const filePath = `${assignmentId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("assignment-files")
      .upload(filePath, file);

    if (uploadError) {
      return { error: uploadError };
    }

    const { data } = supabase.storage
      .from("assignment-files")
      .getPublicUrl(filePath);

    const { error: insertError } = await supabase
      .from("assignment_files")
      .insert({
        assignment_id: assignmentId,
        file_name: file.name,
        file_url: data.publicUrl,
        file_path: filePath,
      });

    if (insertError) {
      return { error: insertError };
    }
  }

  return { error: null };
}
