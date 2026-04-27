"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type Employee = {
  id: string;
  auth_user_id: string | null;
  name: string;
  role: string | null;
  company_name: string | null;
};

export default function UsersPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
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
        window.location.href = "/home";
        return;
      }

      const { data, error } = await supabase
        .from("employees")
        .select("id, auth_user_id, name, role, company_name")
        .order("created_at", { ascending: false });

      if (error) {
        alert("社員取得失敗: " + error.message);
        return;
      }

      setEmployees(data ?? []);
    };

    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(keyword.toLowerCase())
  );

  const handleDelete = async (employee: Employee) => {
    const ok = window.confirm(
      `${employee.name} を完全削除しますか？\nログインアカウントも削除されます。`
    );
  
    if (!ok) return;
  
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
  
    if (!token) {
      alert("ログイン情報がありません");
      return;
    }
  
    const res = await fetch("/api/admin/delete-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        employeeId: employee.id,
      }),
    });
  
    const result = await res.json();
  
    if (!res.ok) {
      alert(result.error || "削除失敗");
      return;
    }
  
    setEmployees((prev) =>
      prev.filter((item) => item.id !== employee.id)
    );
  
    alert("完全削除しました");
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
      <BackButton />

      <h1 style={{ marginBottom: 16 }}>社員一覧</h1>

      <a
        href="/admin/users/new"
        style={{
          display: "inline-block",
          marginBottom: 16,
          textDecoration: "none",
          backgroundColor: "#111",
          color: "#fff",
          padding: "12px 16px",
          borderRadius: 8,
          fontWeight: 600,
        }}
      >
        ＋ 社員追加
      </a>

      <input
        type="text"
        placeholder="名前で検索"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 16,
          borderRadius: 8,
          border: "1px solid #ccc",
          boxSizing: "border-box",
          fontSize: 16,
        }}
      />

      {filteredEmployees.length === 0 ? (
        <p>社員がいません</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filteredEmployees.map((employee) => (
            <div
              key={employee.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: 16,
                backgroundColor: "#fff",
              }}
            >
              <p style={{ margin: 0, fontWeight: "bold", fontSize: 16 }}>
                {employee.name}
              </p>

              <p style={{ margin: "8px 0 0 0" }}>
                所属会社: {employee.company_name || "-"}
              </p>

              <p style={{ margin: "6px 0 0 0" }}>
                権限: {employee.role || "-"}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginTop: 12,
                }}
              >
                <a
                  href={`/admin/users/${employee.id}`}
                  style={{
                    display: "inline-block",
                    textDecoration: "none",
                    backgroundColor: "#fff",
                    color: "#111",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #ccc",
                    fontSize: 14,
                  }}
                >
                  詳細・編集
                </a>

                <button
                  type="button"
                  onClick={() => handleDelete(employee)}
                  style={{
                    backgroundColor: "#d11a2a",
                    color: "#fff",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}