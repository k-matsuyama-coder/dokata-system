"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type MyRequest = {
  id: string;
  item_id: string;
  user_name: string;
  start_date: string;
  return_due_date: string | null;
  status: string;
  return_photo_url: string | null;
  items: {
    item_name: string;
    item_type: string;
    classification: string | null;
    model_number: string | null;
    location: string | null;
  } | null;
};

export default function MyItemsPage() {
  const [employeeName, setEmployeeName] = useState("");
  const [requests, setRequests] = useState<MyRequest[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const fetchData = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: employee } = await supabase
      .from("employees")
      .select("name")
      .eq("auth_user_id", user.id)
      .single();

    if (!employee) return;

    setEmployeeName(employee.name);

    const { data, error } = await supabase
      .from("item_requests")
      .select(`
        id,
        item_id,
        user_name,
        start_date,
        return_due_date,
        status,
        return_photo_url,
        items (
          item_name,
          item_type,
          classification,
          model_number,
          location
        )
      `)
      .eq("user_name", employee.name)
      .in("status", ["approved", "return_requested"])
      .order("start_date", { ascending: false });

    if (error) {
      alert("貸出状況取得失敗: " + error.message);
      return;
    }

    setRequests(data ?? []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const requestReturn = async (
    requestId: string,
    itemId: string,
    file: File | null
  ) => {
    if (!file) {
      alert("返却写真を選択してください");
      return;
    }

    setUploadingId(requestId);

    const filePath = `${requestId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("item-return-photos")
      .upload(filePath, file);

    if (uploadError) {
      setUploadingId(null);
      alert("写真アップロード失敗: " + uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("item-return-photos")
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("item_requests")
      .update({
        status: "return_requested",
        return_photo_url: publicUrlData.publicUrl,
        return_photo_path: filePath,
        return_requested_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      setUploadingId(null);
      alert("返却申請失敗: " + updateError.message);
      return;
    }

    await supabase
      .from("items")
      .update({
        status: "pending_return",
      })
      .eq("id", itemId);

    await supabase.from("item_histories").insert({
      item_id: itemId,
      request_id: requestId,
      user_name: employeeName,
      action_type: "return_requested",
      photo_url: publicUrlData.publicUrl,
    });

    setUploadingId(null);
    alert("返却申請を送信しました");
    fetchData();
  };

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <h1>貸出状況確認</h1>

      <div style={{ display: "grid", gap: 12 }}>
        {requests.map((request) => (
          <div
            key={request.id}
            style={{
              backgroundColor: "#fff",
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 14,
              display: "grid",
              gap: 8,
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 18 }}>
              {request.items?.item_name || "-"}
            </div>

            <div style={{ color: "#555", fontSize: 14 }}>
              {request.items?.item_type || "-"} /{" "}
              {request.items?.classification || "-"} /{" "}
              {request.items?.model_number || "-"}
            </div>

            <div>管理場所：{request.items?.location || "-"}</div>
            <div>利用開始日：{request.start_date}</div>
            <div>返却予定日：{request.return_due_date || "-"}</div>

            <div
              style={{
                fontWeight: 800,
                color:
                  request.status === "return_requested"
                    ? "#b45309"
                    : "#166534",
              }}
            >
              状態：
              {request.status === "return_requested"
                ? "返却確認待ち"
                : "貸出中"}
            </div>

            {request.status === "approved" && (
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  requestReturn(
                    request.id,
                    request.item_id,
                    e.target.files?.[0] ?? null
                  )
                }
                disabled={uploadingId === request.id}
              />
            )}

            {request.return_photo_url && (
              <a
                href={request.return_photo_url}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#2563eb", fontWeight: 800 }}
              >
                返却写真を見る
              </a>
            )}
          </div>
        ))}

        {requests.length === 0 && (
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 16,
              color: "#666",
            }}
          >
            現在貸出中の物品はありません。
          </div>
        )}
      </div>
    </div>
  );
}