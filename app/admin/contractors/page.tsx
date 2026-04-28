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