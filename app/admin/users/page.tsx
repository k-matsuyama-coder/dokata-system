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
  const [searchKeyword, setSearchKeyword] = useState("");

  useEffect(() => {
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

  const handleRoleChange = async (id: string, newRole: string) => {
    const { error } = await supabase
      .from("employees")
      .update({ role: newRole })
      .eq("id", id);

    if (error) {
      alert("権限変更失敗: " + error.message);
      return;
    }

    setEmployees((prev) =>
      prev.map((employee) =>
        employee.id === id ? { ...employee, role: newRole } : employee
      )
    );

    alert("権限を更新しました");
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = window.confirm(`${name} を削除しますか？`);
    if (!ok) return;

    const res = await fetch("/api/admin/delete-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ employeeId: id }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert("削除失敗: " + (result.error || "不明なエラー"));
      return;
    }

    alert("削除しました");
    setEmployees((prev) => prev.filter((employee) => employee.id !== id));
  };

  const filteredEmployees = employees.filter((employee) =>
    (employee.name ?? "").toLowerCase().includes(searchKeyword.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, marginBottom: 12 }}>社員一覧</h1>

        <a
          href="/admin/users/new"
          style={{
            display: "inline-block",
            textDecoration: "none",
            backgroundColor: "#111",
            color: "#fff",
            padding: "12px 16px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          ＋ 社員追加
        </a>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="名前で検索"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            fontSize: 16,
            border: "1px solid #ccc",
            borderRadius: 8,
            boxSizing: "border-box",
          }}
        />
      </div>

      {loading ? (
        <p>読み込み中...</p>
      ) : filteredEmployees.length === 0 ? (
        <p>該当する社員がいません</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filteredEmployees.map((employee) => (
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
              }}
            >
              <a
                href={`/admin/users/${employee.id}`}
                style={{
                  textDecoration: "none",
                  color: "#111",
                }}
              >
                <p style={{ margin: 0, fontWeight: "bold", fontSize: 16 }}>
                  {employee.name}
                </p>
              </a>

              <div>
                <label style={{ color: "#666", marginRight: 8 }}>権限:</label>
                <select
                  value={employee.role}
                  onChange={(e) =>
                    handleRoleChange(employee.id, e.target.value)
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #ccc",
                    marginTop: 8,
                    fontSize: 16,
                    boxSizing: "border-box",
                  }}
                >
                  <option value="worker">worker</option>
                  <option value="admin">admin</option>
                </select>
              </div>

              <<button
              type="button"
              onClick={() => handleDelete(employee.id, employee.name)}
              style={{
                padding: "6px 10px",
                border: "none",
                borderRadius: 6,
                backgroundColor: "#d11a2a",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
              >
                🗑
                </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}