"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        alert("ログインしてください");
        return;
      }

      const { data, error } = await supabase
        .from("daily_reports")
        .select(
          "id, report_date, worker_name, site_name, shift_type, start_time, end_time, worker_count, vehicle_count, driver_name, note, expressway_main, expressway_secondary, expressway_subcontract, parking_main, parking_secondary, parking_subcontract, fuel_gasoline, fuel_diesel, work_description"
        )
        .eq("user_id", user.id)
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
            <div
              key={report.id}
              style={{
                border: "1px solid #ccc",
                padding: 16,
                marginBottom: 12,
              }}
            >
              <p>日付: {report.report_date}</p>
              <p>名前: {report.worker_name}</p>
              <p>現場名: {report.site_name}</p>
              <p>区分: {report.shift_type === "day" ? "昼" : "夜"}</p>
              <p>開始時間: {report.start_time}</p>
              <p>終了時間: {report.end_time}</p>
              <p>稼働人数: {report.worker_count}</p>
              <p>車両台数: {report.vehicle_count}</p>
              <p>車両運転手: {report.driver_name}</p>
              <p>高速料金（本体）: {report.expressway_main}</p>
              <p>高速料金（二次受け）: {report.expressway_secondary}</p>
              <p>高速料金（下請け）: {report.expressway_subcontract}</p>
              <p>駐車場料金（本体）: {report.parking_main}</p>
              <p>駐車場料金（二次受け）: {report.parking_secondary}</p>
              <p>駐車場料金（下請け）: {report.parking_subcontract}</p>
              <p>燃料代（ガソリン）: {report.fuel_gasoline}</p>
              <p>燃料代（軽油）: {report.fuel_diesel}</p>
              <p>作業内容: {report.work_description}</p>
              <p>備考: {report.note}</p>
              <a href={`/reports/${report.id}/edit`}>編集</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}