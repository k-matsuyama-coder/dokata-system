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
  approved_at: string | null;
  return_requested_at: string | null;
  returned_at: string | null;
  return_photo_url: string | null;
  items: {
    item_name: string;
    item_type: string;
    classification: string | null;
    model_number: string | null;
    location: string | null;
    manager_name: string | null;
  } | null;
};

export default function ItemHistoryPage() {
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchHistory = async () => {
    let query = supabase
      .from("item_requests")
      .select(`
        id,
        item_id,
        user_name,
        start_date,
        return_due_date,
        status,
        approved_at,
        return_requested_at,
        returned_at,
        return_photo_url,
        items (
          item_name,
          item_type,
          classification,
          model_number,
          location,
          manager_name
        )
      `)
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      alert("履歴取得失敗: " + error.message);
      return;
    }

    setRequests(data ?? []);
  };

  useEffect(() => {
    fetchHistory();
  }, [statusFilter]);

  const getStatusLabel = (status: string) => {
    if (status === "pending") return "申請中";
    if (status === "approved") return "貸出中";
    if (status === "return_requested") return "返却確認待ち";
    if (status === "returned") return "返却済み";
    return status;
  };

  const getStatusColor = (status: string) => {
    if (status === "pending") return "#92400e";
    if (status === "approved") return "#166534";
    if (status === "return_requested") return "#b45309";
    if (status === "returned") return "#2563eb";
    return "#111";
  };

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <h1>物品使用履歴</h1>

      <div style={{ marginBottom: 16 }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 15,
          }}
        >
          <option value="all">すべて</option>
          <option value="pending">申請中</option>
          <option value="approved">貸出中</option>
          <option value="return_requested">返却確認待ち</option>
          <option value="returned">返却済み</option>
        </select>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "#fff",
            minWidth: 900,
          }}
        >
          <thead>
            <tr>
              <th style={th}>状態</th>
              <th style={th}>使用者</th>
              <th style={th}>品名</th>
              <th style={th}>種別</th>
              <th style={th}>区分</th>
              <th style={th}>型番/品番</th>
              <th style={th}>管理場所</th>
              <th style={th}>管理者</th>
              <th style={th}>利用開始日</th>
              <th style={th}>返却予定日</th>
              <th style={th}>承認日</th>
              <th style={th}>返却申請日</th>
              <th style={th}>返却完了日</th>
              <th style={th}>返却写真</th>
            </tr>
          </thead>

          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td
                  style={{
                    ...td,
                    fontWeight: 800,
                    color: getStatusColor(request.status),
                  }}
                >
                  {getStatusLabel(request.status)}
                </td>
                <td style={td}>{request.user_name}</td>
                <td style={{ ...td, fontWeight: 800 }}>
                  {request.items?.item_name || "-"}
                </td>
                <td style={td}>{request.items?.item_type || "-"}</td>
                <td style={td}>{request.items?.classification || "-"}</td>
                <td style={td}>{request.items?.model_number || "-"}</td>
                <td style={td}>{request.items?.location || "-"}</td>
                <td style={td}>{request.items?.manager_name || "-"}</td>
                <td style={td}>{request.start_date}</td>
                <td style={td}>{request.return_due_date || "-"}</td>
                <td style={td}>
                  {request.approved_at
                    ? request.approved_at.slice(0, 10)
                    : "-"}
                </td>
                <td style={td}>
                  {request.return_requested_at
                    ? request.return_requested_at.slice(0, 10)
                    : "-"}
                </td>
                <td style={td}>
                  {request.returned_at
                    ? request.returned_at.slice(0, 10)
                    : "-"}
                </td>
                <td style={td}>
                  {request.return_photo_url ? (
                    <a
                      href={request.return_photo_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: "#2563eb",
                        fontWeight: 800,
                      }}
                    >
                      写真
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}

            {requests.length === 0 && (
              <tr>
                <td style={td} colSpan={14}>
                  履歴はありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = {
  border: "1px solid #ddd",
  padding: 10,
  backgroundColor: "#f3f4f6",
  whiteSpace: "nowrap" as const,
  textAlign: "center" as const,
};

const td = {
  border: "1px solid #ddd",
  padding: 10,
  whiteSpace: "nowrap" as const,
  textAlign: "center" as const,
};