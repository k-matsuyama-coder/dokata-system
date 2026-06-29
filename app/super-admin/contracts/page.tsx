"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

export default function ContractsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchText, setSearchText] = useState("");

  const fetchOrganizations = async () => {
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name, plan, status, contract_start_date, contract_end_date")
      .order("contract_end_date", { ascending: true });

    if (error) {
      alert("契約情報の取得に失敗しました: " + error.message);
      return;
    }

    setOrganizations(data ?? []);
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const getStatusLabel = (status: string | null) => {
    if (status === "active") return "利用中";
    if (status === "trial") return "トライアル中";
    if (status === "suspended") return "停止中";
    if (status === "cancelled") return "解約済み";
    return "未設定";
  };

  const getRemainingDays = (endDate: string | null) => {
    if (!endDate) return null;

    const today = new Date();
    const end = new Date(endDate);

    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <BackButton />

      <h1>契約管理</h1>

      <input
        placeholder="会社名で検索"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          border: "1px solid #ccc",
          borderRadius: 8,
          fontSize: 16,
          boxSizing: "border-box",
          marginBottom: 20,
        }}
      />

      <div style={{ display: "grid", gap: 12 }}>
        {filteredOrganizations.map((org) => {
          const remainingDays = getRemainingDays(org.contract_end_date);

          return (
            <div
              key={org.id}
              style={{
                backgroundColor: "#fff",
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: 16,
                display: "grid",
                gap: 8,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 900 }}>{org.name}</div>

              <div style={{ fontSize: 14, color: "#555" }}>
                プラン：{org.plan ?? "未設定"} ／ 状態：
                {getStatusLabel(org.status)}
              </div>

              <div style={{ fontSize: 14, color: "#555" }}>
                契約開始：{org.contract_start_date ?? "-"} ／ 契約終了：
                {org.contract_end_date ?? "-"}
              </div>

              {remainingDays !== null && (
                <div
                  style={{
                    fontWeight: 800,
                    color:
                      remainingDays < 0
                        ? "red"
                        : remainingDays <= 7
                        ? "#b26a00"
                        : "#111",
                  }}
                >
                  {remainingDays < 0
                    ? `契約期限切れ：${Math.abs(remainingDays)}日経過`
                    : `残り${remainingDays}日`}
                </div>
              )}

              <Link
                href={`/super-admin/organizations/${org.id}`}
                style={{
                  marginTop: 6,
                  color: "#111",
                  fontWeight: 800,
                  textDecoration: "underline",
                }}
              >
                契約を編集
              </Link>
            </div>
          );
        })}

        {filteredOrganizations.length === 0 && <p>契約会社がありません</p>}
      </div>
    </div>
  );
}