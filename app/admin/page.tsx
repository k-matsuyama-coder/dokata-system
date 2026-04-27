"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

export default function AdminPage() {
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: employee } = await supabase
        .from("employees")
        .select("role")
        .eq("auth_user_id", user.id)
        .single();

      if (!employee || employee.role !== "admin") {
        alert("管理者のみ閲覧できます");
        window.location.href = "/home";
      }
    };

    checkAdmin();
  }, []);

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

        <a href="/admin/companies" style={linkStyle}>
  会社管理
</a>

        <a href="/admin/analytics" style={linkStyle}>
          分析
        </a>
      </div>
    </div>
  );
}