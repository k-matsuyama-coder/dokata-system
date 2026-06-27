"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type Organization = {
  id: string;
  name: string;
};

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationName, setOrganizationName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [createdPassword, setCreatedPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchOrganizations = async () => {
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name")
      .order("name");

    if (error) {
      alert("会社取得失敗: " + error.message);
      return;
    }

    setOrganizations(data ?? []);
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleCreate = async () => {
    if (!organizationName || !adminFirstName || !adminEmail) {
      alert("会社名・管理者名・メールアドレスを入力してください");
      return;
    }

    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      alert("ログイン情報がありません");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/super-admin/create-organization", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        organizationName,
        adminLastName,
        adminFirstName,
        adminEmail,
      }),
    });

    const result = await res.json();

    setLoading(false);

    if (!res.ok) {
      alert(result.error || "会社作成失敗");
      return;
    }

    setCreatedPassword(result.password);

    setOrganizationName("");
    setAdminLastName("");
    setAdminFirstName("");
    setAdminEmail("");

    alert("会社と初期管理者を作成しました");
    fetchOrganizations();
  };

  const inputStyle = {
    width: "100%",
    padding: 12,
    border: "1px solid #ccc",
    borderRadius: 8,
    fontSize: 16,
    boxSizing: "border-box" as const,
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 16 }}>
      <BackButton />

      <h1>会社管理</h1>

      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 16,
          display: "grid",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: 0 }}>会社追加</h2>

        <input
          placeholder="会社名"
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="管理者 苗字"
          value={adminLastName}
          onChange={(e) => setAdminLastName(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="管理者 名前"
          value={adminFirstName}
          onChange={(e) => setAdminFirstName(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="管理者メールアドレス"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          style={inputStyle}
        />

        <button
          type="button"
          onClick={handleCreate}
          disabled={loading}
          style={{
            padding: 14,
            border: "none",
            borderRadius: 8,
            backgroundColor: loading ? "#999" : "#111",
            color: "#fff",
            fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "作成中..." : "会社と初期管理者を作成"}
        </button>

        {createdPassword && (
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 12,
              backgroundColor: "#f9fafb",
            }}
          >
            <div style={{ fontWeight: 800 }}>初期パスワード</div>
            <div style={{ fontSize: 20, fontWeight: 900, marginTop: 6 }}>
              {createdPassword}
            </div>
          </div>
        )}
      </div>

      <h2>会社一覧</h2>

      <div style={{ display: "grid", gap: 10 }}>
        {organizations.map((org) => (
          <div
            key={org.id}
            style={{
              backgroundColor: "#fff",
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: 12,
              fontWeight: 800,
            }}
          >
            {org.name}
          </div>
        ))}

        {organizations.length === 0 && <p>会社がありません</p>}
      </div>
    </div>
  );
}