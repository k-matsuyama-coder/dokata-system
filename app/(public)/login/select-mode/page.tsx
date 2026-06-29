"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Employee = {
  id: string;
  name: string | null;
  role: string | null;
  organization_id: string | null;
  organizations: {
    name: string | null;
  } | null;
};

export default function SelectModePage() {
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setEmail(user.email ?? "");

      const { data: superAdminUser } = await supabase
        .from("super_admin_users")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (!superAdminUser) {
        window.location.href = "/home";
        return;
      }

      const { data: employeeData } = await supabase
        .from("employees")
        .select(`
          id,
          name,
          role,
          organization_id,
          organizations (
            name
          )
        `)
        .eq("auth_user_id", user.id)
        .maybeSingle();

      setEmployee(employeeData as Employee | null);
      setLoading(false);
    };

    fetchData();
  }, []);

  const useSuperAdmin = async () => {
    window.location.href = "/super-admin";
  };

  const useCompany = async () => {
    if (!employee?.organization_id) {
      alert("会社情報がありません");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      alert("ログイン情報がありません");
      return;
    }

    const res = await fetch("/api/super-admin/impersonate/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        organizationId: employee.organization_id,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "会社モードへの切り替えに失敗しました");
      return;
    }

    window.location.href = "/home";
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 420, margin: "80px auto", padding: 16 }}>
        <p>確認中...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 460, margin: "80px auto", padding: 16 }}>
      <h1 style={{ marginBottom: 8 }}>利用モード選択</h1>

      <p style={{ color: "#666", marginBottom: 24 }}>
        {email} でログイン中
      </p>

      <div
        style={{
          display: "grid",
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={useSuperAdmin}
          style={{
            padding: 18,
            border: "none",
            borderRadius: 12,
            backgroundColor: "#111",
            color: "#fff",
            fontWeight: 900,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div style={{ fontSize: 18 }}>🛠 Super Adminとして利用</div>
          <div style={{ fontSize: 13, marginTop: 6, color: "#ddd" }}>
            会社管理・契約管理・代理ログインを行う
          </div>
        </button>

        {employee?.organization_id && (
          <button
            type="button"
            onClick={useCompany}
            style={{
              padding: 18,
              border: "1px solid #ddd",
              borderRadius: 12,
              backgroundColor: "#fff",
              color: "#111",
              fontWeight: 900,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: 18 }}>
              🏢 {employee.organizations?.name ?? "会社"}として利用
            </div>
            <div style={{ fontSize: 13, marginTop: 6, color: "#666" }}>
              日報・番割・社員管理など通常画面を使う
            </div>
          </button>
        )}

        <button
          type="button"
          onClick={logout}
          style={{
            padding: 12,
            border: "none",
            background: "none",
            color: "#666",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}