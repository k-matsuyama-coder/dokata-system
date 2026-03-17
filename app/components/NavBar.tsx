"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";


export default function NavBar() {
  const [role, setRole] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fetchRole = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) return;

      const { data } = await supabase
        .from("employees")
        .select("role")
        .eq("auth_user_id", user.id)
        .single();

      if (data) {
        setRole(data.role);
      }
    };

    fetchRole();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 20px",
        borderBottom: "1px solid #ddd",
        backgroundColor: "#fff",
      }}
    >
      <div style={{ fontWeight: "bold", fontSize: 18 }}>
        DOKATA-System
      </div>

      <div>
  <button
    onClick={() => setMenuOpen(!menuOpen)}
    style={{
      border: "1px solid #ddd",
      backgroundColor: "#fff",
      borderRadius: 8,
      padding: "8px 12px",
      cursor: "pointer",
      fontSize: 18,
    }}
  >
    ☰
  </button>

  {menuOpen && (
    <div
    style={{
      position: "absolute",
      top: 60,
      right: 12,
      left: 12,
      backgroundColor: "#fff",
      border: "1px solid #ddd",
      borderRadius: 12,
      padding: 16,
      boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      zIndex: 1000,
    }}
  >
      <a
        href="/home"
        className="nav-link"
        style={{
          color: pathname === "/home" ? "#0070f3" : "#333",
          fontWeight: pathname === "/home" ? 700 : 500,
        }}
      >
        ホーム
      </a>

      <a
        href="/reports"
        className="nav-link"
        style={{
          color: pathname.startsWith("/reports") ? "#0070f3" : "#333",
          fontWeight: pathname.startsWith("/reports") ? 700 : 500,
        }}
      >
        日報
      </a>

      <a
        href="/profile"
        className="nav-link"
        style={{
          color: pathname.startsWith("/profile") ? "#0070f3" : "#333",
          fontWeight: pathname.startsWith("/profile") ? 700 : 500,
        }}
      >
        マイページ
      </a>

      {role === "admin" && (
        <a
          href="/admin"
          className="nav-link"
          style={{
            color: pathname.startsWith("/admin") ? "#0070f3" : "#333",
            fontWeight: pathname.startsWith("/admin") ? 700 : 500,
          }}
        >
          管理
        </a>
      )}

      <button
        onClick={handleLogout}
        style={{
          border: "none",
          background: "none",
          cursor: "pointer",
          color: "#333",
          fontWeight: 500,
          textAlign: "left",
          padding: 0,
        }}
      >
        ログアウト
      </button>
    </div>
  )}
</div>
    </header>
  );
}