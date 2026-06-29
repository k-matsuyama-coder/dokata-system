"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = [
  { title: "ダッシュボード", href: "/super-admin" },
  { title: "会社管理", href: "/super-admin/organizations" },
  { title: "契約管理", href: "/super-admin/contracts" },
  { title: "全ユーザー", href: "/super-admin/users" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <div className="super-sidebar">
        <h2>Super Admin</h2>

        <div className="super-menu">
          {menus.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className={pathname === menu.href ? "active" : ""}
            >
              {menu.title}
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .super-sidebar {
          width: 220px;
          background: #111;
          color: #fff;
          min-height: 100vh;
          padding: 20px;
          box-sizing: border-box;
          flex-shrink: 0;
        }

        .super-sidebar h2 {
          margin-top: 0;
        }

        .super-menu {
          display: grid;
          gap: 8px;
          margin-top: 30px;
        }

        .super-menu a {
          color: #fff;
          text-decoration: none;
          padding: 12px;
          border-radius: 8px;
        }

        .super-menu a.active {
          background: #2d7ef7;
        }

        @media (max-width: 768px) {
            .super-sidebar {
              width: 100%;
              min-height: auto;
              padding: 10px;
              background: #fff;
              color: #111;
              border-bottom: 1px solid #ddd;
            }
          
            .super-sidebar h2 {
              display: none;
            }
          
            .super-menu {
              display: flex;
              gap: 8px;
              margin-top: 0;
              overflow-x: auto;
              white-space: nowrap;
            }
          
            .super-menu a {
              flex-shrink: 0;
              padding: 10px 12px;
              font-size: 13px;
              color: #111;
              background: #f3f4f6;
            }
          
            .super-menu a.active {
              background: #2d7ef7;
              color: #fff;
            }
          }
      `}</style>
    </>
  );
}