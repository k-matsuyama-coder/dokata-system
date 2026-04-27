"use client";

import BackButton from "@/app/components/BackButton";

export default function AdminPage() {
  const linkStyle = {
    display: "inline-block",
    textDecoration: "none",
    backgroundColor: "#fff",
    color: "#111",
    padding: "12px 16px",
    borderRadius: 8,
    border: "1px solid #ccc",
    fontWeight: 600,
    fontSize: 14,
  } as const;

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: 16 }}>
      <BackButton />

      <h1 style={{ marginBottom: 20 }}>管理者画面</h1>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <a href="/admin/users" style={linkStyle}>
          社員一覧
        </a>

        <a
          href="/admin/users/new"
          style={{
            ...linkStyle,
            backgroundColor: "#111",
            color: "#fff",
          }}
        >
          ＋ 社員追加
        </a>

        <a href="/admin/analytics" style={linkStyle}>
          分析
        </a>
      </div>
    </div>
  );
}