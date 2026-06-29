"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ReportSummaryCard from "@/app/components/ReportSummaryCard";

type Report = {
  id: string;
  report_date: string;
  worker_name: string;
  site_name: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  worker_count: number;
  vehicle_count: number;
  driver_name: string | null;
  note: string | null;
  expressway_main: number;
  expressway_secondary: number;
  expressway_subcontract: number;
  parking_main: number;
  parking_secondary: number;
  parking_subcontract: number;
  fuel_gasoline: number;
  fuel_diesel: number;
  work_description: string | null;
  members: string | null;
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const getCurrentOrganization = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
  
    if (!token) {
      return null;
    }
  
    const res = await fetch("/api/current-organization", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  
    const result = await res.json();
  
    if (!res.ok) {
      console.error(result.error || "organization取得失敗");
      return null;
    }
  
    return result.organizationId as string | null;
  };

  useEffect(() => {
    const fetchReports = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        alert("ログインしてください");
        return;
      }

      const currentOrganizationId = await getCurrentOrganization();

if (!currentOrganizationId) {
  alert("会社情報が取得できません");
  return;
}

      const { data, error } = await supabase
        .from("daily_reports")
        .select(
          "id, report_date, worker_name, site_name, shift_type, start_time, end_time, worker_count, vehicle_count, driver_name, note, expressway_main, expressway_secondary, expressway_subcontract, parking_main, parking_secondary, parking_subcontract, fuel_gasoline, fuel_diesel, work_description, members"
        )
        .eq("organization_id", currentOrganizationId)
        .order("created_at", { ascending: false });

      if (error) {
        alert("取得失敗: " + error.message);
        return;
      }

      setReports(data ?? []);
    };

    fetchReports();
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ margin: 0 }}>日報一覧</h1>

        <a
          href="/reports/new"
          style={{
            textDecoration: "none",
            backgroundColor: "#111",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          ＋ 日報を新規登録
        </a>
      </div>

      {reports.length === 0 ? (
        <p>データがありません</p>
      ) : (
        <div>
          {reports.map((report) => (
            <div key={report.id} style={{ marginBottom: 12 }}>
              <ReportSummaryCard report={report} />

              <div style={{ marginTop: 8 }}>
                <a
                  href={`/reports/${report.id}/edit`}
                  style={{
                    display: "inline-block",
                    textDecoration: "none",
                    backgroundColor: "#111",
                    color: "#fff",
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  編集
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}