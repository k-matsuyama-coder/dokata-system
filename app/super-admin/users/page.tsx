"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Employee = {
  id: string;
  name: string;
  role: string | null;
  company_name: string | null;
  organization_id: string | null;
  auth_user_id: string | null;
  organizations: {
    name: string;
  } | null;
};

export default function SuperAdminUsersPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [organizationFilter, setOrganizationFilter] = useState("all");

  const fetchEmployees = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("employees")
      .select(`
        id,
        name,
        role,
        company_name,
        organization_id,
        auth_user_id,
        organizations (
          name
        )
      `)
      .order("organization_id", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      alert("ユーザー取得失敗: " + error.message);
      setLoading(false);
      return;
    }

    setEmployees(data ?? []);
    setLoading(false);
  };

  const startImpersonation = async (organizationId: string | null) => {
    if (!organizationId) {
      alert("会社IDがありません");
      return;
    }

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      alert("ログイン情報がありません");
      return;
    }

    const res = await fetch("/api/super-admin/impersonate/start", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organizationId,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "代理ログインに失敗しました");
      return;
    }

    window.location.href = "/home";
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const organizationNames = useMemo(() => {
    return Array.from(
      new Set(
        employees
          .map((employee) => employee.organizations?.name)
          .filter(Boolean)
      )
    ) as string[];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const orgName = employee.organizations?.name ?? "";
      const text = searchText.toLowerCase();

      const matchesSearch =
        employee.name.toLowerCase().includes(text) ||
        (employee.company_name ?? "").toLowerCase().includes(text) ||
        (employee.role ?? "").toLowerCase().includes(text) ||
        orgName.toLowerCase().includes(text);

      const matchesOrganization =
        organizationFilter === "all" || orgName === organizationFilter;

      return matchesSearch && matchesOrganization;
    });
  }, [employees, searchText, organizationFilter]);

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <h1>全ユーザー管理</h1>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 16,
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <h1 style={{ marginTop: 0 }}>全ユーザー管理</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="名前・会社・権限で検索"
          style={inputStyle}
        />

        <select
          value={organizationFilter}
          onChange={(e) => setOrganizationFilter(e.target.value)}
          style={inputStyle}
        >
          <option value="all">すべての会社</option>
          {organizationNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 12, fontWeight: 800 }}>
        表示中：{filteredEmployees.length}人 / 全{employees.length}人
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            minWidth: 1000,
            borderCollapse: "collapse",
            backgroundColor: "#fff",
          }}
        >
          <thead>
            <tr>
              <th style={th}>会社</th>
              <th style={th}>氏名</th>
              <th style={th}>所属会社</th>
              <th style={th}>権限</th>
              <th style={th}>Auth ID</th>
              <th style={th}>操作</th>
            </tr>
          </thead>

          <tbody>
            {filteredEmployees.map((employee) => (
              <tr key={employee.id}>
                <td style={td}>{employee.organizations?.name ?? "-"}</td>
                <td style={{ ...td, fontWeight: 800 }}>{employee.name}</td>
                <td style={td}>{employee.company_name ?? "-"}</td>
                <td style={td}>{employee.role ?? "-"}</td>
                <td style={td}>{employee.auth_user_id ?? "-"}</td>
                <td style={td}>
                  <button
                    type="button"
                    onClick={() =>
                      startImpersonation(employee.organization_id)
                    }
                    style={{
                      border: "none",
                      backgroundColor: "#2563eb",
                      color: "#fff",
                      padding: "8px 12px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    代理ログイン
                  </button>
                </td>
              </tr>
            ))}

            {filteredEmployees.length === 0 && (
              <tr>
                <td style={td} colSpan={6}>
                  ユーザーが見つかりません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 10,
  border: "1px solid #ccc",
  borderRadius: 8,
  fontSize: 15,
  boxSizing: "border-box" as const,
  backgroundColor: "#fff",
};

const th = {
  border: "1px solid #ddd",
  padding: 10,
  backgroundColor: "#f3f4f6",
  whiteSpace: "nowrap" as const,
  textAlign: "center" as const,
};

const td = {
  border: "1px solid #ddd",
  padding: 10,
  whiteSpace: "nowrap" as const,
  textAlign: "center" as const,
};