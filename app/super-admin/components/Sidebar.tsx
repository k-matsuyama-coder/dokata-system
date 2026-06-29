"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const menus = [
  { title: "ダッシュボード", href: "/super-admin" },
  { title: "会社管理", href: "/super-admin/organizations" },
  { title: "契約管理", href: "/super-admin/contracts" },
  { title: "全ユーザー", href: "/super-admin/users" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div
        style={{
          background: "#111",
          color: "#fff",
          padding: 12,
          overflowX: "auto",
          whiteSpace: "nowrap",
        }}
      >
        {menus.map((menu) => (
          <Link
            key={menu.href}
            href={menu.href}
            style={{
              display: "inline-block",
              color: "#fff",
              textDecoration: "none",
              padding: "10px 12px",
              borderRadius: 8,
              marginRight: 8,
              background: pathname === menu.href ? "#2d7ef7" : "transparent",
              fontWeight: 700,
            }}
          >
            {menu.title}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        width: 220,
        background: "#111",
        color: "#fff",
        minHeight: "100vh",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Super Admin</h2>

      <div style={{ display: "grid", gap: 8, marginTop: 30 }}>
        {menus.map((menu) => (
          <Link
            key={menu.href}
            href={menu.href}
            style={{
              color: "#fff",
              textDecoration: "none",
              padding: 12,
              borderRadius: 8,
              background: pathname === menu.href ? "#2d7ef7" : "transparent",
            }}
          >
            {menu.title}
          </Link>
        ))}
      </div>
    </div>
  );
}