"use client";

import type { CSSProperties } from "react";
import BackButton from "@/app/components/BackButton";

export default function AdminAnalyticsPage() {
  const linkStyle: CSSProperties = {
    display: "block",
    textDecoration: "none",
    backgroundColor: "#fff",
    color: "#111",
    padding: "14px 16px",
    borderRadius: 10,
    border: "1px solid #ddd",
    fontWeight: 600,
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <BackButton />

      <h1 style={{ marginBottom: 20 }}>分析</h1>

      <div style={{ display: "grid", gap: 12 }}>
        <a href="/admin/analytics/employees" style={linkStyle}>
          社員別集計一覧
        </a>

        <a href="/admin/analytics/personal" style={linkStyle}>
          個人別集計
        </a>

        <a href="/admin/analytics/company" style={linkStyle}>
          会社別集計
        </a>

        <a href="/admin/analytics/contractor" style={linkStyle}>
          元請別集計
        </a>

        <a href="/admin/analytics/monthly" style={linkStyle}>
          月次集計
        </a>
      </div>
    </div>
  );
}