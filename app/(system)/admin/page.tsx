"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BackButton from "@/app/components/BackButton";
import { supabase } from "@/lib/supabase";
import { hasRole } from "@/app/types/auth";
import ExpenseMenuLink from "@/app/components/ExpenseMenuLink";

const menuGroups = [
  {
    title: "配置・工程",
    items: [
      { label: "番割", href: "/admin/assignments/month" },
      { label: "2ヶ月工程表", href: "/admin/assignments/two-month" },
      { label: "シフト管理表", href: "/admin/shift-management" },
    ],
  },
  {
    title: "日報・請求",
    items: [
      { label: "日報管理", href: "/admin/reports" },
      { label: "日別日報確認", href: "/admin/reports/daily" },
      { label: "日報送付確認", href: "/admin/report-status" },
      { label: "請求用月次日報", href: "/admin/reports/monthly-sheet" },
    ],
  },
  {
    title: "社員・給与",
    items: [
      { label: "社員一覧", href: "/admin/users" },
      { label: "作業員名簿", href: "/admin/employee-roster" },
      { label: "給与計算", href: "/admin/payroll" },
    ],
  },
  {
    title: "会社・取引先",
    items: [
      { label: "会社管理", href: "/admin/companies" },
      { label: "元請管理", href: "/admin/contractors" },
    ],
  },
  {
    title: "車両・物品",
    items: [
      { label: "車両管理", href: "/admin/vehicles" },
      { label: "物品管理", href: "/admin/items" },
      { label: "物品申請確認", href: "/admin/items/requests" },
      { label: "物品使用履歴", href: "/admin/items/history" },
    ],
  },
];

const shortcuts = [
  {
    label: "番割",
    href: "/admin/assignments/month",
    desc: "現場への配置を確認・編集",
    mark: "配",
  },
  {
    label: "2ヶ月工程表",
    href: "/admin/assignments/two-month",
    desc: "先の工程と必要人数を確認",
    mark: "工",
  },
  {
    label: "日別日報確認",
    href: "/admin/reports/daily",
    desc: "日付ごとの作業実績を確認",
    mark: "日",
  },
  {
    label: "日報送付確認",
    href: "/admin/report-status",
    desc: "日報の提出状況を確認",
    mark: "確",
  },
  {
    label: "請求用月次日報",
    href: "/admin/reports/monthly-sheet",
    desc: "現場別の月次実績を確認",
    mark: "請",
  },
  {
    label: "給与計算",
    href: "/admin/payroll",
    desc: "勤務実績から月次給与を確認",
    mark: "給",
  },
];

