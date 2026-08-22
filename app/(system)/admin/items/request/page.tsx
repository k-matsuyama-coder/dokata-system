"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";
import { sendPushNotification } from "@/lib/sendPushNotification";

type Item = {
  id: string;
  item_name: string;
  item_type: string;
  quantity: number;
  status: string;
};

export default function ItemRequestPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [employeeName, setEmployeeName] = useState("");
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
    const currentOrganizationId = await getCurrentOrganization();
  
    if (!currentOrganizationId) {
      alert("会社情報が取得できません");
      return;
    }
  
    const { data } = await supabase
      .from("items")
      .select("*")
      .eq("organization_id", currentOrganizationId)
      .order("item_name");
  
    setItems(data ?? []);
  };

  useEffect(() => {
    const init = async () => {
      const { data: userData } = await supabase.auth.getUser();

      const user = userData.user;

      if (!user) return;

      const { data: employee } = await supabase
        .from("employees")
        .select("name")
        .eq("auth_user_id", user.id)
        .single();

      if (employee) {
        setEmployeeName(employee.name);
      }

      fetchData();
    };

    init();
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
  
    const subscribeToItemChanges = async () => {
      const currentOrganizationId = await getCurrentOrganization();
  
      if (!currentOrganizationId) return;
  
      channel = supabase
        .channel(`item-request-items-${currentOrganizationId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "items",
            filter: `organization_id=eq.${currentOrganizationId}`,
          },
          () => {
            void fetchData();
          }
        )
        .subscribe();
    };
  
    void subscribeToItemChanges();
  
    return () => {
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, []);

  const submitRequest = async () => {
    const currentOrganizationId = await getCurrentOrganization();
  
    if (!currentOrganizationId) {
      alert("会社情報が取得できません");
      return;
    }
  
    if (!selectedItemId) {
      alert("物品を選択してください");
      return;
    }
  
    if (!startDate || !returnDate) {
      alert("日付を入力してください");
      return;
    }
  
    if (returnDate < startDate) {
      alert("返却予定日は利用開始日以降にしてください");
      return;
    }
  
    const selectedItem = items.find((item) => item.id === selectedItemId);
  
    if (!selectedItem) {
      alert("選択した物品が見つかりません");
      await fetchData();
      return;
    }
  
    const { data: reservedItem, error: reserveError } = await supabase
      .from("items")
      .update({
        status: "申請中",
      })
      .eq("organization_id", currentOrganizationId)
      .eq("id", selectedItemId)
      .eq("status", "保管中")
      .select("id")
      .maybeSingle();
  
    if (reserveError) {
      alert("物品の状態確認に失敗しました: " + reserveError.message);
      return;
    }
  
    if (!reservedItem) {
      alert("この物品は他の人が申請済みです");
      setSelectedItemId("");
      await fetchData();
      return;
    }
  
    const { error: requestError } = await supabase
      .from("item_requests")
      .insert({
        organization_id: currentOrganizationId,
        item_id: selectedItemId,
        user_name: employeeName,
        start_date: startDate,
        return_due_date: returnDate,
        status: "pending",
      });
  
    if (requestError) {
      await supabase
        .from("items")
        .update({
          status: "保管中",
        })
        .eq("organization_id", currentOrganizationId)
        .eq("id", selectedItemId)
        .eq("status", "申請中");
  
      alert("申請登録に失敗しました: " + requestError.message);
      await fetchData();
      return;
    }
  
    const { data: admins, error: adminsError } = await supabase
      .from("employees")
      .select("name")
      .eq("organization_id", currentOrganizationId)
      .eq("role", "admin");
  
    if (!adminsError && admins && admins.length > 0) {
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(
          admins.map((admin) => ({
            organization_id: currentOrganizationId,
            employee_name: admin.name,
            title: "物品使用申請",
            message: `${employeeName}さんが「${selectedItem.item_name}」の使用申請をしました`,
            link_url: "/admin/items/requests",
            is_read: false,
          }))
        );
  
      if (notificationError) {
        console.error("通知登録失敗:", notificationError);
      }
  
      const pushResults = await Promise.allSettled(
        admins.map(async (admin) => {
          return await sendPushNotification({
            organizationId: currentOrganizationId,
            employeeName: admin.name,
            title: "物品使用申請",
            message: `${employeeName}さんが「${selectedItem.item_name}」の使用申請をしました`,
            url: "/admin/items/requests",
          });
        })
      );
  
      console.log("物品Push送信結果", pushResults);
    }
  
    alert("使用申請しました");
  
    setSelectedItemId("");
    setStartDate("");
    setReturnDate("");
  
    await fetchData();
  };

  return (
    <div
      style={{
        padding: 16,
        maxWidth: 700,
        margin: "0 auto",
      }}
    >
      <BackButton />

      <h1>使用申請</h1>

      <div
        style={{
          display: "grid",
          gap: 12,
          marginBottom: 20,
        }}
      >

<label style={{ fontWeight: 600 }}>
  利用する物品
</label>
        <select
          value={selectedItemId}
          onChange={(e) => setSelectedItemId(e.target.value)}
          style={{
            padding: 10,
            border: "1px solid #ccc",
            borderRadius: 8,
            fontSize: 16,
            boxSizing: "border-box",
          }}
        >
          <option value="">
            物品を選択
          </option>

          {items
            .filter((item) => item.status === "保管中")
            .map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.item_name}
              </option>
            ))}
        </select>

        <label style={{ fontWeight: 600 }}>

  利用開始日

</label>

        <input
  type="date"
  value={startDate}
  onChange={(e) => setStartDate(e.target.value)}
  style={{
    padding: 10,
    border: "1px solid #ccc",
    borderRadius: 8,
    fontSize: 16,
    boxSizing: "border-box",
  }}
/>

<label style={{ fontWeight: 600 }}>
  返却予定日
</label>

<input
  type="date"
  value={returnDate}
  onChange={(e) => setReturnDate(e.target.value)}
  style={{
    padding: 10,
    border: "1px solid #ccc",
    borderRadius: 8,
    fontSize: 16,
    boxSizing: "border-box",
  }}
/>

        <button
          onClick={submitRequest}
          style={{
            padding: 12,
            border: "none",
            borderRadius: 8,
            backgroundColor: "#111",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          使用申請
        </button>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th>品名</th>
            <th>種別</th>
            <th>個数</th>
            <th>状態</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.item_name}</td>
              <td>{item.item_type}</td>
              <td>{item.quantity}</td>
              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}