"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Organization = {
  id: string;
  name: string;
  plan: string | null;
  status: string | null;
};

export default function SuperAdminPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const totalCount = organizations.length;
  const activeCount = organizations.filter((org) => org.status === "active").length;
  const trialCount = organizations.filter((org) => org.status === "trial").length;
  const suspendedCount = organizations.filter((org) => org.status === "suspended").length;
  const cancelledCount = organizations.filter((org) => org.status === "cancelled").length;

  const cardStyle = {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: 14,
    padding: isMobile ? 14 : 16,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  } as const;

  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: 760,
          margin: "0 auto",
          padding: isMobile ? 12 : 16,
          boxSizing: "border-box",
        }}
      >
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 860,
        margin: "0 auto",
        padding: isMobile ? 12 : 16,
        boxSizing: "border-box",
      }}
    >

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: isMobile ? 13 : 14, color: "#666" }}>
          DOKATA-System
        </div>

        <h1
          style={{
            margin: "6px 0 0",
            fontSize: isMobile ? 24 : 32,
            fontWeight: 900,
          }}
        >
          Super Admin
        </h1>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: isMobile ? 10 : 12,
          marginBottom: 24,
        }}
      >
        <SummaryCard label="契約会社数" value={`${totalCount}社`} style={cardStyle} />
        <SummaryCard label="利用中" value={`${activeCount}社`} style={cardStyle} />
        <SummaryCard label="トライアル" value={`${trialCount}社`} style={cardStyle} />
        <SummaryCard label="停止中" value={`${suspendedCount}社`} style={cardStyle} />
        <SummaryCard label="解約済み" value={`${cancelledCount}社`} style={cardStyle} />
      </div>

      <h2
        style={{
          fontSize: isMobile ? 18 : 22,
          marginBottom: 12,
        }}
      >
        管理メニュー
      </h2>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  style,
}: {
  label: string;
  value: string;
  style: React.CSSProperties;
}) {
  return (
    <div style={style}>
      <div style={{ fontSize: 13, color: "#555", fontWeight: 700 }}>
        {label}
      </div>

      <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>
        {value}
      </div>
    </div>
  );
}