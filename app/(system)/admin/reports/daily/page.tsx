"use client";

import { useEffect, useMemo, useState } from "react";
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

type AssignmentMember = {
  assignment_id: string;
  work_date: string;
};

type MonthDayStatus = {
  day: number;
  dateString: string;
  totalSites: number;
  checkedSites: number;
  status: "green" | "red" | "gray";
};

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function DailyReportAdminPage() {
  const [date, setDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [reports, setReports] = useState<Report[]>([]);
  const [monthReports, setMonthReports] = useState<Report[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  
  const [assignmentMembers, setAssignmentMembers] = useState<AssignmentMember[]>([]);
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

  const scheduledSiteCount = new Set(
    assignmentMembers
      .filter((member) => member.work_date === date)
      .map((member) => member.assignment_id)
  ).size;
  
  const checkedSiteCount = new Set(
    reports
      .filter((report) => report.is_checked && report.site_name)
      .map((report) => report.site_name)
  ).size;
  
  const canPrint =
    scheduledSiteCount > 0 &&
    checkedSiteCount === scheduledSiteCount;

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
  }, [date, calendarMonth]);

  const fetchReports = async (currentOrganizationId: string) => {
    const firstDay = formatLocalDate(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1)
    );
  
    const lastDay = formatLocalDate(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0)
    );
  
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
      .gte("report_date", firstDay)
      .lte("report_date", lastDay)
      .order("report_date", { ascending: true })
      .order("created_at", { ascending: true });
  
    if (error) {
      alert("日報取得失敗: " + error.message);
      return;
    }
  
    const allReports = data ?? [];
  
    setMonthReports(allReports);
    setReports(
      allReports.filter((report) => report.report_date === date)
    );
  
    const { data: assignmentMemberData, error: assignmentMemberError } =
      await supabase
        .from("assignment_site_members")
        .select("assignment_id, work_date")
        .eq("organization_id", currentOrganizationId)
        .gte("work_date", firstDay)
        .lte("work_date", lastDay);
  
    if (assignmentMemberError) {
      alert("予定現場取得失敗: " + assignmentMemberError.message);
      return;
    }
  
    setAssignmentMembers(assignmentMemberData ?? []);
  };

  const thStyle = {
    border: "1px solid #333",
    padding: 6,
    backgroundColor: "#f2f2f2",
    fontSize: 12,
    whiteSpace: "nowrap" as const,
    textAlign: "center" as const,
  };

  const monthDays = useMemo<MonthDayStatus[]>(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
  
    return Array.from({ length: lastDay }, (_, i) => {
      const day = i + 1;
  
      const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  
      const dayMembers = assignmentMembers.filter(
        (m) => m.work_date === dateString
      );
  
      const totalSites = new Set(dayMembers.map((m) => m.assignment_id)).size;
  
      const checkedSites = new Set(
        monthReports
          .filter(
            (report) =>
              report.report_date === dateString &&
              report.is_checked &&
              report.site_name
          )
          .map((report) => report.site_name)
      ).size;
  
      let status: "green" | "red" | "gray" = "gray";
  
      if (totalSites === 0) {
        status = "gray";
      } else if (checkedSites === totalSites) {
        status = "green";
      } else {
        status = "red";
      }
  
      return {
        day,
        dateString,
        totalSites,
        checkedSites,
        status,
      };
    });
  }, [calendarMonth, assignmentMembers, monthReports]);
  
  const firstDay = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1
  );
  
  const startOffset = (firstDay.getDay() + 6) % 7;

  const tdStyle = {
    border: "1px solid #333",
    padding: 6,
    fontSize: 12,
    verticalAlign: "top" as const,
  };

  return (
    <div
  style={{
    width: "100%",
    padding: 16,
    boxSizing: "border-box",
  }}
>
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

      <div
  className="no-print"
  style={{
    width: "100%",
    marginBottom: 16,
  }}
>
        <BackButton />

        <h1>日別日報確認</h1>

        <div
  style={{
    background: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    border: "1px solid #ddd",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 12,
      alignItems: "center",
    }}
  >
    <button
      onClick={() =>
        setCalendarMonth(
          new Date(
            calendarMonth.getFullYear(),
            calendarMonth.getMonth() - 1,
            1
          )
        )
      }
    >
      ◀ 前月
    </button>

    <strong>
      {calendarMonth.getFullYear()}年
      {calendarMonth.getMonth() + 1}月
    </strong>

    <button
      onClick={() =>
        setCalendarMonth(
          new Date(
            calendarMonth.getFullYear(),
            calendarMonth.getMonth() + 1,
            1
          )
        )
      }
    >
      翌月 ▶
    </button>
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 8,
      marginBottom: 8,
      fontWeight: 700,
      textAlign: "center",
    }}
  >
    <div>月</div>
    <div>火</div>
    <div>水</div>
    <div>木</div>
    <div>金</div>
    <div style={{ color: "#2563eb" }}>土</div>
    <div style={{ color: "#dc2626" }}>日</div>
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 8,
    }}
  >
    {Array.from({ length: startOffset }).map((_, index) => (
      <div key={`empty-${index}`} />
    ))}

    {monthDays.map((day) => (
      <button
        key={day.dateString}
        onClick={() => setDate(day.dateString)}
        style={{
          borderRadius: 8,
          padding: 8,
          background:
            day.status === "green"
              ? "#dcfce7"
              : day.status === "red"
                ? "#fee2e2"
                : "#e5e7eb",
          cursor: "pointer",
          border:
            day.dateString === date
              ? "3px solid #2563eb"
              : day.dateString === formatLocalDate(new Date())
                ? "2px solid #16a34a"
                : "1px solid #ddd",
        }}
      >
        <div style={{ fontWeight: 800 }}>{day.day}</div>

        <div
          style={{
            fontSize: 12,
            marginTop: 4,
          }}
        >
          {day.checkedSites}/{day.totalSites}
        </div>
      </button>
    ))}
  </div>

  <div
    style={{
      marginTop: 12,
      display: "flex",
      gap: 12,
      fontSize: 13,
    }}
  >
    <span>🟢 全確認済み</span>
    <span>🔴 未確認あり</span>
    <span>⚪ 現場なし</span>
  </div>
</div>

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
  disabled={!canPrint}
  onClick={() => {
    if (!canPrint) {
      alert(
        `予定現場数と確認済み現場数が一致していません。\n\n予定現場：${scheduledSiteCount}件\n確認済み：${checkedSiteCount}件`
      );
      return;
    }

    window.print();
  }}
  style={{
    padding: "10px 14px",
    backgroundColor: canPrint ? "#111" : "#aaa",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: canPrint ? "pointer" : "not-allowed",
    fontWeight: 600,
  }}
>
  印刷
</button>
        </div>
      </div>

      <div
  className="print-area"
  style={{
    width: "100%",
  }}
>
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
        setMonthReports((prev) =>
  prev.map((item) =>
    item.id === report.id
      ? { ...item, is_checked: checked }
      : item
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
  {Number((Number(report.overtime_minutes ?? 0) / 60).toFixed(2))}時間
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