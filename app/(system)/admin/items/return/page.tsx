"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type ItemRequest = {
  id: string;
  item_id: string;
  user_name: string;
  start_date: string;
  return_due_date: string | null;
  status: string;
  items: {
    item_name: string;
    item_type: string;
    classification: string | null;
    model_number: string | null;
    location: string | null;
  } | null;
};

export default function ItemReturnPage() {
  const [employeeName, setEmployeeName] = useState("");
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const getCurrentOrganization = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
  
    if (!token) return null;
  
    const res = await fetch("/api/current-organization", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  
    const result = await res.json();
  
    if (!res.ok) return null;
  
    return result.organizationId as string | null;
  };

  const fetchData = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const currentOrganizationId = await getCurrentOrganization();

if (!currentOrganizationId) {
  alert("会社情報が取得できません");
  return;
}

const { data: employee } = await supabase
.from("employees")
.select("name")
.eq("organization_id", currentOrganizationId)
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
        items (
          item_name,
          item_type,
          classification,
          model_number,
          location
        )
      `)
      .eq("organization_id", currentOrganizationId)
      .eq("user_name", employee.name)
      .eq("status", "approved")
      .order("start_date", { ascending: false });

    if (error) {
      alert("貸出中物品の取得失敗: " + error.message);
      return;
    }

    setRequests(data ?? []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const submitReturn = async (
    requestId: string,
    itemId: string,
    file: File | null
  ) => {
    if (!file) {
      alert("返却写真を選択してください");
      return;
    }

    const currentOrganizationId = await getCurrentOrganization();

if (!currentOrganizationId) {
  alert("会社情報が取得できません");
  setUploadingId(null);
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

    const { error: requestError } = await supabase
      .from("item_requests")
      .update({
        status: "return_requested",
        return_photo_url: publicUrlData.publicUrl,
        return_photo_path: filePath,
        return_requested_at: new Date().toISOString(),
      })
      .eq("organization_id", currentOrganizationId)
      .eq("id", requestId);

    if (requestError) {
      setUploadingId(null);
      alert("返却申請失敗: " + requestError.message);
      return;
    }

    await supabase
      .from("items")
      .update({
        status: "pending_return",
      })
      .eq("organization_id", currentOrganizationId)
      .eq("id", itemId);

      console.log("返却通知処理開始");

const historyResult = await supabase
  .from("item_histories")
  .insert({
    organization_id: currentOrganizationId,
    item_id: itemId,
    request_id: requestId,
    user_name: employeeName,
    action_type: "return_requested",
    photo_url: publicUrlData.publicUrl,
  });

console.log("履歴保存結果", historyResult);

const { data: admins, error: adminError } = await supabase
  .from("employees")
  .select("name")
  .eq("organization_id", currentOrganizationId)
  .eq("role", "admin");

console.log("admins", admins);
console.log("adminError", adminError);

if (admins && admins.length > 0) {
  await supabase.from("notifications").insert(
    admins.map((admin) => ({
      organization_id: currentOrganizationId,
      employee_name: admin.name,
      title: "物品返却申請",
      message: `${employeeName}さんが物品の返却申請をしました`,
      link_url: "/admin/items/requests",
      is_read: false,
    }))
  );

  const pushResults = await Promise.all(
    admins.map(async (admin) => {
      const res = await fetch("/api/send-push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: currentOrganizationId,
          employeeName: admin.name,
          title: "物品返却申請",
          message: `${employeeName}さんが物品の返却申請をしました`,
          url: "/admin/items/requests",
        }),
      });

      return await res.json();
    })
  );

  console.log("物品返却Push送信結果", pushResults);
}

    setUploadingId(null);
    alert("返却申請を送信しました");
    fetchData();
  };

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <BackButton />

      <h1>物品返却申請</h1>

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

            <input
              type="file"
              accept="image/*"
              disabled={uploadingId === request.id}
              onChange={(e) =>
                submitReturn(
                  request.id,
                  request.item_id,
                  e.target.files?.[0] ?? null
                )
              }
            />

            {uploadingId === request.id && (
              <div style={{ color: "#666", fontWeight: 700 }}>
                アップロード中...
              </div>
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
            現在返却申請できる物品はありません。
          </div>
        )}
      </div>
    </div>
  );
}