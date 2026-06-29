import { supabase } from "@/lib/supabase";

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

export async function uploadFilesAction(
  assignmentId: string,
  files: FileList | null
) {
  if (!files) return { error: null };

  const organizationId = await getCurrentOrganization();

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
        organization_id: organizationId,
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
