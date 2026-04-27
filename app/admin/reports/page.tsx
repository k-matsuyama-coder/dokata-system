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
                note: r[8] || "",
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