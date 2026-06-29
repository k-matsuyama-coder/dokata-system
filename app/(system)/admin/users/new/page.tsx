"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";
import { hasRole } from "@/app/types/auth";

export default function NewUserPage() {
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [createdPassword, setCreatedPassword] = useState("");
  const [role, setRole] = useState("worker");
  const [companyName, setCompanyName] = useState("");
  const [loginRole, setLoginRole] = useState<string | null>(null);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
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

  // ✅ ここに置く（重要）
  useEffect(() => {
    const fetchCompanies = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const currentOrganizationId = await getCurrentOrganization();

if (!currentOrganizationId) {
  alert("会社情報が取得できません");
  return;
}
  
      if (!userData.user) {
        window.location.href = "/login";
        return;
      }
  
      const { data: employee } = await supabase
        .from("employees")
        .select("role")
        .eq("organization_id", currentOrganizationId)
        .eq("auth_user_id", userData.user.id)
        .single();
  
      setLoginRole(employee?.role ?? null);
  
      if (!employee || !hasRole(employee.role, "admin")) {
        window.location.href = "/home";
        return;
      }
  
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .eq("organization_id", currentOrganizationId)
        .order("name");

      if (error) {
        alert("会社取得失敗: " + error.message);
        return;
      }

      setCompanies(data ?? []);
    };

    fetchCompanies();
  }, []);

  const handleCreate = async () => {
    if (role === "super_admin" && !hasRole(loginRole ?? "", "super_admin")) {
      alert("super_admin 権限は super_admin のみ設定できます");
      return;
    }

    if (!firstName || !email) {
      alert("名前とメールアドレスを入力してください");
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      alert("ログイン情報がありません。再ログインしてください");
      return;
    }

    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        lastName,
        firstName,
        email,
        role,
        companyName,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "社員作成失敗");
      return;
    }

    setCreatedPassword(result.password);
    setLastName("");
setFirstName("");
setEmail("");
setRole("worker");
setCompanyName("");
    alert("社員作成成功");
  };

  const inputStyle = {
    width: "100%",
    padding: 12,
    fontSize: 16,
    marginTop: 8,
    marginBottom: 16,
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: 16 }}>
      <BackButton />
      <h1>社員追加</h1>

      <p>苗字</p>
      <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} />

      <p>名前</p>
      <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} />

      <p>メールアドレス</p>
      <input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />

      <p>権限</p>
      <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
        <option value="worker">worker</option>
<option value="admin">admin</option>

{hasRole(loginRole ?? "", "super_admin") && (
  <option value="super_admin">super_admin</option>
)}
      </select>

      <p>所属会社</p>
      <select value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={inputStyle}>
        <option value="">選択してください</option>
        {companies.map((c) => (
          <option key={c.id} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>

      <button
        onClick={handleCreate}
        style={{
          width: "100%",
          padding: 14,
          fontSize: 16,
          backgroundColor: "#111",
          color: "#fff",
          border: "none",
          borderRadius: 8,
        }}
      >
        社員作成
      </button>

      {createdPassword && (
        <div style={{ marginTop: 20, padding: 12, border: "1px solid #ccc", borderRadius: 6 }}>
          <p>仮パスワード</p>
          <p style={{ fontWeight: "bold" }}>{createdPassword}</p>
          <p>このパスワードを社員に渡してください</p>
        </div>
      )}
    </div>
  );
}