export default function AdminPage() {
  const [openGroup, setOpenGroup] = useState<string | null>("配置・工程");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError || !userData.user) {
          window.location.href = "/login";
          return;
        }

        const { data: employee, error: employeeError } = await supabase
          .from("employees")
          .select("role")
          .eq("auth_user_id", userData.user.id)
          .single();

        if (employeeError || !employee || !hasRole(employee.role, "admin")) {
          window.location.href = "/home";
          return;
        }

        if (active) setReady(true);
      } catch {
        if (active) {
          setError("管理画面を読み込めませんでした。再読み込みしてください。");
        }
      }
    }

    void checkAuth();
    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return (
      <div style={{ padding: 24 }} role="status">
        {error || "読み込み中…"}
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <button
        type="button"
        className="mobile-toggle"
        aria-expanded={mobileOpen}
        aria-controls="admin-navigation"
        onClick={() => setMobileOpen((value) => !value)}
      >
        {mobileOpen ? "× メニューを閉じる" : "☰ メニュー"}
      </button>

      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-heading">管理メニュー</div>

        <nav id="admin-navigation" aria-label="管理メニュー">
          {menuGroups.map((group, index) => {
            const expanded = openGroup === group.title;

            return (
              <div className="menu-group" key={group.title}>
                <button
                  type="button"
                  className={`group-button ${expanded ? "expanded" : ""}`}
                  aria-expanded={expanded}
                  aria-controls={`admin-group-${index}`}
                  onClick={() =>
                    setOpenGroup(expanded ? null : group.title)
                  }
                >
                  <span>{group.title}</span>
                  <span aria-hidden="true">{expanded ? "−" : "＋"}</span>
                </button>

                <div id={`admin-group-${index}`} hidden={!expanded}>
                  <div className="group-links">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="nav-link"
                        onClick={() => setMobileOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

<ExpenseMenuLink admin />

          <Link href="/admin/analysis" className="standalone-link">
            <span>分析</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </nav>

        <div className="settings-area">
          <Link href="/admin/settings" className="standalone-link">
            <span>設定</span>
            <span aria-hidden="true">⚙</span>
          </Link>
        </div>
      </aside>

      <main className="main">
        <BackButton />

        <header className="page-heading">
          <h1>管理</h1>
          <p>配置・日報・社員情報を管理できます。</p>
        </header>

        <section aria-labelledby="shortcut-title">
          <h2 id="shortcut-title">よく使う機能</h2>

          <div className="shortcut-grid">
            {shortcuts.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shortcut"
              >
                <span className="shortcut-mark" aria-hidden="true">
                  {item.mark}
                </span>
                <span className="shortcut-content">
                  <strong>{item.label}</strong>
                  <span>{item.desc}</span>
                </span>
                <span className="shortcut-arrow" aria-hidden="true">
                  ›
                </span>
              </Link>
            ))}
          </div>

          <p className="hint">その他の機能はメニューから選択できます。</p>
        </section>
      </main>

      <style jsx>{`
        .admin-shell {
          display: grid;
          grid-template-columns: 224px minmax(0, 1fr);
          min-height: calc(100dvh - 72px);
          background: #f6f7f9;
          color: #172033;
        }

        .sidebar {
          display: flex;
          flex-direction: column;
          padding: 28px 14px 20px;
          background: #fff;
          border-right: 1px solid #e5e9ef;
        }

        .sidebar-heading {
          padding: 0 12px 22px;
          font-size: 12px;
          font-weight: 700;
          color: #8992a3;
          letter-spacing: 0.06em;
        }

        .menu-group {
          margin-bottom: 6px;
        }

        .group-button {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 12px;
          border: 0;
          border-radius: 9px;
          background: transparent;
          color: #475569;
          font-size: 14px;
          font-weight: 700;
          text-align: left;
          cursor: pointer;
        }

        .group-button.expanded {
          background: #eef2ff;
          color: #4338ca;
        }

        .group-links {
          display: grid;
          gap: 2px;
          margin: 8px 0 12px 12px;
          padding-left: 10px;
          border-left: 1px solid #e2e8f0;
        }

        .sidebar :global(.nav-link) {
          display: block;
          padding: 9px 10px;
          border-radius: 7px;
          color: #64748b;
          font-size: 13px;
          text-decoration: none;
        }

        .sidebar :global(.standalone-link) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          border-radius: 9px;
          color: #475569;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
        }

        .group-button:hover,
        .sidebar :global(.nav-link:hover),
        .sidebar :global(.standalone-link:hover) {
          background: #f1f5f9;
          color: #1e293b;
        }

        .settings-area {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid #e5e9ef;
        }

        .main {
          min-width: 0;
          padding: 28px 36px;
        }

        .page-heading {
          margin: 28px 0 36px;
        }

        .page-heading h1 {
          margin: 0;
          font-size: 26px;
          font-weight: 800;
        }

        .page-heading p {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
        }

        section {
          max-width: 1120px;
        }

        h2 {
          margin: 0 0 16px;
          font-size: 15px;
          font-weight: 700;
        }

        .shortcut-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .main :global(.shortcut) {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 22px 18px;
          border: 1px solid #e5e9ef;
          border-radius: 12px;
          background: #fff;
          color: inherit;
          text-decoration: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .main :global(.shortcut:hover) {
          border-color: #a5b4fc;
          box-shadow: 0 4px 16px #4338ca0a;
        }

        .shortcut-mark {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 42px;
          height: 42px;
          border-radius: 11px;
          background: #eef2ff;
          color: #4f46e5;
          font-size: 17px;
          font-weight: 700;
        }

        .shortcut-content {
          display: grid;
          gap: 6px;
          min-width: 0;
        }

        .shortcut-content strong {
          font-size: 14px;
        }

        .shortcut-content > span {
          color: #8490a2;
          font-size: 12px;
          line-height: 1.6;
        }

        .shortcut-arrow {
          margin-left: auto;
          color: #94a3b8;
          font-size: 22px;
        }

        .hint {
          margin-top: 20px;
          color: #8490a2;
          font-size: 12px;
        }

        .mobile-toggle {
          display: none;
        }

        @media (max-width: 1150px) {
          .shortcut-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 767px) {
          .admin-shell {
            display: block;
          }

          .mobile-toggle {
            display: block;
            width: 100%;
            padding: 14px 18px;
            border: 0;
            border-bottom: 1px solid #e5e9ef;
            background: #fff;
            color: #334155;
            font-size: 14px;
            font-weight: 700;
            text-align: left;
            cursor: pointer;
          }

          .sidebar {
            display: none;
            border-right: 0;
            border-bottom: 1px solid #e5e9ef;
          }

          .sidebar.mobile-open {
            display: flex;
          }

          .sidebar-heading {
            display: none;
          }

          .settings-area {
            margin-top: 16px;
          }

          .main {
            padding: 20px 16px;
          }

          .page-heading {
            margin: 22px 0 28px;
          }

          .shortcut-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .main :global(.shortcut) {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}