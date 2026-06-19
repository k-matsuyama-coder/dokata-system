"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type Assignment = {
  id: string;
  site_name: string | null;
  contractor_name: string | null;
  shift_type: string | null;
};

type SiteMember = {
    assignment_id: string;
    work_date: string;
    employee_name: string;
    is_foreman: boolean | null;
  };

type DailyReport = {
  id: string;
  report_date: string;
  site_name: string | null;
  worker_name: string | null;
  worker_count: number | null;
  members: string | null;
};

export default function ReportStatusPage() {
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [siteMembers, setSiteMembers] = useState<SiteMember[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [showUnsubmittedOnly, setShowUnsubmittedOnly] = useState(false);

  const fetchData = async () => {
    const { data: assignmentData, error: assignmentError } = await supabase
      .from("assignments")
      .select("id, site_name, contractor_name, shift_type")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (assignmentError) {
      alert("現場取得失敗: " + assignmentError.message);
      return;
    }

    const assignmentIds = assignmentData?.map((a) => a.id) ?? [];

    if (assignmentIds.length === 0) {
      setAssignments([]);
      setSiteMembers([]);
      setReports([]);
      return;
    }

    const { data: memberData, error: memberError } = await supabase
      .from("assignment_site_members")
      .select("assignment_id, work_date, employee_name, is_foreman")
      .in("assignment_id", assignmentIds)
      .eq("work_date", date);

    if (memberError) {
      alert("番割メンバー取得失敗: " + memberError.message);
      return;
    }

    const { data: reportData, error: reportError } = await supabase
      .from("daily_reports")
      .select("id, report_date, site_name, worker_name, worker_count, members")
      .eq("report_date", date);

    if (reportError) {
      alert("日報取得失敗: " + reportError.message);
      return;
    }

    setAssignments(assignmentData ?? []);
    setSiteMembers(memberData ?? []);
    setReports(reportData ?? []);
  };

  useEffect(() => {
    fetchData();
  }, [date]);

  const rows = useMemo(() => {
    return assignments
      .map((assignment) => {
        const members = siteMembers.filter(
          (member) => member.assignment_id === assignment.id
        );

        if (members.length === 0) return null;

        const report = reports.find(
          (r) => r.site_name === assignment.site_name
        );

        const assignmentCount = members.length;
        const reportCount = report?.worker_count ?? 0;
        const diff = report ? reportCount - assignmentCount : null;

        return {
          assignment,
          assignmentCount,
          report,
          reportCount,
          diff,
        };
      })
      .filter(Boolean)
      .filter((row: any) => {
        if (!showUnsubmittedOnly) return true;

        return !row.report;
      });
  }, [assignments, siteMembers, reports, showUnsubmittedOnly]);

  const sendNotificationToForeman = async (row: any) => {
    const foreman = siteMembers.find(
      (member) =>
        member.assignment_id === row.assignment.id &&
        member.is_foreman
    );
  
    if (!foreman) {
      alert("この現場に職長が設定されていません");
      return;
    }
  
    const pushResponse = await fetch("/api/send-push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeName: foreman.employee_name,
          title: "日報確認依頼",
          message: `${date} ${row.assignment.site_name} の日報を確認してください`,
        }),
      });
      
      const pushResult = await pushResponse.json();
      
      if (!pushResult.success) {
        alert("プッシュ通知失敗: " + pushResult.message);
        return;
      }
      
      alert(
        `${foreman.employee_name} さんに通知しました / Push送信数: ${pushResult.sentCount}`
      );
  };

  const sendAllNotifications = async () => {
    const unsubmittedRows = rows.filter(
      (row: any) => !row.report
    );

    let sentCount = 0;

    for (const row of unsubmittedRows) {
      const foreman = siteMembers.find(
        (member) =>
          member.assignment_id === row.assignment.id &&
          member.is_foreman
      );

      if (!foreman) continue;

      await supabase.from("notifications").insert({
        employee_name: foreman.employee_name,
        title: "日報確認依頼",
        message: `${date} ${row.assignment.site_name} の日報を提出してください`,
        link_url: "/reports/new",
        is_read: false,
      });
      
      await fetch("/api/send-push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeName: foreman.employee_name,
          title: "日報確認依頼",
          message: `${date} ${row.assignment.site_name} の日報を提出してください`,
        }),
      });
      
      sentCount++;
    }

    alert(`${sentCount}件の通知を送信しました`);
  };

  return (
    <div style={{ padding: 16, backgroundColor: "#f5f6f8", minHeight: "100vh" }}>
      <BackButton />

      <h1>日報送付確認</h1>

      <div
  style={{
    display: "flex",
    gap: 8,
    alignItems: "center",
    marginBottom: 16,
  }}
>
  <button
    onClick={() => {
      const d = new Date(date);
      d.setDate(d.getDate() - 1);
      setDate(d.toISOString().slice(0, 10));
    }}
    style={{
      padding: "10px 14px",
      borderRadius: 8,
      border: "1px solid #ccc",
      cursor: "pointer",
    }}
  >
    ◀ 前日
  </button>

  <input
    type="date"
    value={date}
    onChange={(e) => setDate(e.target.value)}
    style={{
      padding: 10,
      borderRadius: 8,
      border: "1px solid #ccc",
      fontSize: 16,
    }}
  />

  <button
    onClick={() => {
      const d = new Date(date);
      d.setDate(d.getDate() + 1);
      setDate(d.toISOString().slice(0, 10));
    }}
    style={{
      padding: "10px 14px",
      borderRadius: 8,
      border: "1px solid #ccc",
      cursor: "pointer",
    }}
  >
    翌日 ▶
  </button>

  <button
    onClick={() =>
      setDate(new Date().toISOString().slice(0, 10))
    }
    style={{
      padding: "10px 14px",
      borderRadius: 8,
      border: "1px solid #ccc",
      cursor: "pointer",
      fontWeight: 700,
    }}
  >
    今日
  </button>
</div>

<label
  style={{
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 700,
    marginBottom: 16,
    cursor: "pointer",
  }}
>
  <input
    type="checkbox"
    checked={showUnsubmittedOnly}
    onChange={(e) => setShowUnsubmittedOnly(e.target.checked)}
  />
  未送付のみ表示
</label>

<div style={{ marginBottom: 16 }}>
  <button
    onClick={sendAllNotifications}
    style={{
      backgroundColor: "#dc2626",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      padding: "10px 16px",
      fontWeight: 800,
      cursor: "pointer",
    }}
  >
    未送付へ一括通知
  </button>
</div>

      <div
        style={{
          overflowX: "auto",
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderRadius: 12,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 900,
            fontSize: 14,
          }}
        >
          <thead>
            <tr>
              <th style={th}>状態</th>
              <th style={th}>元請</th>
              <th style={th}>現場名</th>
              <th style={th}>昼/夜</th>
              <th style={th}>番割人数</th>
              <th style={th}>日報人数</th>
              <th style={th}>差</th>
              <th style={th}>日報作成者</th>
<th style={th}>通知</th>

            </tr>
          </thead>

          <tbody>
            {rows.map((row: any) => {
              const isSubmitted = !!row.report;

              return (
                <tr key={row.assignment.id}>
                  <td
                    style={{
                      ...td,
                      fontWeight: 900,
                      color: isSubmitted ? "#16a34a" : "#dc2626",
                      backgroundColor: isSubmitted ? "#ecfdf5" : "#fee2e2",
                    }}
                  >
                    {isSubmitted ? "送付済み" : "未送付"}
                  </td>

                  <td style={td}>{row.assignment.contractor_name || "-"}</td>
                  <td style={{ ...td, fontWeight: 800 }}>
                    {row.assignment.site_name || "-"}
                  </td>
                  <td style={td}>
                    {row.assignment.shift_type === "night" ? "夜" : "昼"}
                  </td>
                  <td style={td}>{row.assignmentCount}</td>
                  <td style={td}>{isSubmitted ? row.reportCount : "-"}</td>
                  <td
                    style={{
                      ...td,
                      fontWeight: 900,
                      color:
                        row.diff === 0
                          ? "#16a34a"
                          : row.diff === null
                          ? "#999"
                          : "#dc2626",
                    }}
                  >
                    {row.diff === null
                      ? "-"
                      : row.diff > 0
                      ? `+${row.diff}`
                      : row.diff}
                  </td>
                  <td style={td}>{row.report?.worker_name || "-"}</td>
                  <td style={td}>
  <button
    type="button"
    onClick={() => sendNotificationToForeman(row)}
    style={{
      padding: "6px 10px",
      border: "none",
      borderRadius: 8,
      backgroundColor: "#111",
      color: "#fff",
      fontWeight: 800,
      cursor: "pointer",
    }}
  >
    通知
  </button>
</td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td style={td} colSpan={9}>
                  この日の番割予定はありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = {
  border: "1px solid #ddd",
  padding: 10,
  backgroundColor: "#f3f4f6",
  textAlign: "center" as const,
  whiteSpace: "nowrap" as const,
};

const td = {
  border: "1px solid #ddd",
  padding: 10,
  textAlign: "center" as const,
  whiteSpace: "nowrap" as const,
};