"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <nav
      aria-label="番割画面の切り替え"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 16,
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
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #2563eb",
              backgroundColor: active ? "#2563eb" : "#fff",
              color: active ? "#fff" : "#2563eb",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
