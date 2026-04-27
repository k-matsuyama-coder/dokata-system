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
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);

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

    useEffect(() => {
      const fetchCompanies = async () => {
        const { data } = await supabase
          .from("companies")
          .select("id, name")
          .order("name");
    
        setCompanies(data ?? []);
      };
    
      fetchCompanies();
    }, []);

    if (id) fetchUser();
  }, [id]);

  const handleUpdate = async () => {
    const { error } = await supabase
      .from("employees")
      .update({
        company_name: companyName,
        role,
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
  <select
    value={role}
    onChange={(e) => setRole(e.target.value)}
    style={{ width: "100%", padding: 10 }}
  >
    <option value="worker">worker</option>
    <option value="admin">admin</option>
  </select>
</div>

      <div style={{ marginBottom: 16 }}>
        <p>所属会社</p>
        <select
  value={companyName}
  onChange={(e) => setCompanyName(e.target.value)}
  style={{ width: "100%", padding: 10 }}
>
  <option value="">選択してください</option>

  {companies.map((c) => (
    <option key={c.id} value={c.name}>
      {c.name}
    </option>
  ))}
</select>
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