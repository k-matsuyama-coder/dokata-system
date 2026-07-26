"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { hasRole } from "../../../types/auth";
import BackButton from "@/app/components/BackButton";

type Item = {
id: string;
item_type: string;
item_name: string;
classification: string | null;
model_number: string | null;
quantity: number;
location: string | null;
manager_name: string | null;
status: string;
};

type ItemRequest = {
    id: string;
    item_id: string;
    user_name: string;
    start_date: string;
    return_due_date: string | null;
    status: string;
    return_photo_url: string | null;
  };

  const inputStyle = {
    width: "100%",
    padding: 10,
    border: "1px solid #ccc",
    borderRadius: 8,
    fontSize: 15,
    boxSizing: "border-box" as const,
  };

  const itemTypes = [
    "舗装道具",
    "佐官道具",
    "吊り道具",
    "測量機器",
    "安全用品",
    "電動工具",
    "発電機",
    "切断機",
    "転圧機",
    "養生資材",
    "車両備品",
    "通信機器",
    "事務用品",
    "その他",
  ];

  const classifications = [
    "購入",
    "リース",
    "レンタル",
  ];

export default function ItemsPage() {
const [items, setItems] = useState<Item[]>([]);
const [requests, setRequests] = useState<ItemRequest[]>([]);
const [showAddModal, setShowAddModal] = useState(false);
const [editingItem, setEditingItem] = useState<Item | null>(null);

const [itemType, setItemType] = useState("");
const [itemName, setItemName] = useState("");
const [classification, setClassification] = useState("");
const [modelNumber, setModelNumber] = useState("");
const [quantity, setQuantity] = useState("1");
const [location, setLocation] = useState("");
const [managerName, setManagerName] = useState("");
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

const fetchItems = async () => {
  const { data: userData } = await supabase.auth.getUser();
  const currentOrganizationId = await getCurrentOrganization();

if (!currentOrganizationId) {
  alert("会社情報が取得できません");
  return;
}

  if (!userData.user) {
    window.location.href = "/login";
    return;
  }

  const { data: employee } = await supabase
  .from("employees")
  .select("role")
  .eq("organization_id", currentOrganizationId)
  .eq("auth_user_id", userData.user.id)
  .single();

  if (!employee || !hasRole(employee.role, "admin")) {
    window.location.href = "/home";
    return;
  }

  const { data } = await supabase
      .from("items")
      .select("*")
      .eq("organization_id", currentOrganizationId)
      .order("item_name");
  
    setItems(data ?? []);
  
    const { data: requestData } = await supabase
      .from("item_requests")
      .select("*")
      .eq("organization_id", currentOrganizationId)
      .in("status", ["pending", "return_requested"])
      .order("created_at", { ascending: false });
  
    setRequests(requestData ?? []);
  };

useEffect(() => {
fetchItems();
}, []);

const addItem = async () => {
  const currentOrganizationId = await getCurrentOrganization();

if (!currentOrganizationId) {
  alert("会社情報が取得できません");
  return;
}
    if (!itemType || !itemName) {
      alert("種別と品名を入力してください");
      return;
    }
  
    const { error } = await supabase.from("items")
    .insert({
      organization_id: currentOrganizationId,
      item_type: itemType,
      item_name: itemName,
      classification,
      model_number: modelNumber,
      quantity: Number(quantity || 1),
      location,
      manager_name: managerName,
      status: "保管中",
    });
  
    if (error) {
      console.error("物品登録エラー:", error);
      alert("物品登録失敗: " + error.message);
      return;
    }
  
    setItemType("");
    setItemName("");
    setClassification("");
    setModelNumber("");
    setQuantity("1");
    setLocation("");
    setManagerName("");
    setShowAddModal(false);
  
    fetchItems();
  };

  const updateItem = async () => {
    if (!editingItem) return;
  
    const currentOrganizationId = await getCurrentOrganization();
  
    if (!currentOrganizationId) {
      alert("会社情報が取得できません");
      return;
    }
  
    const { error } = await supabase
      .from("items")
      .update({
        item_type: itemType,
        item_name: itemName,
        classification,
        model_number: modelNumber,
        quantity: Number(quantity || 1),
        location,
        manager_name: managerName,
      })
      .eq("organization_id", currentOrganizationId)
      .eq("id", editingItem.id);
  
    if (error) {
      alert("更新失敗: " + error.message);
      return;
    }
  
    setItemType("");
setItemName("");
setClassification("");
setModelNumber("");
setQuantity("1");
setLocation("");
setManagerName("");
setEditingItem(null);

fetchItems();
  };

const approveRequest = async (
    requestId: string,
    itemId: string
  ) => {
    const currentOrganizationId = await getCurrentOrganization();

if (!currentOrganizationId) {
  alert("会社情報が取得できません");
  return;
}

    await supabase
      .from("item_requests")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
      })
      .eq("organization_id", currentOrganizationId)
      .eq("id", requestId);
  
    await supabase
      .from("items")
      .update({
        status: "貸出中",
      })
      .eq("organization_id", currentOrganizationId)
      .eq("id", itemId);
  
    fetchItems();
  };
  
  const confirmReturn = async (
    requestId: string,
    itemId: string
  ) => {
    const currentOrganizationId = await getCurrentOrganization();
  
    if (!currentOrganizationId) {
      alert("会社情報が取得できません");
      return;
    }
  
    await supabase
      .from("item_requests")
      .update({
        status: "returned",
        returned_at: new Date().toISOString(),
      })
      .eq("organization_id", currentOrganizationId)
      .eq("id", requestId);
  
    await supabase
      .from("items")
      .update({
        status: "保管中",
      })
      .eq("organization_id", currentOrganizationId)
      .eq("id", itemId);
  
    fetchItems();
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setItemType(item.item_type);
    setItemName(item.item_name);
    setClassification(item.classification ?? "");
    setModelNumber(item.model_number ?? "");
    setQuantity(String(item.quantity));
    setLocation(item.location ?? "");
    setManagerName(item.manager_name ?? "");
  };

  const deleteItem = async (item: Item) => {
    const ok = window.confirm(
      `「${item.item_name}」を削除しますか？`
    );
  
    if (!ok) return;
  
    const currentOrganizationId = await getCurrentOrganization();
  
    if (!currentOrganizationId) {
      alert("会社情報が取得できません");
      return;
    }
  
    const { error } = await supabase
      .from("items")
      .delete()
      .eq("organization_id", currentOrganizationId)
      .eq("id", item.id);
  
    if (error) {
      alert("物品削除失敗: " + error.message);
      return;
    }
  
    fetchItems();
  };

  return (
    <>
      <div style={{ padding: 16 }}>
        <BackButton />
  
        <h1 style={{ marginTop: 12 }}>物品管理</h1>

<div style={{ marginBottom: 20 }}>
  <button
    type="button"
    onClick={() => setShowAddModal(true)}
    style={{
      padding: "12px 16px",
      border: "none",
      borderRadius: 10,
      backgroundColor: "#111",
      color: "#fff",
      fontWeight: 800,
      cursor: "pointer",
    }}
  >
    ＋ 物品追加
  </button>
</div>

{showAddModal && (
  <div
    onClick={() => setShowAddModal(false)}
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.45)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
      padding: 16,
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        maxWidth: 520,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        display: "grid",
        gap: 10,
        maxHeight: "90vh",
        overflowY: "auto",
      }}
    >
      <h2 style={{ margin: 0 }}>物品追加</h2>

      <select
  value={itemType}
  onChange={(e) => setItemType(e.target.value)}
  style={inputStyle}
