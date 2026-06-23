"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

  const fetchData = async () => {
    const { data } = await supabase
      .from("items")
      .select("*")
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

  const submitRequest = async () => {
    if (!selectedItemId) {
      alert("物品を選択してください");
      return;
    }

    if (!startDate || !returnDate) {
      alert("日付を入力してください");
      return;
    }

    const { error } = await supabase
      .from("item_requests")
      .insert({
        item_id: selectedItemId,
        user_name: employeeName,
        start_date: startDate,
        return_due_date: returnDate,
        status: "pending",
      });

    if (error) {
      alert(error.message);
      return;
    }

    await supabase
      .from("items")
      .update({
        status: "申請中",
      })
      .eq("id", selectedItemId);

      const selectedItem = items.find((item) => item.id === selectedItemId);

const { data: admins } = await supabase
  .from("employees")
  .select("name")
  .eq("role", "admin");

if (admins && admins.length > 0) {
  await supabase.from("notifications").insert(
    admins.map((admin) => ({
      employee_name: admin.name,
      title: "物品使用申請",
      message: `${employeeName}さんが「${selectedItem?.item_name ?? "物品"}」の使用申請をしました`,
      link_url: "/admin/items/requests",
      is_read: false,
    }))
  );
}

const pushResults = await Promise.all(
    admins.map(async (admin) => {
      const res = await fetch("/api/send-push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeName: admin.name,
          title: "物品使用申請",
          message: `${employeeName}さんが「${selectedItem?.item_name ?? "物品"}」の使用申請をしました`,
          url: "/admin/items/requests",
        }),
      });
  
      return await res.json();
    })
  );
  
  console.log("物品Push送信結果", pushResults);

    alert("使用申請しました");

    setSelectedItemId("");
    setStartDate("");
    setReturnDate("");

    fetchData();
  };

  return (
    <div
      style={{
        padding: 16,
        maxWidth: 700,
        margin: "0 auto",
      }}
    >
      <h1>使用申請</h1>

      <div
        style={{
          display: "grid",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <select
          value={selectedItemId}
          onChange={(e) => setSelectedItemId(e.target.value)}
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

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <input
          type="date"
          value={returnDate}
          onChange={(e) => setReturnDate(e.target.value)}
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