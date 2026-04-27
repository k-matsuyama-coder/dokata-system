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
        .select("name, role, company_name")
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