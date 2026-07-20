"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";
import { hasRole } from "@/app/types/auth";

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
  is_checked: boolean | null;
  worker_count: number | null;
overtime_minutes: number | null;
organization_id: string;

expressway_secondary: number | null;
expressway_subcontract: number | null;

parking_secondary: number | null;
parking_subcontract: number | null;

heavy_equipment: string | null;
operator_name: string | null;
};

export default function DailyReportAdminPage() {
  const [date, setDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [reports, setReports] = useState<Report[]>([]);
  const getCurrentOrganization = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
  
    if (!token) return null;
  
    const res = await fetch("/api/current-organization", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  
    const result = await res.json();
  
    if (!res.ok) return null;
  
    return result.organizationId as string | null;
  };

const allChecked =
  reports.length > 0 &&
  reports.every((report) => report.is_checked);

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const currentOrganizationId = await getCurrentOrganization();

if (!currentOrganizationId) {
  alert("会社情報が取得できません");
  return;
}
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

      if (!employee || !hasRole(employee.role, "admin")) {
        alert("管理者のみ閲覧できます");
        window.location.href = "/home";
        return;
      }

      fetchReports(currentOrganizationId);
    };

    checkAdminAndFetch();
  }, [date]);

  const fetchReports = async (currentOrganizationId: string) => {
    const { data, error } = await supabase
      .from("daily_reports")
      .select(
        `
        id,
        report_date,
        contractor_name,
        worker_name,
        site_name,
        shift_type,
        start_time,
        end_time,
        overtime_minutes,
        worker_count,
        vehicle_count,
        driver_name,
        work_description,
        members,
        note,
        expressway_main,
        expressway_secondary,
        expressway_subcontract,
        parking_main,
        parking_secondary,
        parking_subcontract,
        heavy_equipment,
        operator_name,
        is_checked,
        organization_id
      `
      )
      .eq("organization_id", currentOrganizationId)
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
  disabled={!allChecked}
  onClick={() => {
    if (!allChecked) {
      alert("すべての確認チェックを入れてください");
      return;
    }

    window.print();
  }}
  style={{
    padding: "10px 14px",
    backgroundColor: allChecked ? "#111" : "#aaa",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: allChecked ? "pointer" : "not-allowed",
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

        <div
  style={{
    overflowX: "auto",
    width: "100%",
  }}
>
  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
      backgroundColor: "#fff",
      minWidth: 2200,
    }}
  >
          <thead>
          <tr>
  <th style={thStyle}>確認</th>
  <th style={thStyle}>日付</th>
  <th style={thStyle}>営業所</th>
  <th style={thStyle}>担当職員</th>
  <th style={thStyle}>昼/夜</th>
  <th style={thStyle}>現場名</th>
  <th style={thStyle}>稼働人員</th>
  <th style={thStyle}>稼働時間</th>
  <th style={thStyle}>残業</th>
  <th style={thStyle}>作業員数</th>
  <th style={thStyle}>工事内容</th>
  <th style={thStyle}>メンバー</th>
  <th style={thStyle}>車両台数</th>
  <th style={thStyle}>運転手</th>
  <th style={thStyle}>重機運転</th>
  <th style={thStyle}>OP</th>

  <th style={thStyle}>高速 本体</th>
  <th style={thStyle}>高速 出向</th>
  <th style={thStyle}>高速 下請</th>

  <th style={thStyle}>駐車 本体</th>
  <th style={thStyle}>駐車 出向</th>
  <th style={thStyle}>駐車 下請</th>

  <th style={thStyle}>備考</th>
</tr>
          </thead>

          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td style={tdStyle} colSpan={23}>
                  この日の日報はありません
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id}>
  <td style={{ ...tdStyle, textAlign: "center" }}>
    <input
      type="checkbox"
      checked={!!report.is_checked}
      onChange={async (e) => {
        const checked = e.target.checked;

        const { error } = await supabase
          .from("daily_reports")
          .update({
            is_checked: checked,
          })
          .eq("organization_id", report.organization_id)
          .eq("id", report.id);

        if (error) {
          alert("更新失敗: " + error.message);
          return;
        }

        setReports((prev) =>
          prev.map((r) =>
            r.id === report.id
              ? { ...r, is_checked: checked }
              : r
          )
        );
      }}
    />
  </td>

  <td style={tdStyle}>{report.report_date}</td>

  <td style={tdStyle}>
    {report.contractor_name || "-"}
  </td>

  <td style={tdStyle}>
    {report.worker_name || "-"}
  </td>

  <td style={tdStyle}>
    {report.shift_type === "night" ? "夜" : "昼"}
  </td>

  <td style={tdStyle}>
    {report.site_name || "-"}
  </td>

  <td style={{ ...tdStyle, textAlign: "center" }}>
    {report.worker_count ?? 0}
  </td>

  <td style={tdStyle}>
    {report.start_time || "-"}〜{report.end_time || "-"}
  </td>

  <td style={{ ...tdStyle, textAlign: "center" }}>
    {report.overtime_minutes ?? 0}
  </td>

  <td style={{ ...tdStyle, textAlign: "center" }}>
    {report.worker_count ?? 0}
  </td>

  <td style={tdStyle}>
    {report.work_description || "-"}
  </td>

  <td style={tdStyle}>
    {report.members || "-"}
  </td>

  <td style={{ ...tdStyle, textAlign: "center" }}>
    {report.vehicle_count ?? 0}
  </td>

  <td style={tdStyle}>
    {report.driver_name || "-"}
  </td>

  <td style={tdStyle}>
    {report.heavy_equipment || "-"}
  </td>

  <td style={tdStyle}>
    {report.operator_name || "-"}
  </td>

  <td style={{ ...tdStyle, textAlign: "right" }}>
    ¥{Number(report.expressway_main ?? 0).toLocaleString()}
  </td>

  <td style={{ ...tdStyle, textAlign: "right" }}>
    ¥{Number(report.expressway_secondary ?? 0).toLocaleString()}
  </td>

  <td style={{ ...tdStyle, textAlign: "right" }}>
    ¥{Number(report.expressway_subcontract ?? 0).toLocaleString()}
  </td>

  <td style={{ ...tdStyle, textAlign: "right" }}>
    ¥{Number(report.parking_main ?? 0).toLocaleString()}
  </td>

  <td style={{ ...tdStyle, textAlign: "right" }}>
    ¥{Number(report.parking_secondary ?? 0).toLocaleString()}
  </td>

  <td style={{ ...tdStyle, textAlign: "right" }}>
    ¥{Number(report.parking_subcontract ?? 0).toLocaleString()}
  </td>

  <td style={tdStyle}>
    {report.note || "-"}
  </td>
</tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}