>
  <option value="">
    種別を選択
  </option>

  {itemTypes.map((type) => (
    <option key={type} value={type}>
      {type}
    </option>
  ))}
</select>

      <input
        placeholder="品名"
        value={itemName}
        onChange={(e) => setItemName(e.target.value)}
        style={inputStyle}
      />

<select
  value={classification}
  onChange={(e) => setClassification(e.target.value)}
  style={inputStyle}
>
  <option value="">
    区分を選択
  </option>

  {classifications.map((item) => (
    <option key={item} value={item}>
      {item}
    </option>
  ))}
</select>

      <input
        placeholder="型番/品番"
        value={modelNumber}
        onChange={(e) => setModelNumber(e.target.value)}
        style={inputStyle}
      />

      <input
        type="number"
        placeholder="個数"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        style={inputStyle}
      />

      <input
        placeholder="管理場所"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        style={inputStyle}
      />

      <input
        placeholder="管理者"
        value={managerName}
        onChange={(e) => setManagerName(e.target.value)}
        style={inputStyle}
      />

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => setShowAddModal(false)}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 8,
            border: "1px solid #ccc",
            backgroundColor: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          キャンセル
        </button>

        <button
          type="button"
          onClick={addItem}
          style={{
            flex: 1,
            padding: 12,
            border: "none",
            borderRadius: 8,
            backgroundColor: "#111",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          登録
        </button>
      </div>
    </div>
  </div>
)}

