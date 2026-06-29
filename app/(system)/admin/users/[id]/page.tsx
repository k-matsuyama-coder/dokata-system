"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";
import { hasRole } from "@/app/types/auth";

type Company = {
  id: string;
  name: string;
};

export default function UserDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("worker");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [authUserId, setAuthUserId] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const getCurrentOrganization = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) return null;

  const res = await fetch("/api/current-organization", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await res.json();

  if (!res.ok) return null;

  return result.organizationId as string | null;
};

  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      const currentOrganizationId = await getCurrentOrganization();

if (!currentOrganizationId) {
  alert("会社情報が取得できません");
  return;
}

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: me } = await supabase
        .from("employees")
        .select("role")
        .eq("organization_id", currentOrganizationId)
        .eq("auth_user_id", user.id)
        .single();

        if (!me || !hasRole(me.role, "admin")) {
          alert("管理者のみ閲覧できます");
          window.location.href = "/home";
          return;
        }

      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select("name, role, company_name, auth_user_id")
        .eq("organization_id", currentOrganizationId)
        .eq("id", id)
        .single();

      if (employeeError || !employee) {
        alert("社員取得失敗");
        window.location.href = "/admin/users";
        return;
      }

      setName(employee.name ?? "");
      setRole(employee.role === "super_admin" ? "admin" : employee.role ?? "worker");
      setCompanyName(employee.company_name ?? "");
      setAuthUserId(employee.auth_user_id ?? "");

      if (employee.auth_user_id) {
        const { data: sessionData } = await supabase.auth.getSession();
const token = sessionData.session?.access_token;

if (!token) {
  alert("ログイン情報がありません");
  return;
}

const res = await fetch("/api/admin/get-user-auth", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    authUserId: employee.auth_user_id,
  }),
});
      
        const result = await res.json();
      
        if (res.ok) {
          setEmail(result.email ?? "");
        }
      }

      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("id, name")
        .eq("organization_id", currentOrganizationId)
        .order("name", { ascending: true });

      if (companyError) {
        alert("会社取得失敗: " + companyError.message);
        return;
      }

      setCompanies(companyData ?? []);
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleUpdate = async () => {
    const currentOrganizationId = await getCurrentOrganization();

if (!currentOrganizationId) {
  alert("会社情報が取得できません");
  return;
}

  const { error } = await supabase
    .from("employees")
    .update({
      company_name: companyName,
      role,
    })
    .eq("organization_id", currentOrganizationId)
.eq("id", id);

  if (error) {
    alert("更新失敗: " + error.message);
    return;
  }

  if (email.trim() || password.trim()) {
    const { data: sessionData } = await supabase.auth.getSession();

const authRes = await fetch("/api/admin/update-user-auth", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${sessionData.session?.access_token}`,
  },
  body: JSON.stringify({
    employeeId: id,
    authUserId,
    email: email.trim(),
    password: password.trim(),
  }),
});

    const authResult = await authRes.json();

    if (!authRes.ok) {
      alert(authResult.error || "ログイン情報更新失敗");
      return;
    }

    setAuthUserId(authResult.authUserId);
  }

  alert("社員情報を更新しました");
  window.location.href = "/admin/users";
};

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <BackButton />

      <h1>社員詳細</h1>

      <div style={{ marginBottom: 16 }}>
        <p>名前</p>
        <input
          value={name}
          readOnly
          style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <p>権限</p>
        <select
  value={role}
  onChange={(e) => setRole(e.target.value)}
  style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
>
  <option value="worker">worker</option>
  <option value="admin">admin</option>
</select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <p>所属会社</p>
        <select
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
        >
          <option value="">選択してください</option>

          {companies.map((company) => (
            <option key={company.id} value={company.name}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
  <p>メールアドレス</p>
  <input
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
    placeholder="メールアドレス"
  />
</div>


<div style={{ marginBottom: 16 }}>
  <p>新しいパスワード</p>
  <input
    type="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
    placeholder="変更する場合のみ入力"
  />
</div>

      <button
        onClick={handleUpdate}
        style={{
          width: "100%",
          padding: 12,
          backgroundColor: "#111",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        保存
      </button>
    </div>
  );
}