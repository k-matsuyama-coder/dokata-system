"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BackButton from "@/app/components/BackButton";

const menuGroups = [
  {
    title: "配置",
    items: [
      { label: "月間番割", href: "/assignments/month", icon: "📅", desc: "月別の配置を確認・編集" },
      { label: "番割", href: "/assignments", icon: "📋", desc: "日別の番割入力" },
      { label: "現場管理", href: "/admin/sites", icon: "🏗️", desc: "現場情報の管理" },
    ],
  },
  {
    title: "人員",
    items: [
      { label: "社員一覧", href: "/admin/users", icon: "👷", desc: "社員の確認・追加" },
      { label: "会社管理", href: "/admin/companies", icon: "🏢", desc: "所属会社の管理" },
      { label: "元請管理", href: "/admin/contractors", icon: "🤝", desc: "元請・担当者の管理" },
    ],
  },
  {
    title: "日報",
    items: [
      { label: "日報管理", href: "/admin/reports", icon: "📝", desc: "日報の確認・管理" },
      { label: "日別日報確認", href: "/admin/reports/daily", icon: "📆", desc: "日付ごとの日報確認" },
    ],
  },
  {
    title: "その他",
    items: [
      { label: "車両管理", href: "/admin/vehicles", icon: "🚚", desc: "車両の登録・削除" },
      { label: "分析", href: "/admin/analysis", icon: "📊", desc: "集計・分析" },
    ],
  },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("配置");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();

    window.addEventListener("resize", checkMobile);

    return () =>
      window.removeEventListener(
        "resize",
        checkMobile
      );
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f6f8" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
  ? "1fr"
  : "240px 1fr",
          minHeight: "100vh",
        }}
      >
        {!isMobile && (
  <aside
  
          style={{
            backgroundColor: "#111827",
            color: "#fff",
            padding: 20,
          }}
        >
          <h2 style={{ marginTop: 0 }}>管理メニュー</h2>

          <div style={{ display: "grid", gap: 18 }}>
            {menuGroups.map((group) => (
              <div key={group.title}>
                <div
                  style={{
                    fontSize: 12,
                    color: "#9ca3af",
                    marginBottom: 8,
                    fontWeight: 700,
                  }}
                >
                  {group.title}
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        color: "#fff",
                        textDecoration: "none",
                        padding: "9px 10px",
                        borderRadius: 8,
                        backgroundColor: "rgba(255,255,255,0.06)",
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      {item.icon} {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
        )}

        <main style={{ padding: 24 }}>
          <BackButton />

          <h1>管理者画面</h1>

          <div
  style={{
    display: "flex",
    gap: 8,
    overflowX: "auto",
    marginBottom: 20,
    paddingBottom: 4,
  }}
>
  {menuGroups.map((group) => (
    <button
      key={group.title}
      type="button"
      onClick={() => setActiveTab(group.title)}
      style={{
        border: "none",
        padding: "10px 16px",
        borderRadius: 999,
        cursor: "pointer",
        whiteSpace: "nowrap",
        fontWeight: 700,
        backgroundColor:
          activeTab === group.title
            ? "#111"
            : "#e5e7eb",
        color:
          activeTab === group.title
            ? "#fff"
            : "#111",
      }}
    >
      {group.title}
    </button>
  ))}
</div>

          <p style={{ color: "#666" }}>よく使う機能を選択してください。</p>

          {menuGroups
  .filter(
    (group) =>
      group.title === activeTab
  )
  .map((group) => (
            <section key={group.title} style={{ marginTop: 28 }}>
              <h2>{group.title}</h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 14,
                }}
              >
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 14,
                      padding: 18,
                      textDecoration: "none",
                      color: "#111",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{ fontSize: 30 }}>{item.icon}</div>
                    <div style={{ fontWeight: 800, marginTop: 8 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 13, color: "#666", marginTop: 6 }}>
                      {item.desc}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}