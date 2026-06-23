"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ItemRequest = {
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

export default function ItemRequestsAdminPage() {
  const [requests, setRequests] = useState<ItemRequest[]>([]);

  const fetchRequests = async () => {
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
      .in("status", ["pending", "return_requested"])
      .order("created_at", { ascending: false });

    if (error) {
      alert("申請取得失敗: " + error.message);
      return;
    }

    setRequests(data ?? []);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const approveRequest = async (request: ItemRequest) => {
    const { error: requestError } = await supabase
      .from("item_requests")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    if (requestError) {
      alert("承認失敗: " + requestError.message);
      return;
    }

    const { error: itemError } = await supabase
      .from("items")
      .update({
        status: "貸出中",
      })
      .eq("id", request.item_id);

    if (itemError) {
      alert("物品状態更新失敗: " + itemError.message);
      return;
    }

    await supabase.from("item_histories").insert({
      item_id: request.item_id,
      request_id: request.id,
      user_name: request.user_name,
      action_type: "approved",
    });

    alert("承認しました");
    fetchRequests();
  };

  const confirmReturn = async (request: ItemRequest) => {
    const { error: requestError } = await supabase
      .from("item_requests")
      .update({
        status: "returned",
        returned_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    if (requestError) {
      alert("返却確認失敗: " + requestError.message);
      return;
    }

    const { error: itemError } = await supabase
      .from("items")
      .update({
        status: "保管中",
      })
      .eq("id", request.item_id);

    if (itemError) {
      alert("物品状態更新失敗: " + itemError.message);
      return;
    }

    await supabase.from("item_histories").insert({
      item_id: request.item_id,
      request_id: request.id,
      user_name: request.user_name,
      action_type: "returned",
      photo_url: request.return_photo_url,
    });

    alert("返却確認しました");
    fetchRequests();
  };

  return (
    <div style={{ padding: 16, maxWidth: 1000, margin: "0 auto" }}>
      <h1>物品申請確認</h1>

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

            <div>使用者：{request.user_name}</div>
            <div>管理場所：{request.items?.location || "-"}</div>
            <div>利用開始日：{request.start_date}</div>
            <div>返却予定日：{request.return_due_date || "-"}</div>

            <div
              style={{
                fontWeight: 800,
                color:
                  request.status === "pending"
                    ? "#b45309"
                    : "#2563eb",
              }}
            >
              状態：
              {request.status === "pending"
                ? "使用申請中"
                : "返却確認待ち"}
            </div>

            {request.return_photo_url && (
              <a
                href={request.return_photo_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "#2563eb",
                  fontWeight: 800,
                }}
              >
                返却写真を見る
              </a>
            )}

            {request.status === "pending" && (
              <button
                type="button"
                onClick={() => approveRequest(request)}
                style={buttonStyle}
              >
                使用承認
              </button>
            )}

            {request.status === "return_requested" && (
              <button
                type="button"
                onClick={() => confirmReturn(request)}
                style={buttonStyle}
              >
                返却確認
              </button>
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
            確認待ちの申請はありません。
          </div>
        )}
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: 12,
  border: "none",
  borderRadius: 8,
  backgroundColor: "#111",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};