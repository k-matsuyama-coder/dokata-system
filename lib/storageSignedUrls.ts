import { supabase } from "@/lib/supabase";

export async function createSignedUrlMap(
  bucketName: string,
  paths: Array<string | null | undefined>,
  expiresIn = 24 * 60 * 60
): Promise<Record<string, string>> {
  const uniquePaths = Array.from(
    new Set(
      paths.filter((path): path is string => Boolean(path))
    )
  );

  if (uniquePaths.length === 0) {
    return {};
  }

  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrls(uniquePaths, expiresIn);

  if (error) {
    throw error;
  }

  return Object.fromEntries(
    (data ?? [])
      .filter(
        (
          item
        ): item is typeof item & {
          path: string;
          signedUrl: string;
        } => Boolean(item.path && item.signedUrl)
      )
      .map((item) => [item.path, item.signedUrl])
  );
}