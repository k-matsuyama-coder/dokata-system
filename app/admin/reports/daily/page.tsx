"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type Report = {
  id: string;
  report_date: string;
  contractor_name: string | null;
  worker_name: string | null;
  site_name: string | null;
  shift_type: string | null;
  start_time: string | null;
  end_time: string | null;
  work_description: string | null;
  members: string | null;
  vehicle_count: number | null;
  driver_name: string | null;
  note: string | null;
  expressway_main: number | null;
  parking_main: number | null;
};

export default function DailyReportAdminPage() {
  const [date, setDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: employee } = await supabase
        .from("employees")
        .select("role")
        .eq("auth_user_id", user.id)
        .single();

      if (!employee || employee.role !== "admin") {
        alert("管理者のみ閲覧できます");
        window.location.href = "/home";
        return;
      }

      fetchReports();
    };

    checkAdminAndFetch();
  }, [date]);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from("daily_reports")
      .select(
        "id, report_date, contractor_name, worker_name, site_name, shift_type, start_time, end_time, work_description, members, vehicle_count, driver_name, note, expressway_main, parking_main"
      )
      .eq("report_date", date)
      .order("created_at", { ascending: true });

    if (error) {
      alert("日報取得失敗: " + error.message);
      return;
    }

    setReports(data ?? []);
  };

  const thStyle = {
    border: "1px solid #333",
    padding: 6,
    backgroundColor: "#f2f2f2",
    fontSize: 12,
    whiteSpace: "nowrap" as const,
    textAlign: "center" as const,
  };

  const tdStyle = {
    border: "1px solid #333",
    padding: 6,
    fontSize: 12,
    verticalAlign: "top" as const,
  };

  return (
    <div style={{ padding: 16 }}>
      <style>
        {`
          @media print {
            body {
              background: #fff;
            }

            .no-print {
              display: none !important;
            }

            .print-area {
              margin: 0;
              padding: 0;
            }

            table {
              page-break-inside: auto;
            }

            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
          }
        `}
      </style>

      <div className="no-print" style={{ maxWidth: 1200, margin: "0 auto 16px" }}>
        <BackButton />

        <h1>日別日報確認</h1>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 8,
              fontSize: 16,
            }}
          />

          <button
            onClick={() => window.print()}
            style={{
              padding: "10px 14px",
              backgroundColor: "#111",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            印刷
          </button>
        </div>
      </div>

      <div className="print-area" style={{ maxWidth: 1400, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", marginBottom: 12 }}>
          日報確認表　{date}
        </h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "#fff",
          }}
        >
          <thead>
            <tr>
              <th style={thStyle}>日付</th>
              <th style={thStyle}>元請</th>
              <th style={thStyle}>担当職員</th>
              <th style={thStyle}>昼/夜</th>
              <th style={thStyle}>現場名</th>
              <th style={thStyle}>稼働時間</th>
              <th style={thStyle}>工事内容</th>
              <th style={thStyle}>メンバー</th>
              <th style={thStyle}>車両台数</th>
              <th style={thStyle}>運転手</th>
              <th style={thStyle}>その他</th>
              <th style={thStyle}>本体</th>
            </tr>
          </thead>

          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td style={tdStyle} colSpan={12}>
                  この日の日報はありません
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id}>
                  <td style={tdStyle}>{report.report_date}</td>
                  <td style={tdStyle}>{report.contractor_name || "-"}</td>
                  <td style={tdStyle}>{report.worker_name || "-"}</td>
                  <td style={tdStyle}>
                    {report.shift_type === "night" ? "夜" : "昼"}
                  </td>
                  <td style={tdStyle}>{report.site_name || "-"}</td>
                  <td style={tdStyle}>
                    {report.start_time || "-"}〜{report.end_time || "-"}
                  </td>
                  <td style={tdStyle}>{report.work_description || "-"}</td>
                  <td style={tdStyle}>{report.members || "-"}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    {report.vehicle_count ?? 0}
                  </td>
                  <td style={tdStyle}>{report.driver_name || "-"}</td>
                  <td style={tdStyle}>{report.note || "-"}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    ¥
                    {Number(
                      (report.expressway_main ?? 0) + (report.parking_main ?? 0)
                    ).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}