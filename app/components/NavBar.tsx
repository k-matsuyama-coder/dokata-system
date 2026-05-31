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

  useEffect(() => {
    const handleClickOutside = () => {
      setMenuOpen(false);
    };
  
    if (menuOpen) {
      window.addEventListener("click", handleClickOutside);
    }
  
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 1000,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 20px",
        borderBottom: "1px solid #ddd",
        backgroundColor: "#fff",
        boxSizing: "border-box",
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      }}
    >
      <a
  href="/home"
  onClick={() => setMenuOpen(false)}
  style={{
    fontWeight: "bold",
    fontSize: 18,
    textDecoration: "none",
    color: "#111",
    cursor: "pointer",
  }}
>
  DOKATA-System
</a>

<button
  onClick={(e) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  }}
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

        <>
  {menuOpen && (
    <div
      onClick={() => setMenuOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.3)",
        zIndex: 999,
      }}
    />
  )}

  <div
    style={{
      position: "fixed",
      top: 0,
      left: menuOpen ? 0 : -260,
      width: 250,
      height: "100vh",
      backgroundColor: "#fff",
      borderRight: "1px solid #ddd",
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      transition: "left 0.25s ease",
      zIndex: 1000,
      boxShadow: "2px 0 10px rgba(0,0,0,0.12)",
    }}
  >

<div
  style={{
    fontSize: 20,
    fontWeight: 800,
    marginBottom: 10,
    borderBottom: "1px solid #eee",
    paddingBottom: 12,
  }}
>
DOKATA-System
</div>
            <a
              href="/home"
              onClick={() => setMenuOpen(false)}
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
              onClick={() => setMenuOpen(false)}
              className="nav-link"
              style={{
                color: pathname.startsWith("/reports") ? "#0070f3" : "#333",
                fontWeight: pathname.startsWith("/reports") ? 700 : 500,
              }}
            >
              日報
            </a>

            <a
  href="/assignments/view"
  onClick={() => setMenuOpen(false)}
  className="nav-link"
  style={{
    color: pathname.startsWith("/assignments/view") ? "#0070f3" : "#333",
    fontWeight: pathname.startsWith("/assignments/view") ? 700 : 500,
  }}
>
  番割
</a>

            <a
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="nav-link"
              style={{
                color: pathname.startsWith("/profile") ? "#0070f3" : "#333",
                fontWeight: pathname.startsWith("/profile") ? 700 : 500,
              }}
            >
              マイページ
            </a>

            <a
  href="/analytics"
  onClick={() => setMenuOpen(false)}
  className="nav-link"
  style={{
    color: pathname.startsWith("/analytics") ? "#0070f3" : "#333",
    fontWeight: pathname.startsWith("/analytics") ? 700 : 500,
  }}
>
  分析
</a>

{role === "admin" && (
  <a
    href="/assignments/month"
    onClick={() => setMenuOpen(false)}
    className="nav-link"
    style={{
      color: pathname.startsWith("/assignments/month") ? "#0070f3" : "#333",
fontWeight: pathname.startsWith("/assignments/month") ? 700 : 500,
    }}
  >
    番割作成
  </a>
)}

            {role === "admin" && (
              <a
                href="/admin"
                onClick={() => setMenuOpen(false)}
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
          </>
    </header>
  );
}