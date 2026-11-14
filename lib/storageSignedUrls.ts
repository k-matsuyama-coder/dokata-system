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

export async function openAssignmentFile(
  filePath: string,
  onPreview?: (url: string) => void
): Promise<void> {
  // PCのポップアップ制限対策で、クリック直後に開く
  const tab = onPreview ? null : window.open("about:blank", "_blank");

  if (!onPreview && !tab) {
    window.alert("ポップアップを許可して、もう一度開いてください。");
    return;
  }

  if (tab) {
    tab.opener = null;
    tab.document.title = "添付資料を読み込み中";
    tab.document.body.textContent = "添付資料を読み込んでいます…";
  }

  try {
    if (!filePath) {
      throw new Error("ファイルの保存先が見つかりません。");
    }

    const { data, error } = await supabase.storage
      .from("assignment-files")
      .createSignedUrl(filePath, 60 * 60);

    if (error) throw error;

    if (!data?.signedUrl) {
      throw new Error("ファイルを開くURLを取得できませんでした。");
    }

    if (onPreview) {
      onPreview(data.signedUrl);
    } else if (tab && !tab.closed) {
      tab.location.replace(data.signedUrl);
    }
  } catch {
    if (tab && !tab.closed) tab.close();

    window.alert(
      "添付資料を開けませんでした。DSの画面を再読み込みして、もう一度お試しください。"
    );
  }
}