"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Employee = {
  id: string;
  name: string;
  role: string;
};

export default function AdminUsersPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleDelete = async (id: string, name: string) => {
        const ok = window.confirm(`${name} を削除しますか？`);
        if (!ok) return;
      
        const { error } = await supabase
          .from("employees")
          .delete()
          .eq("id", id);
      
        if (error) {
          alert("削除失敗: " + error.message);
          return;
        }
      
        alert("削除しました");
      
        setEmployees((prev) => prev.filter((employee) => employee.id !== id));
      };

    const fetchEmployees = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        alert("ログインしてください");
        window.location.href = "/login";
        return;
      }

      const { data: me } = await supabase
        .from("employees")
        .select("role")
        .eq("auth_user_id", user.id)
        .single();

      if (!me || me.role !== "admin") {
        alert("管理者のみ閲覧できます");
        window.location.href = "/reports";
        return;
      }

      const { data, error } = await supabase
        .from("employees")
        .select("id, name, role")
        .order("name", { ascending: true });

      if (error) {
        alert("社員一覧取得失敗: " + error.message);
        return;
      }

      setEmployees(data ?? []);
      setLoading(false);
    };

    fetchEmployees();
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <h1 style={{ margin: 0 }}>社員一覧</h1>

        <a
          href="/admin/users/new"
          style={{
            textDecoration: "none",
            backgroundColor: "#111",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          ＋ 社員追加
        </a>
      </div>

      {loading ? (
        <p>読み込み中...</p>
      ) : employees.length === 0 ? (
        <p>社員がいません</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {employees.map((employee) => (
  <div
    key={employee.id}
    style={{
      border: "1px solid #ddd",
      borderRadius: 10,
      padding: 16,
      backgroundColor: "#fff",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
    }}
  >
    <a
      href={`/admin/users/${employee.id}`}
      style={{
        textDecoration: "none",
        color: "#111",
        flex: 1,
        minWidth: 200,
      }}
    >
      <p style={{ margin: 0, fontWeight: "bold", fontSize: 16 }}>
        {employee.name}
      </p>
      <p style={{ margin: "8px 0 0 0", color: "#666" }}>
        権限: {employee.role}
      </p>
    </a>

    <button
      onClick={() => handleDelete(employee.id, employee.name)}
      style={{
        padding: "10px 14px",
        border: "none",
        borderRadius: 8,
        backgroundColor: "#d11a2a",
        color: "#fff",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      削除
    </button>
  </div>
))}
        </div>
      )}
    </div>
  );
}