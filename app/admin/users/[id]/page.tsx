"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

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

  useEffect(() => {
    const fetchData = async () => {
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

      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select("name, role, company_name, auth_user_id")
        .eq("id", id)
        .single();

      if (employeeError || !employee) {
        alert("社員取得失敗");
        window.location.href = "/admin/users";
        return;
      }

      setName(employee.name ?? "");
      setRole(employee.role ?? "worker");
      setCompanyName(employee.company_name ?? "");
      setAuthUserId(employee.auth_user_id ?? "");

      if (employee.auth_user_id) {
        const res = await fetch("/api/admin/get-user-auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
    const { error } = await supabase
      .from("employees")
      .update({
        company_name: companyName,
        role,
      })
      .eq("id", id);
  
    if (error) {
      alert("更新失敗: " + error.message);
      return;
    }
  
    // auth_user_id がある社員だけログイン情報を更新
    if (authUserId) {
      const authRes = await fetch("/api/admin/update-user-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authUserId,
          email,
          password,
        }),
      });
  
      const authResult = await authRes.json();
  
      if (!authRes.ok) {
        alert(authResult.error || "ログイン情報更新失敗");
        return;
      }
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
  {!authUserId && (
  <button
    type="button"
    onClick={async () => {
      if (!email) {
        alert("メールアドレスを入力してください");
        return;
      }

      const res = await fetch("/api/admin/link-user-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: id,
          email,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || "ログイン連携失敗");
        return;
      }

      setAuthUserId(result.authUserId);
      alert("ログインアカウントを連携しました");
    }}
    style={{
      width: "100%",
      padding: 10,
      marginBottom: 16,
      backgroundColor: "#fff",
      color: "#111",
      border: "1px solid #ccc",
      borderRadius: 8,
      cursor: "pointer",
      fontWeight: 600,
    }}
  >
    このメールでログイン連携する
  </button>
)}
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