{editingItem && (
  <div
    onClick={() => setEditingItem(null)}
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.45)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
      padding: 16,
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        maxWidth: 520,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
      }}
    >
      <>
  <h2 style={{ margin: 0 }}>物品編集</h2>

  <select
    value={itemType}
    onChange={(e) => setItemType(e.target.value)}
    style={inputStyle}
  >
    <option value="">種別を選択</option>

    {itemTypes.map((type) => (
      <option key={type} value={type}>
        {type}
      </option>
    ))}
  </select>
  <input
  placeholder="品名"
  value={itemName}
  onChange={(e) => setItemName(e.target.value)}
  style={inputStyle}
/>
<select
  value={classification}
  onChange={(e) => setClassification(e.target.value)}
  style={inputStyle}
>
  <option value="">
    区分を選択
  </option>

  {classifications.map((item) => (
    <option key={item} value={item}>
      {item}
    </option>
  ))}
</select>
<input
  placeholder="型番/品番"
  value={modelNumber}
  onChange={(e) => setModelNumber(e.target.value)}
  style={inputStyle}
/>
<input
  type="number"
  min="1"
  placeholder="個数"
  value={quantity}
  onChange={(e) => setQuantity(e.target.value)}
  style={inputStyle}
/>
<input
  placeholder="管理場所"
  value={location}
  onChange={(e) => setLocation(e.target.value)}
  style={inputStyle}
/>
<input
  placeholder="管理者"
  value={managerName}
  onChange={(e) => setManagerName(e.target.value)}
  style={inputStyle}
/>
<div style={{ display: "flex", gap: 8 }}>
  <button
    type="button"
    onClick={() => setEditingItem(null)}
    style={{
      flex: 1,
      padding: 12,
      borderRadius: 8,
      border: "1px solid #ccc",
      backgroundColor: "#fff",
      fontWeight: 700,
      cursor: "pointer",
    }}
  >
    キャンセル
  </button>

  <button
    type="button"
    onClick={updateItem}
    style={{
      flex: 1,
      padding: 12,
      border: "none",
      borderRadius: 8,
      backgroundColor: "#111",
      color: "#fff",
      fontWeight: 800,
      cursor: "pointer",
    }}
  >
    更新
  </button>
</div>
</>
    </div>
  </div>
)}

<div
  style={{
    overflowX: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
  }}
>

  <table
    style={{
      width: "100%",
      minWidth: 900,
      borderCollapse: "collapse",
      marginTop: 16,
    }}
  >
    <thead
  style={{
    position: "sticky",
    top: 0,
    backgroundColor: "#f8f8f8",
    zIndex: 1,
  }}
>
      <tr>
      <th
  style={{
    padding: "14px 10px",
    textAlign: "left",
    backgroundColor: "#f3f4f6",
    borderBottom: "2px solid #ddd",
  }}
>
  種別
</th>
<th style={{ padding: "14px 10px", textAlign: "left", backgroundColor: "#f3f4f6", borderBottom: "2px solid #ddd" }}>
  品名
</th>
<th style={{ padding: "14px 10px", textAlign: "left", backgroundColor: "#f3f4f6", borderBottom: "2px solid #ddd" }}>
  区分
</th>
<th style={{ padding: "14px 10px", textAlign: "left", backgroundColor: "#f3f4f6", borderBottom: "2px solid #ddd" }}>
  型番
