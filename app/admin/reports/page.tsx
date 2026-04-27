"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type Report = {
  id: string;
  report_date: string;
  worker_name: string;
  site_name: string;
};

export default function ReportsAdminPage() {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      const { data } = await supabase
        .from("daily_reports")
        .select("id, report_date, worker_name, site_name")
        .order("report_date", { ascending: false });

      setReports(data ?? []);
    };

    fetchReports();
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
      <BackButton />

      <h1>日報管理</h1>

      {/* 🔥 CSV一括登録 */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: "bold" }}>CSV一括登録</p>

        <button
  onClick={() => {
    const header = [
        "日付",
        "名前",
        "現場",
        "勤務",
        "開始",
        "終了",
        "人工",
        "車両",
        "運転者",
        "備考",
        "高速(元請)",
        "高速(下請)",
        "高速(協力)",
        "駐車(元請)",
        "駐車(下請)",
        "駐車(協力)",
        "ガソリン",
        "軽油",
        "作業内容",
        "メンバー",
      ];

      const sample = [
        [
          "2026-04-01",
          "山田太郎",
          "東京現場",
          "day",
          "08:00",
          "17:00",
          "3",
          "2",
          "佐藤",
          "通常",
          "1000",
          "500",
          "0",
          "300",
          "200",
          "0",
          "4000",
          "0",
          "舗装作業",
          "田中,鈴木",
        ],
      ];

    const csv =
      [header, ...sample]
        .map((row) => row.join(","))
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "daily_reports_template.csv";
    a.click();

    URL.revokeObjectURL(url);
  }}
  style={{
    marginBottom: 12,
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #ccc",
    backgroundColor: "#fff",
    cursor: "pointer",
  }}
>
  テンプレートダウンロード
</button>

        <input
          type="file"
          accept=".csv"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const text = await file.text();
            const rows = text.split("\n").map((r) => r.split(","));

            const dataRows = rows.slice(1);

            const insertData = dataRows
              .filter((r) => r.length >= 6)
              .map((r) => ({
                report_date: r[0],
                worker_name: r[1],
                site_name: r[2],
                shift_type: r[3],
                start_time: r[4],
                end_time: r[5],
                worker_count: Number(r[6] || 0),
                vehicle_count: Number(r[7] || 0),
                driver_name: r[8] || null,
                note: r[9] || null,
                expressway_main: Number(r[10] || 0),
                expressway_secondary: Number(r[11] || 0),
                expressway_subcontract: Number(r[12] || 0),
                parking_main: Number(r[13] || 0),
                parking_secondary: Number(r[14] || 0),
                parking_subcontract: Number(r[15] || 0),
                fuel_gasoline: Number(r[16] || 0),
                fuel_diesel: Number(r[17] || 0),
                work_description: r[18] || null,
                members: r[19] || null,
              }));

            const { error } = await supabase
              .from("daily_reports")
              .insert(insertData);

            if (error) {
              alert("登録失敗: " + error.message);
              return;
            }

            alert("CSV登録完了");
            window.location.reload();
          }}
        />
      </div>

      {/* 日報一覧 */}
      <div>
        <h2>日報一覧</h2>

        {reports.length === 0 ? (
          <p>データなし</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {reports.map((r) => (
              <div
                key={r.id}
                style={{
                  border: "1px solid #ddd",
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                <p style={{ margin: 0 }}>{r.report_date}</p>
                <p style={{ margin: 0 }}>{r.worker_name}</p>
                <p style={{ margin: 0 }}>{r.site_name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}