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
  must_change_password: boolean | null;
};

export default function UsersPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [keyword, setKeyword] = useState("");
const [companyFilter, setCompanyFilter] = useState("");
const [sortType, setSortType] = useState("created_desc");

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
        .select("id, auth_user_id, name, role, company_name, must_change_password")
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

  const companyOptions = Array.from(
    new Set(employees.map((e) => e.company_name).filter(Boolean))
  );
  
  const filteredEmployees = employees
    .filter((employee) => {
      const keywordText = `${employee.name} ${employee.company_name ?? ""} ${employee.role ?? ""}`.toLowerCase();
  
      const matchKeyword = keywordText.includes(keyword.toLowerCase());
  
      const matchCompany = companyFilter
        ? employee.company_name === companyFilter
        : true;
  
      return matchKeyword && matchCompany;
    })
    .sort((a, b) => {
      if (sortType === "name_asc") {
        return a.name.localeCompare(b.name, "ja");
      }
  
      if (sortType === "company_asc") {
        return (a.company_name ?? "").localeCompare(b.company_name ?? "", "ja");
      }
  
      if (sortType === "role_asc") {
        return (a.role ?? "").localeCompare(b.role ?? "", "ja");
      }
  
      return 0;
    });

    const groupedEmployees = filteredEmployees.reduce<Record<string, Employee[]>>(
      (acc, employee) => {
        const company = employee.company_name || "未設定";
    
        if (!acc[company]) {
          acc[company] = [];
        }
    
        acc[company].push(employee);
    
        return acc;
      },
      {}
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

      <button
  onClick={() => {
    const header = ["名前", "会社", "権限"];

    const rows = filteredEmployees.map((e) => [
      e.name,
      e.company_name ?? "",
      e.role ?? "",
    ]);

    const csvContent =
      [header, ...rows]
        .map((row) => row.join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "employees.csv";
    a.click();

    URL.revokeObjectURL(url);
  }}
  style={{
    marginBottom: 16,
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #ccc",
    backgroundColor: "#fff",
    cursor: "pointer",
  }}
>
  CSVダウンロード
</button>

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
    marginBottom: 12,
    borderRadius: 8,
    border: "1px solid #ccc",
    boxSizing: "border-box",
    fontSize: 16,
  }}
/>

<select
  value={companyFilter}
  onChange={(e) => setCompanyFilter(e.target.value)}
  style={{
    width: "100%",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    border: "1px solid #ccc",
  }}
>
  <option value="">すべての会社</option>

  {companyOptions.map((company) => (
    <option key={company} value={company}>
      {company}
    </option>
  ))}
</select>

<select
  value={sortType}
  onChange={(e) => setSortType(e.target.value)}
  style={{
    width: "100%",
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    border: "1px solid #ccc",
  }}
>
  <option value="created_desc">新しい順</option>
  <option value="name_asc">名前順</option>
  <option value="company_asc">会社順</option>
  <option value="role_asc">権限順</option>
</select>

{filteredEmployees.length === 0 ? (
  <p>社員がいません</p>
) : (
  <div style={{ display: "grid", gap: 18 }}>
    {Object.entries(groupedEmployees).map(([companyName, companyEmployees]) => (
      <div
        key={companyName}
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 14,
          backgroundColor: "#fafafa",
        }}
      >
        <h3 style={{ margin: "0 0 12px 0" }}>
          {companyName}
          <span style={{ fontSize: 13, color: "#666", marginLeft: 8 }}>
            {companyEmployees.length}人
          </span>
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr auto",
            fontSize: 13,
            color: "#666",
            padding: "6px 12px",
            borderBottom: "1px solid #ddd",
            marginBottom: 6,
          }}
        >
          <div>名前</div>
          <div>権限</div>
          <div>初回PW</div>
          <div></div>
        </div>

        <div style={{ display: "grid" }}>
          {companyEmployees.map((employee) => (
            <div
              key={employee.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr auto",
                alignItems: "center",
                padding: "10px 12px",
                borderBottom: "1px solid #eee",
                backgroundColor: "#fff",
              }}
            >
              <div style={{ fontWeight: 600 }}>{employee.name}</div>

              <div>{employee.role || "-"}</div>

              <div>
                {employee.must_change_password ? "未完了" : "完了"}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <a
                  href={`/admin/users/${employee.id}`}
                  style={{
                    textDecoration: "none",
                    backgroundColor: "#fff",
                    color: "#111",
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    fontSize: 13,
                  }}
                >
                  編集
                </a>

                <button
                  type="button"
                  onClick={() => handleDelete(employee)}
                  style={{
                    backgroundColor: "#d11a2a",
                    color: "#fff",
                    border: "none",
                    padding: "6px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
)}
    </div>
  );
}