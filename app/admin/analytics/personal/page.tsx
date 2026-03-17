"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type ReportMemberRow = {
  employee_name: string;
  labor: number;
  overtime: number;
  is_driver: boolean;
  daily_reports: {
    report_date: string;
    shift_type: string;
  } | null;
};

type SummaryRow = {
  name: string;
  dayLabor: number;
  nightLabor: number;
  dayOvertime: number;
  nightOvertime: number;
  driveCount: number;
};

export default function PersonalAnalyticsPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  });

  const [rows, setRows] = useState<ReportMemberRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        alert("ログインしてください");
        window.location.href = "/login";
        return;
      }

      const { data: me } = await supabase
        .from("employees")
        .select("role")
        .eq("auth_user_id", user.id)
        .single();

      if (!me || me.role !== "admin") {
        alert("管理者のみ閲覧できます");
        window.location.href = "/reports";
        return;
      }

      const startDate = `${month}-01`;
      const endDate = new Date(`${month}-01`);
      endDate.setMonth(endDate.getMonth() + 1);
      const endDateStr = endDate.toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from("report_members")
        .select(`
          employee_name,
          labor,
          overtime,
          is_driver,
          daily_reports!inner (
            report_date,
            shift_type
          )
        `)
        .gte("daily_reports.report_date", startDate)
        .lt("daily_reports.report_date", endDateStr);

      if (error) {
        alert("集計取得失敗: " + error.message);
        setLoading(false);
        return;
      }

      setRows((data as ReportMemberRow[]) ?? []);
      setLoading(false);
    };

    fetchData();
  }, [month]);

  const summary = useMemo(() => {
    const map = new Map<string, SummaryRow>();

    for (const row of rows) {
      const name = row.employee_name ?? "不明";
      const shiftType = row.daily_reports?.shift_type ?? "day";
      const labor = Number(row.labor || 0);
      const overtime = Number(row.overtime || 0);
      const isDriver = !!row.is_driver;

      if (!map.has(name)) {
        map.set(name, {
          name,
          dayLabor: 0,
          nightLabor: 0,
          dayOvertime: 0,
          nightOvertime: 0,
          driveCount: 0,
        });
      }

      const current = map.get(name)!;

      if (shiftType === "night") {
        current.nightLabor += labor;
        current.nightOvertime += overtime;
      } else {
        current.dayLabor += labor;
        current.dayOvertime += overtime;
      }

      if (isDriver) {
        current.driveCount += 1;
      }
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "ja"));
  }, [rows]);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}>
      <h1 style={{ marginBottom: 16 }}>個人別月次集計</h1>

      <div style={{ marginBottom: 16 }}>
        <p style={{ marginBottom: 8 }}>対象月</p>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{
            padding: 10,
            fontSize: 16,
            border: "1px solid #ccc",
            borderRadius: 8,
          }}
        />
      </div>

      {loading ? (
        <p>読み込み中...</p>
      ) : summary.length === 0 ? (
        <p>データがありません</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 760,
              backgroundColor: "#fff",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>名前</th>
                <th style={thStyle}>昼人工</th>
                <th style={thStyle}>夜人工</th>
                <th style={thStyle}>昼残業</th>
                <th style={thStyle}>夜残業</th>
                <th style={thStyle}>運転回数</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((item) => (
                <tr key={item.name}>
                  <td style={tdStyle}>{item.name}</td>
                  <td style={tdStyle}>{item.dayLabor}</td>
                  <td style={tdStyle}>{item.nightLabor}</td>
                  <td style={tdStyle}>{item.dayOvertime}</td>
                  <td style={tdStyle}>{item.nightOvertime}</td>
                  <td style={tdStyle}>{item.driveCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: 10,
  backgroundColor: "#f5f5f5",
  textAlign: "center",
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: 10,
  textAlign: "center",
};