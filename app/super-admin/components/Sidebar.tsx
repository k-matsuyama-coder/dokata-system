"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = [
  {
    title: "ダッシュボード",
    href: "/super-admin",
  },
  {
    title: "会社管理",
    href: "/super-admin/organizations",
  },
  {
    title: "契約管理",
    href: "/super-admin/contracts",
  },
  {
    title: "全ユーザー",
    href: "/super-admin/users",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div
      style={{
        width: 220,
        background: "#111",
        color: "#fff",
        minHeight: "100vh",
        padding: 20,
      }}
    >
      <h2 style={{ marginTop: 0 }}>Super Admin</h2>

      <div
        style={{
          display: "grid",
          gap: 8,
          marginTop: 30,
        }}
      >
        {menus.map((menu) => (
          <Link
            key={menu.href}
            href={menu.href}
            style={{
              color: "#fff",
              textDecoration: "none",
              padding: 12,
              borderRadius: 8,
              background:
                pathname === menu.href
                  ? "#2d7ef7"
                  : "transparent",
            }}
          >
            {menu.title}
          </Link>
        ))}
      </div>
    </div>
  );
}