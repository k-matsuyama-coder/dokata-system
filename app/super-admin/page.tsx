"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type Organization = {
  id: string;
  name: string;
  plan: string | null;
  status: string | null;
};

export default function SuperAdminPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrganizations = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("organizations")
      .select("id, name, plan, status");

    if (error) {
      alert("会社情報の取得に失敗しました: " + error.message);
      setLoading(false);
      return;
    }

    setOrganizations(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const totalCount = organizations.length;
  const activeCount = organizations.filter((org) => org.status === "active").length;
  const trialCount = organizations.filter((org) => org.status === "trial").length;
  const suspendedCount = organizations.filter((org) => org.status === "suspended").length;
  const cancelledCount = organizations.filter((org) => org.status === "cancelled").length;

  const cardStyle = {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 16,
  };

  const linkStyle = {
    display: "block",
    backgroundColor: "#111",
    color: "#fff",
    padding: 16,
    borderRadius: 10,
    textDecoration: "none",
    fontWeight: 900,
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 760, margin: "0 auto", padding: 16 }}>
        <BackButton />
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 16 }}>
      <BackButton />

      <h1>Super Admin</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div style={cardStyle}>
          <div style={{ fontSize: 14, color: "#555" }}>契約会社数</div>
          <div style={{ fontSize: 30, fontWeight: 900 }}>{totalCount}社</div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 14, color: "#555" }}>利用中</div>
          <div style={{ fontSize: 30, fontWeight: 900 }}>{activeCount}社</div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 14, color: "#555" }}>トライアル</div>
          <div style={{ fontSize: 30, fontWeight: 900 }}>{trialCount}社</div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 14, color: "#555" }}>停止中</div>
          <div style={{ fontSize: 30, fontWeight: 900 }}>{suspendedCount}社</div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 14, color: "#555" }}>解約済み</div>
          <div style={{ fontSize: 30, fontWeight: 900 }}>{cancelledCount}社</div>
        </div>
      </div>

      <h2>管理メニュー</h2>
    </div>
  );
}