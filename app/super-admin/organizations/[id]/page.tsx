"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type Organization = {
  id: string;
  name: string;
  plan: string | null;
  status: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
};

type Employee = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
};

export default function OrganizationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [plan, setPlan] = useState("trial");
  const [status, setStatus] = useState("active");
  const [contractStartDate, setContractStartDate] = useState("");
  const [contractEndDate, setContractEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);

    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, plan, status, contract_start_date, contract_end_date")
      .eq("id", id)
      .single();

    if (orgError) {
      alert("会社情報の取得に失敗しました: " + orgError.message);
      setLoading(false);
      return;
    }

    setOrganization(orgData);
    setName(orgData.name ?? "");
    setPlan(orgData.plan ?? "trial");
    setStatus(orgData.status ?? "active");
    setContractStartDate(orgData.contract_start_date ?? "");
    setContractEndDate(orgData.contract_end_date ?? "");

    const { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("id, name, email, role")
      .eq("organization_id", id)
      .order("role");

    if (employeeError) {
      alert("社員情報の取得に失敗しました: " + employeeError.message);
      setLoading(false);
      return;
    }

    setEmployees(employeeData ?? []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!name) {
      alert("会社名を入力してください");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("organizations")
      .update({
        name,
        plan,
        status,
        contract_start_date: contractStartDate || null,
        contract_end_date: contractEndDate || null,
      })
      .eq("id", id);

    setSaving(false);

    if (error) {
      alert("保存に失敗しました: " + error.message);
      return;
    }

    alert("保存しました");
    fetchData();
  };

  const handleSuspend = async () => {
    const ok = confirm("この会社を利用停止にしますか？");
    if (!ok) return;
  
    const { error } = await supabase
      .from("organizations")
      .update({
        status: "suspended",
      })
      .eq("id", id);
  
    if (error) {
      alert("利用停止に失敗しました: " + error.message);
      return;
    }
  
    alert("利用停止にしました");
    fetchData();
  };

  const startImpersonation = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
  
    if (!token) {
      alert("ログイン情報がありません");
      return;
    }
  
    const res = await fetch("/api/super-admin/impersonate/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        organizationId: id,
      }),
    });
  
    const result = await res.json();
  
    if (!res.ok) {
      alert(result.error || "代理ログイン開始に失敗しました");
      return;
    }
  
    window.location.href = "/home";
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const inputStyle = {
    width: "100%",
    padding: 12,
    border: "1px solid #ccc",
    borderRadius: 8,
    fontSize: 16,
    boxSizing: "border-box" as const,
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 760, margin: "0 auto", padding: 16 }}>
        <BackButton />
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!organization) {
    return (
      <div style={{ maxWidth: 760, margin: "0 auto", padding: 16 }}>
        <BackButton />
        <p>会社情報が見つかりません</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 16 }}>
      <BackButton />

      <h1>会社詳細</h1>

      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 16,
          display: "grid",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: 0 }}>契約情報</h2>

        <label style={{ fontWeight: 800 }}>会社名</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />

        <label style={{ fontWeight: 800 }}>契約プラン</label>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          style={inputStyle}
        >
          <option value="trial">Trial</option>
          <option value="basic">Basic</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>

        <label style={{ fontWeight: 800 }}>契約状態</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={inputStyle}
        >
          <option value="active">利用中</option>
          <option value="trial">トライアル中</option>
          <option value="suspended">停止中</option>
          <option value="cancelled">解約済み</option>
        </select>

        <label style={{ fontWeight: 800 }}>契約開始日</label>
        <input
          type="date"
          value={contractStartDate}
          onChange={(e) => setContractStartDate(e.target.value)}
          style={inputStyle}
        />

        <label style={{ fontWeight: 800 }}>契約終了日</label>
        <input
          type="date"
          value={contractEndDate}
          onChange={(e) => setContractEndDate(e.target.value)}
          style={inputStyle}
        />

        <div
          style={{
            borderTop: "1px solid #eee",
            paddingTop: 12,
            fontWeight: 800,
          }}
        >
          所属ユーザー数：{employees.length}人
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: 14,
            border: "none",
            borderRadius: 8,
            backgroundColor: saving ? "#999" : "#111",
            color: "#fff",
            fontWeight: 900,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "保存中..." : "保存"}
        </button>

        <button
  type="button"
  onClick={handleSuspend}
  style={{
    padding: 14,
    border: "none",
    borderRadius: 8,
    backgroundColor: "#d32f2f",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  }}
>
  利用停止
</button>
<button
  type="button"
  onClick={startImpersonation}
  style={{
    padding: 14,
    border: "none",
    borderRadius: 8,
    backgroundColor: "#2d7ef7",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  }}
>
  この会社のシステムを見る
</button>
      </div>

      <h2>所属ユーザー一覧</h2>

      <div style={{ display: "grid", gap: 10 }}>
        {employees.map((employee) => (
          <div
            key={employee.id}
            style={{
              backgroundColor: "#fff",
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: 12,
              display: "grid",
              gap: 4,
            }}
          >
            <div style={{ fontWeight: 900 }}>
              {employee.name ?? "名前未設定"}
            </div>

            <div style={{ fontSize: 14, color: "#555" }}>
              {employee.email ?? "メール未設定"}
            </div>

            <div style={{ fontSize: 14, color: "#555" }}>
              権限：{employee.role ?? "未設定"}
            </div>
          </div>
        ))}

        {employees.length === 0 && <p>所属ユーザーがいません</p>}
      </div>
    </div>
  );
}