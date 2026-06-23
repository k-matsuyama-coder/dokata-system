"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

export default function ItemsPage() {
const [items, setItems] = useState<Item[]>([]);
const [requests, setRequests] = useState<ItemRequest[]>([]);

const [itemType, setItemType] = useState("");
const [itemName, setItemName] = useState("");
const [classification, setClassification] = useState("");
const [modelNumber, setModelNumber] = useState("");
const [quantity, setQuantity] = useState("1");
const [location, setLocation] = useState("");
const [managerName, setManagerName] = useState("");

const fetchItems = async () => {
    const { data } = await supabase
      .from("items")
      .select("*")
      .order("item_name");
  
    setItems(data ?? []);
  
    const { data: requestData } = await supabase
      .from("item_requests")
      .select("*")
      .in("status", ["pending", "return_requested"])
      .order("created_at", { ascending: false });
  
    setRequests(requestData ?? []);
  };

useEffect(() => {
fetchItems();
}, []);

const addItem = async () => {
const { error } = await supabase
.from("items")
.insert({
item_type: itemType,
item_name: itemName,
classification: classification,
model_number: modelNumber,
quantity: Number(quantity),
location: location,
manager_name: managerName,
});

if (error) {
  alert(error.message);
  return;
}
setItemType("");
setItemName("");
setClassification("");
setModelNumber("");
setQuantity("1");
setLocation("");
setManagerName("");
fetchItems();

};

const approveRequest = async (
    requestId: string,
    itemId: string
  ) => {
    await supabase
      .from("item_requests")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
      })
      .eq("id", requestId);
  
    await supabase
      .from("items")
      .update({
        status: "貸出中",
      })
      .eq("id", itemId);
  
    fetchItems();
  };
  
  const confirmReturn = async (
    requestId: string,
    itemId: string
  ) => {
    await supabase
      .from("item_requests")
      .update({
        status: "returned",
        returned_at: new Date().toISOString(),
      })
      .eq("id", requestId);
  
    await supabase
      .from("items")
      .update({
        status: "保管中",
      })
      .eq("id", itemId);
  
    fetchItems();
  };

return (
<div style={{ padding: 16 }}>
物品管理

  <div
    style={{
      display: "grid",
      gap: 8,
      marginBottom: 20,
    }}
  >
    <input
      placeholder="種別"
      value={itemType}
      onChange={(e) => setItemType(e.target.value)}
    />
    <input
      placeholder="品名"
      value={itemName}
      onChange={(e) => setItemName(e.target.value)}
    />
    <input
      placeholder="区分"
      value={classification}
      onChange={(e) => setClassification(e.target.value)}
    />
    <input
      placeholder="型番/品番"
      value={modelNumber}
      onChange={(e) => setModelNumber(e.target.value)}
    />
    <input
      type="number"
      placeholder="個数"
      value={quantity}
      onChange={(e) => setQuantity(e.target.value)}
    />
    <input
      placeholder="管理場所"
      value={location}
      onChange={(e) => setLocation(e.target.value)}
    />
    <input
      placeholder="管理者"
      value={managerName}
      onChange={(e) => setManagerName(e.target.value)}
    />
    <button onClick={addItem}>
      登録
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
        <th>種別</th>
        <th>品名</th>
        <th>区分</th>
        <th>型番</th>
        <th>個数</th>
        <th>管理場所</th>
        <th>管理者</th>
        <th>状態</th>
      </tr>
    </thead>
    <tbody>
      {items.map((item) => (
        <tr key={item.id}>
          <td>{item.item_type}</td>
          <td>{item.item_name}</td>
          <td>{item.classification}</td>
          <td>{item.model_number}</td>
          <td>{item.quantity}</td>
          <td>{item.location}</td>
          <td>{item.manager_name}</td>
          <td>{item.status}</td>
        </tr>
      ))}
    </tbody>
  </table>

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

);
}