import { supabase } from "@/lib/supabase";

type SendPushNotificationParams = {
  organizationId: string;
  employeeName: string;
  title: string;
  message: string;
  url?: string;
};

type SendPushNotificationResult = {
  success: boolean;
  message?: string;
  sentCount?: number;
};

export async function sendPushNotification({
  organizationId,
  employeeName,
  title,
  message,
  url,
}: SendPushNotificationParams): Promise<SendPushNotificationResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;

  if (!accessToken) {
    throw new Error("ログイン情報がありません");
  }

  const response = await fetch("/api/send-push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      organizationId,
      employeeName,
      title,
      message,
      url,
    }),
  });

  const result = (await response.json().catch(() => ({
    success: false,
    message: "Push通知APIの応答を読み込めませんでした",
  }))) as SendPushNotificationResult;

  if (!response.ok) {
    throw new Error(result.message || "Push通知の送信に失敗しました");
  }

  return result;
}