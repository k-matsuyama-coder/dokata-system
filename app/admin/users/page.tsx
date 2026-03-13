"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type EmployeeRow = {
  id: string;
  name: string | null;
  role: string | null;
  auth_user_id: string | null;
};

type LicenseRow = {
  employee_id: string;
};

type CertificationRow = {
  employee_id: string;
};

type AuthUserRow = {
  id: string;
  email: string | null;
};

export default function AdminUsersPage() {
  const [employees, setEmployees] = useState<any[]>([]);

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

      const { data: employeeList, error: employeeError } = await supabase
        .from("employees")
        .select("id, name, role, auth_user_id")
        .order("created_at", { ascending: true });

      if (employeeError || !employeeList) {
        alert("社員一覧の取得失敗");
        return;
      }

      const { data: licenseList } = await supabase
        .from("licenses")
        .select("employee_id");

      const { data: certificationList } = await supabase
        .from("certifications")
        .select("employee_id");

      const licenseSet = new Set(
        (licenseList ?? []).map((item: LicenseRow) => item.employee_id)
      );

      const certificationCountMap = new Map<string, number>();
      (certificationList ?? []).forEach((item: CertificationRow) => {
        const current = certificationCountMap.get(item.employee_id) ?? 0;
        certificationCountMap.set(item.employee_id, current + 1);
      });

      let authUsers: AuthUserRow[] = [];
      try {
        const res = await fetch("/api/admin/auth-users");
        if (res.ok) {
          authUsers = await res.json();
        }
      } catch (e) {
        console.error(e);
      }

      const authUserMap = new Map<string, string | null>();
      authUsers.forEach((authUser) => {
        authUserMap.set(authUser.id, authUser.email);
      });

      const merged = employeeList.map((employee: EmployeeRow) => ({
        ...employee,
        email: employee.auth_user_id
          ? (authUserMap.get(employee.auth_user_id) ?? null)
          : null,
        hasLicense: licenseSet.has(employee.id),
        certificationCount: certificationCountMap.get(employee.id) ?? 0,
      }));

      setEmployees(merged);
    };

    fetchEmployees();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1>管理者 社員一覧</h1>

      {employees.length === 0 ? (
        <p>社員データがありません</p>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          {employees.map((employee) => (
            <a
            key={employee.id}
            href={`/admin/users/${employee.id}`}
            style={{
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: 16,
              backgroundColor: "#fff",
              textDecoration: "none",
              color: "#111",
              display: "block",
            }}
          >
              <p>名前: {employee.name ?? "-"}</p>
              <p>メール: {employee.email ?? "-"}</p>
              <p>権限: {employee.role ?? "-"}</p>
              <p>免許: {employee.hasLicense ? "あり" : "なし"}</p>
              <p>資格件数: {employee.certificationCount}件</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}