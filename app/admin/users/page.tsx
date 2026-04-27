"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type Employee = {
  id: string;
  name: string;
  role: string | null;
  company_name: string | null;
};

export default function UsersPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, name, role, company_name")
        .order("created_at", { ascending: false });

      if (error) {
        alert("社員取得失敗: " + error.message);
        return;
      }

      setEmployees(data ?? []);
    };

    fetchEmployees();
  }, []);

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

      {employees.length === 0 ? (
        <p>社員がいません</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {employees.map((employee) => (
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

              <a
                href={`/admin/users/${employee.id}`}
                style={{
                  display: "inline-block",
                  marginTop: 12,
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}