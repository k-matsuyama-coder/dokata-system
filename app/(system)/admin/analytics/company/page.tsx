"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";
import { hasRole } from "@/app/types/auth";

type Report = {
  report_date: string;
  contractor_name: string | null;
  shift_type: string | null;
  worker_count: number | null;
  vehicle_count: number | null;
  overtime_minutes: number | null;
};

type CompanyRow = {
  name: string;
  day: number;
  night: number;
  total: number;
  vehicles: number;
  overtime: number;
  dayRate: number;
  nightRate: number;
};

export default function CompanyAnalyticsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

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

  useEffect(() => {
    const fetchReports = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const currentOrganizationId = await getCurrentOrganization();

if (!currentOrganizationId) {
  alert("会社情報が取得できません");
  return;
}
  
      if (!userData.user) {
        window.location.href = "/login";
        return;
      }
  
      const { data: employee } = await supabase
  .from("employees")
  .select("role")
  .eq("organization_id", currentOrganizationId)
  .eq("auth_user_id", userData.user.id)
  .single();
  
      if (!employee || !hasRole(employee.role, "admin")) {
        window.location.href = "/home";
        return;
      }
  
      const start = `${month}-01`;
      const end = new Date(
        Number(month.slice(0, 4)),
        Number(month.slice(5, 7)),
        0
      )
        .toISOString()
        .slice(0, 10);

        const { data, error } = await supabase
        .from("daily_reports")
        .select(
          "report_date, contractor_name, shift_type, worker_count, vehicle_count, overtime_minutes"
        )
        .eq("organization_id", currentOrganizationId)
        .gte("report_date", start)
        .lte("report_date", end);

      if (error) {
        alert("取得失敗: " + error.message);
        return;
      }

      setReports(data ?? []);
    };

    fetchReports();
  }, [month]);

  const rows = useMemo(() => {
    const map = new Map<string, CompanyRow>();

    reports.forEach((report) => {
      const name = report.contractor_name || "未設定";
      const workerCount = Number(report.worker_count ?? 0);

      const current = map.get(name) || {
        name,
        day: 0,
        night: 0,
        total: 0,
        vehicles: 0,
        overtime: 0,
        dayRate: 0,
        nightRate: 0,
      };

      if (report.shift_type === "night") {
        current.night += workerCount;
      } else {
        current.day += workerCount;
      }

      current.total += workerCount;
      current.vehicles += Number(report.vehicle_count ?? 0);
      current.overtime += Number(report.overtime_minutes ?? 0);

      map.set(name, current);
    });

    return Array.from(map.values())
      .map((row) => ({
        ...row,
        dayRate: row.total ? Math.round((row.day / row.total) * 100) : 0,
        nightRate: row.total ? Math.round((row.night / row.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [reports]);

  const totalLabor = rows.reduce((sum, row) => sum + row.total, 0);
  const totalVehicles = rows.reduce((sum, row) => sum + row.vehicles, 0);
  const totalOvertime = rows.reduce((sum, row) => sum + row.overtime, 0);

  const cardStyle = {
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
  } as const;

  const th = {
    border: "1px solid #ccc",
    padding: 8,
    backgroundColor: "#f6d878",
    textAlign: "center" as const,
    whiteSpace: "nowrap" as const,
  };

  const td = {
    border: "1px solid #ccc",
    padding: 8,
    textAlign: "center" as const,
    whiteSpace: "nowrap" as const,
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <BackButton />

      <h1 style={{ marginBottom: 16 }}>元請別集計</h1>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <p style={{ margin: "0 0 8px 0", fontWeight: 700 }}>対象月</p>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{
            width: "100%",
            maxWidth: 240,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 16,
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div style={cardStyle}>合計人工：{totalLabor}</div>
        <div style={cardStyle}>車両合計：{totalVehicles}</div>
        <div style={cardStyle}>残業合計：{totalOvertime}分</div>
        <div style={cardStyle}>会社数：{rows.length}</div>
      </div>

      <div style={cardStyle}>
      <h2 style={{ marginTop: 0 }}>元請ごとの内訳</h2>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr>
              <th style={th}>元請名</th>
                <th style={th}>昼</th>
                <th style={th}>夜</th>
                <th style={th}>合計</th>
                <th style={th}>昼%</th>
                <th style={th}>夜%</th>
                <th style={th}>車両</th>
                <th style={th}>残業</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td style={td} colSpan={8}>
                    データがありません
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.name}>
                    <td style={{ ...td, textAlign: "left", fontWeight: 700 }}>
                      {row.name}
                    </td>
                    <td style={{ ...td, backgroundColor: "#fff7d6" }}>
                      {row.day}
                    </td>
                    <td style={{ ...td, backgroundColor: "#e8f1ff" }}>
                      {row.night}
                    </td>
                    <td style={{ ...td, fontWeight: 800 }}>{row.total}</td>
                    <td style={td}>{row.dayRate}%</td>
                    <td style={td}>{row.nightRate}%</td>
                    <td style={td}>{row.vehicles}</td>
                    <td style={td}>{row.overtime}分</td>
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