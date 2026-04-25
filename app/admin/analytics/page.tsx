"use client";

import type { CSSProperties } from "react";
import BackButton from "@/app/components/BackButton";

export default function AdminAnalyticsPage() {
  const sectionStyle: CSSProperties = {
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
    marginBottom: 20,
  };

  const linkStyle: CSSProperties = {
    display: "block",
    textDecoration: "none",
    backgroundColor: "#fff",
    color: "#111",
    padding: "14px 16px",
    borderRadius: 10,
    border: "1px solid #ddd",
    fontWeight: 600,
    marginTop: 10,
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <BackButton />

      <h1 style={{ marginBottom: 20 }}>分析</h1>

      <div style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>worker</h2>

        <a href="/admin/analytics/personal" style={linkStyle}>
          個人別集計
        </a>
      </div>

      <div style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>admin</h2>

        <a href="/admin/analytics/company" style={linkStyle}>
          会社別集計
          <span style={{ display: "block", fontSize: 13, color: "#666", marginTop: 4 }}>
            所属会社ごとの内訳
          </span>
        </a>

        <a href="/admin/analytics/contractor" style={linkStyle}>
          元請別集計
          <span style={{ display: "block", fontSize: 13, color: "#666", marginTop: 4 }}>
            元請ごとの内訳
          </span>
        </a>

        <a href="/admin/analytics/monthly" style={linkStyle}>
          月次集計
        </a>

        <a href="/admin/analytics/employees" style={linkStyle}>
          社員別集計一覧
        </a>
      </div>
    </div>
  );
}