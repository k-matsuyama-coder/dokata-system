"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type Contractor = {
  id: string;
  name: string;
};

type Site = {
  id: string;
  contractor_name: string;
  manager_name: string | null;
  site_name: string;
};

export default function SitesPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  const [contractorName, setContractorName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [siteName, setSiteName] = useState("");

  // データ取得
  const fetchData = async () => {
    const { data: contractorData } = await supabase
      .from("contractors")
      .select("id, name")
      .order("name");

    setContractors(contractorData ?? []);

    const { data: siteData, error } = await supabase
      .from("sites")
      .select("id, contractor_name, manager_name, site_name")
      .order("created_at", { ascending: false });

    if (error) {
      alert("現場取得失敗: " + error.message);
      return;
    }

    setSites(siteData ?? []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 追加
  const handleAdd = async () => {
    if (!contractorName || !siteName) {
      alert("元請と現場名は必須です");
      return;
    }

    const { data: existingSite } = await supabase
    .from("sites")
    .select("id")
    .eq("contractor_name", contractorName)
    .eq("site_name", siteName)
    .maybeSingle();
  
  if (existingSite) {
    alert("この元請の現場名はすでに登録されています");
    return;
  }

    const { error } = await supabase.from("sites").insert({
      contractor_name: contractorName,
      manager_name: managerName || null,
      site_name: siteName,
    });

    if (error) {
      alert("追加失敗: " + error.message);
      return;
    }

    setContractorName("");
    setManagerName("");
    setSiteName("");

    fetchData();
  };

  // 削除
  const handleDelete = async (id: string) => {
    const ok = window.confirm("この現場を削除しますか？");
    if (!ok) return;

    const { error } = await supabase.from("sites").delete().eq("id", id);

    if (error) {
      alert("削除失敗: " + error.message);
      return;
    }

    fetchData();
  };

  const inputStyle = {
    width: "100%",
    padding: 12,
    border: "1px solid #ccc",
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 12,
  };

  const groupedSites = sites.reduce<Record<string, Site[]>>((acc, site) => {
    const contractor = site.contractor_name || "未設定";
  
    if (!acc[contractor]) {
      acc[contractor] = [];
    }
  
    acc[contractor].push(site);
  
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}>
      <BackButton />

      <h1>現場管理</h1>

      <input
  type="file"
  accept=".csv"
  onChange={async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const rows = text
      .split("\n")
      .map((line) => line.split(","))
      .slice(1);

    const res = await fetch("/api/admin/upload-sites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rows }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "アップロード失敗");
      return;
    }

    alert(`アップロード完了: ${result.insertedCount ?? 0}件追加しました`);
fetchData();
  }}
/>
<button
  onClick={() => {
    const csv = "元請,担当者,現場名\n〇〇建設,田中,東京現場A";

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "sites_template.csv";
    a.click();
  }}
  style={{
    marginTop: 12,
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #ccc",
    background: "#fff",
    cursor: "pointer",
  }}
>
  テンプレートダウンロード
</button>

      {/* 入力フォーム */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          backgroundColor: "#fff",
        }}
      >
        <p>元請</p>
        <select
          value={contractorName}
          onChange={(e) => setContractorName(e.target.value)}
          style={inputStyle}
        >
          <option value="">選択してください</option>
          {contractors.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <p>担当者</p>
        <input
          value={managerName}
          onChange={(e) => setManagerName(e.target.value)}
          placeholder="担当者名"
          style={inputStyle}
        />

        <p>現場名</p>
        <input
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
          placeholder="現場名"
          style={inputStyle}
        />

        <button
          onClick={handleAdd}
          style={{
            width: "100%",
            padding: 14,
            backgroundColor: "#111",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          現場を追加
        </button>
      </div>

      {/* 一覧 */}
<h2>現場一覧</h2>

{sites.length === 0 ? (
  <p>現場がありません</p>
) : (
  <div style={{ display: "grid", gap: 18 }}>
    {Object.entries(groupedSites).map(([contractorName, contractorSites]) => (
      <div
        key={contractorName}
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 14,
          backgroundColor: "#fafafa",
        }}
      >
        <h3 style={{ margin: "0 0 12px 0" }}>
          {contractorName}
          <span style={{ fontSize: 13, color: "#666", marginLeft: 8 }}>
            {contractorSites.length}件
          </span>
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr auto",
            fontSize: 13,
            color: "#666",
            padding: "6px 12px",
            borderBottom: "1px solid #ddd",
            marginBottom: 6,
          }}
        >
          <div>現場名</div>
          <div>担当者</div>
          <div></div>
        </div>

        <div style={{ display: "grid" }}>
          {contractorSites.map((site) => (
            <div
              key={site.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr auto",
                alignItems: "center",
                padding: "10px 12px",
                borderBottom: "1px solid #eee",
                backgroundColor: "#fff",
              }}
            >
              <div style={{ fontWeight: 600 }}>{site.site_name}</div>

              <div style={{ color: "#555" }}>
                {site.manager_name || "-"}
              </div>

              <button
                onClick={() => handleDelete(site.id)}
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
          ))}
        </div>
      </div>
    ))}
  </div>
)}
    </div>
  );
}