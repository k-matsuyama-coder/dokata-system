"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type Company = {
  id: string;
  name: string;
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [name, setName] = useState("");

  const fetchCompanies = async () => {
    const { data } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });

    setCompanies(data ?? []);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleAdd = async () => {
    if (!name) return alert("会社名を入力");

    const { error } = await supabase.from("companies").insert({ name });

    if (error) {
      alert(error.message);
      return;
    }

    setName("");
    fetchCompanies();
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm("削除しますか？");
    if (!ok) return;

    await supabase.from("companies").delete().eq("id", id);
    fetchCompanies();
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 16 }}>
      <BackButton />

      <h1>会社管理</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="会社名"
          style={{ flex: 1, padding: 10 }}
        />
        <button onClick={handleAdd}>追加</button>
      </div>

      {companies.map((c) => (
        <div
          key={c.id}
          style={{
            border: "1px solid #ccc",
            padding: 12,
            marginBottom: 8,
            borderRadius: 8,
          }}
        >
          {c.name}

          <button
            onClick={() => handleDelete(c.id)}
            style={{ marginLeft: 10 }}
          >
            削除
          </button>
        </div>
      ))}
    </div>
  );
}