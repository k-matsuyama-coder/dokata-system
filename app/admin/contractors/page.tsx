"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type Contractor = {
  id: string;
  name: string;
};

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [name, setName] = useState("");

  const fetchContractors = async () => {
    const { data, error } = await supabase
      .from("contractors")
      .select("id, name")
      .order("created_at", { ascending: false });

    if (error) {
      alert("元請取得失敗: " + error.message);
      return;
    }

    setContractors(data ?? []);
  };

  useEffect(() => {
    fetchContractors();
  }, []);

  const handleAdd = async () => {
    if (!name.trim()) {
      alert("元請名を入力してください");
      return;
    }

    const { error } = await supabase
      .from("contractors")
      .insert({ name: name.trim() });

    if (error) {
      alert("追加失敗: " + error.message);
      return;
    }

    setName("");
    fetchContractors();
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm("この元請を削除しますか？");
    if (!ok) return;

    const { error } = await supabase.from("contractors").delete().eq("id", id);

    if (error) {
      alert("削除失敗: " + error.message);
      return;
    }

    fetchContractors();
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 16 }}>
      <BackButton />

      <h1>元請管理</h1>

      <button
  onClick={() => {
    const csv = "元請名\n〇〇建設\n△△土木\n□□工業";

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "contractors_template.csv";
    a.click();

    URL.revokeObjectURL(url);
  }}
  style={{
    marginBottom: 12,
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #ccc",
    backgroundColor: "#fff",
    cursor: "pointer",
  }}
>
  テンプレートダウンロード
</button>
<div style={{ marginBottom: 20 }}>
  <p style={{ margin: "0 0 8px 0", fontWeight: "bold" }}>
    CSV一括登録
  </p>

  <input
    type="file"
    accept=".csv"
    onChange={async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const text = await file.text();

      const names = text
        .split("\n")
        .slice(1)
        .map((line) => line.trim().replace("\r", ""))
        .filter(Boolean);

      if (names.length === 0) {
        alert("登録できる元請がありません");
        return;
      }

      const insertData = names.map((name) => ({
        name,
      }));

      const { error } = await supabase
        .from("contractors")
        .insert(insertData);

      if (error) {
        alert("アップロード失敗: " + error.message);
        return;
      }

      alert("元請CSV登録完了");
      fetchContractors();
    }}
  />
</div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="元請名"
          style={{
            flex: 1,
            padding: 12,
            border: "1px solid #ccc",
            borderRadius: 8,
            fontSize: 16,
          }}
        />

        <button
          onClick={handleAdd}
          style={{
            padding: "12px 16px",
            backgroundColor: "#111",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          追加
        </button>
      </div>

      {contractors.length === 0 ? (
        <p>元請が登録されていません</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {contractors.map((contractor) => (
            <div
              key={contractor.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 12,
                backgroundColor: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontWeight: 600 }}>{contractor.name}</span>

              <button
                onClick={() => handleDelete(contractor.id)}
                style={{
                  backgroundColor: "#d11a2a",
                  color: "#fff",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                削除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}