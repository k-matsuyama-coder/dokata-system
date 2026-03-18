"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

export default function UserDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("name, role, company_name")
        .eq("id", id)
        .single();

      if (error || !data) {
        alert("社員取得失敗");
        return;
      }

      setName(data.name ?? "");
      setRole(data.role ?? "");
      setCompanyName(data.company_name ?? "");
    };

    if (id) fetchUser();
  }, [id]);

  const handleUpdate = async () => {
    const { error } = await supabase
      .from("employees")
      .update({
        company_name: companyName,
      })
      .eq("id", id);

    if (error) {
      alert("更新失敗: " + error.message);
      return;
    }

    alert("会社情報を更新しました");
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <BackButton />
      <h1>社員詳細</h1>

      <div style={{ marginBottom: 16 }}>
        <p>名前</p>
        <input value={name} readOnly style={{ width: "100%", padding: 10 }} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <p>権限</p>
        <input value={role} readOnly style={{ width: "100%", padding: 10 }} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <p>所属会社</p>
        <input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          style={{ width: "100%", padding: 10 }}
          placeholder="会社名を入力"
        />
      </div>

      <button
        onClick={handleUpdate}
        style={{
          width: "100%",
          padding: 12,
          backgroundColor: "#111",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        保存
      </button>
    </div>
  );
}