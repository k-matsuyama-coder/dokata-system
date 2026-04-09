"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type ReportDetail = {
  id: string;
  report_date: string;
  site_name: string | null;
  contractor_name: string | null;
  work_description: string | null;
  shift_type: string | null;
  start_time: string | null;
  end_time: string | null;
  overtime_minutes: number | null;
  worker_name: string | null;
  worker_count: number | null;
  vehicle_count: number | null;
  driver_name: string | null;
  expressway_main: number | null;
  expressway_secondary: number | null;
  expressway_subcontract: number | null;
  parking_main: number | null;
  parking_secondary: number | null;
  parking_subcontract: number | null;
  fuel_gasoline: number | null;
  fuel_diesel: number | null;
  members: string | null;
  note: string | null;
};

export default function ReportDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      const { data, error } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        alert("日報取得失敗: " + error.message);
        setLoading(false);
        return;
      }

      setReport(data);
      setLoading(false);
    };

    if (id) {
      fetchReport();
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
        <BackButton />
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
        <BackButton />
        <p>日報が見つかりません</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <BackButton />
      <h1 style={{ marginBottom: 20 }}>日報詳細</h1>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 16,
          backgroundColor: "#fff",
          display: "grid",
          gap: 10,
        }}
      >
        <p>日付: {report.report_date || "-"}</p>
        <p>名前: {report.worker_name || "-"}</p>
        <p>元請: {report.contractor_name || "-"}</p>
        <p>現場名: {report.site_name || "-"}</p>
        <p>作業内容: {report.work_description || "-"}</p>
        <p>勤務帯: {report.shift_type === "night" ? "夜" : "昼"}</p>
        <p>開始時間: {report.start_time || "-"}</p>
        <p>終了時間: {report.end_time || "-"}</p>
        <p>残業: {report.overtime_minutes ?? 0}分</p>
        <p>稼働人数: {report.worker_count ?? 0}</p>
        <p>車両台数: {report.vehicle_count ?? 0}</p>
        <p>運転手: {report.driver_name || "-"}</p>
        <p>メンバー: {report.members || "-"}</p>

        <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "8px 0" }} />

        <p>高速料金 本体: ¥{report.expressway_main ?? 0}</p>
        <p>高速料金 2次請け: ¥{report.expressway_secondary ?? 0}</p>
        <p>高速料金 下請け: ¥{report.expressway_subcontract ?? 0}</p>

        <p>駐車場料金 本体: ¥{report.parking_main ?? 0}</p>
        <p>駐車場料金 2次請け: ¥{report.parking_secondary ?? 0}</p>
        <p>駐車場料金 下請け: ¥{report.parking_subcontract ?? 0}</p>

        <p>ガソリン: {report.fuel_gasoline ?? 0}L</p>
        <p>軽油: {report.fuel_diesel ?? 0}L</p>

        <p>備考: {report.note || "-"}</p>

        <div style={{ marginTop: 12 }}>
          <a
            href={`/reports/${report.id}/edit`}
            style={{
              display: "inline-block",
              textDecoration: "none",
              backgroundColor: "#111",
              color: "#fff",
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            編集する
          </a>
        </div>
      </div>
    </div>
  );
}