</th>
<th style={{ padding: "14px 10px", textAlign: "left", backgroundColor: "#f3f4f6", borderBottom: "2px solid #ddd" }}>
  個数
</th>
<th style={{ padding: "14px 10px", textAlign: "left", backgroundColor: "#f3f4f6", borderBottom: "2px solid #ddd" }}>
  管理場所
</th>
<th style={{ padding: "14px 10px", textAlign: "left", backgroundColor: "#f3f4f6", borderBottom: "2px solid #ddd" }}>
  管理者
</th>
<th style={{ padding: 10, textAlign: "left", backgroundColor: "#f3f4f6", borderBottom: "2px solid #ddd" }}>
  状態
</th>
<th style={{ padding: 10, textAlign: "left", backgroundColor: "#f3f4f6", borderBottom: "2px solid #ddd" }}>
  操作
</th>
      </tr>
    </thead>
    <tbody>
      {items.map((item) => (
        <tr
        key={item.id}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#f9fafb";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#fff";
        }}
      >
          <td
  style={{
    padding: "12px 14px",
    borderBottom: "1px solid #eee",
  }}
>
  {item.item_type}
</td>
<td style={{ padding: "12px 14px", borderBottom: "1px solid #eee" }}>
  {item.item_name}
</td>
<td style={{ padding: "12px 14px", borderBottom: "1px solid #eee" }}>
  {item.classification || "-"}
</td>
<td style={{ padding: "12px 14px", borderBottom: "1px solid #eee" }}>
  {item.model_number || "-"}
</td>
<td style={{ padding: "12px 14px", borderBottom: "1px solid #eee" }}>
  {item.quantity}
</td>
<td style={{ padding: "12px 14px", borderBottom: "1px solid #eee" }}>
  {item.location || "-"}
</td>
<td style={{ padding: "12px 14px", borderBottom: "1px solid #eee" }}>
  {item.manager_name || "-"}
</td>
<td
  style={{
    padding: 10,
    borderBottom: "1px solid #eee",
    textAlign: "center",
  }}
>
  <span
    style={{
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: 999,
      fontWeight: 700,
      backgroundColor:
        item.status === "保管中" ? "#dcfce7" : "#dbeafe",
      color:
        item.status === "保管中" ? "#166534" : "#1d4ed8",
    }}
  >
    {item.status}
  </span>
</td>
<td
  style={{
    padding: 10,
    borderBottom: "1px solid #eee",
    whiteSpace: "nowrap",
  }}
>
  
          <button
  type="button"
  onClick={() => openEditModal(item)}
  style={{
    border: "none",
    borderRadius: 6,
    padding: "6px 10px",
    backgroundColor: "#2563eb",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    marginRight: 8,
  }}
>
  編集
</button>
  <button
    type="button"
    onClick={() => deleteItem(item)}
    style={{
      border: "none",
      borderRadius: 6,
      padding: "6px 10px",
      backgroundColor: "#dc2626",
      color: "#fff",
      fontWeight: 800,
      cursor: "pointer",
    }}
  >
    削除
  </button>
</td>
        </tr>
      ))}
    </tbody>
  </table>
  </div>
  

  <h2 style={{ marginTop: 40 }}>
  貸出申請一覧
</h2>

<div
  style={{
    display: "grid",
    gap: 12,
  }}
>
  {requests.map((request) => (
    <div
      key={request.id}
      style={{
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div>
        使用者：{request.user_name}
      </div>

      <div>
        開始日：{request.start_date}
      </div>

      <div>
        返却予定日：
        {request.return_due_date || "-"}
      </div>

      <div>
        状態：{request.status}
      </div>

      {request.return_photo_url && (
        <a
          href={request.return_photo_url}
          target="_blank"
          rel="noreferrer"
        >
          返却写真を見る
        </a>
      )}

      {request.status === "pending" && (
        <button
          onClick={() =>
            approveRequest(
              request.id,
              request.item_id
            )
          }
        >
          承認
        </button>
      )}

      {request.status === "return_requested" && (
        <button
          onClick={() =>
            confirmReturn(
              request.id,
              request.item_id
            )
          }
        >
          返却確認
        </button>
      )}
    </div>
  ))}
</div>

</div>
  </>
);
}