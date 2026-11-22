"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  {
    href: "/admin/assignments/month",
    label: "番割作成",
  },
  {
    href: "/admin/assignments/two-month",
    label: "2ヶ月工程表",
  },
];

export default function AssignmentPageLinks() {
  const pathname = usePathname();
  const router = useRouter();

  const title =
    links.find((link) => link.href === pathname)?.label ?? "番割管理";

  return (
    <header style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            height: 40,
            padding: "0 12px",
            border: "1px solid #d1d5db",
            borderRadius: 10,
            backgroundColor: "#fff",
            color: "#374151",
            fontSize: 14,
            whiteSpace: "nowrap",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          ← 戻る
        </button>

        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 800,
            lineHeight: 1.3,
            color: "#111827",
          }}
        >
          {title}
        </h1>
      </div>

      <nav
        aria-label="番割画面の切り替え"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          width: "100%",
          maxWidth: 360,
          boxSizing: "border-box",
          gap: 4,
          padding: 4,
          border: "1px solid #dbe2ea",
          borderRadius: 12,
          backgroundColor: "#e9edf3",
        }}
      >
        {links.map((link) => {
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 42,
                padding: "8px 12px",
                boxSizing: "border-box",
                borderRadius: 8,
                backgroundColor: active ? "#fff" : "transparent",
                color: active ? "#1d4ed8" : "#64748b",
                boxShadow: active
                  ? "0 1px 4px rgba(15,23,42,0.12)"
                  : "none",
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
