"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";
import { hasRole } from "@/app/types/auth";

type Report = {
  report_date: string;
  contractor_name: string | null;
  site_name: string | null;
  shift_type: string | null;
  worker_count: number | null;
  vehicle_count: number | null;
  overtime_minutes: number | null;
};

type Row = {
  name: string;
  day: number;
  night: number;
  total: number;
  dayRate: number;
  nightRate: number;
};

type DailyRow = {
  date: string;
  labor: number;
};

export default function MonthlyAnalyticsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");

const [year, setYear] = useState(
  String(new Date().getFullYear())
);
  const [targetLabor, setTargetLabor] = useState("1000");
  const [requiredVehicles, setRequiredVehicles] = useState("0");
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
  
      let start = "";
      let end = "";

if (viewMode === "monthly") {
  start = `${month}-01`;

  end = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5, 7)),
    0
  )
    .toISOString()
    .slice(0, 10);
} else {
  start = `${year}-01-01`;
  end = `${year}-12-31`;
}

const { data, error } = await supabase
.from("daily_reports")
.select(
  "report_date, contractor_name, site_name, shift_type, worker_count, vehicle_count, overtime_minutes"
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
  }, [month, year, viewMode]);

  const createSummary = (key: "contractor_name" | "site_name") => {
    const map = new Map<string, Row>();

    reports.forEach((report) => {
      const name = report[key] || "未設定";
      const workerCount = Number(report.worker_count ?? 0);

      const current = map.get(name) || {
        name,
        day: 0,
        night: 0,
        total: 0,
        dayRate: 0,
        nightRate: 0,
      };

      if (report.shift_type === "night") {
        current.night += workerCount;
      } else {
        current.day += workerCount;
      }

      current.total += workerCount;
      map.set(name, current);
    });

    return Array.from(map.values())
      .map((row) => ({
        ...row,
        dayRate: row.total ? Math.round((row.day / row.total) * 100) : 0,
        nightRate: row.total ? Math.round((row.night / row.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  };

  const companyRows = useMemo(
    () => createSummary("contractor_name"),
    [reports]
  );
  
  const siteRows = useMemo(
    () => createSummary("site_name"),
    [reports]
  );

  const totalLabor = reports.reduce(
    (sum, r) => sum + Number(r.worker_count ?? 0),
    0
  );

  const totalVehicles = reports.reduce(
    (sum, r) => sum + Number(r.vehicle_count ?? 0),
    0
  );

  const totalOvertimeMinutes = reports.reduce(
    (sum, r) => sum + Number(r.overtime_minutes ?? 0),
    0
  );

  const target = Number(targetLabor || 0);
  const progressRate =
    target > 0 ? Math.round((totalLabor / target) * 1000) / 10 : 0;

  const remainingLabor = Math.max(target - totalLabor, 0);

  const requiredVehicleCount = Number(requiredVehicles || 0);
  const vehicleAchievementRate =
    requiredVehicleCount > 0
      ? Math.round((totalVehicles / requiredVehicleCount) * 1000) / 10
      : 0;

      const dailyRows: DailyRow[] = useMemo(() => {
        const map = new Map<string, number>();
      
        reports.forEach((report) => {
          const date = report.report_date || "未設定";
          const labor = Number(report.worker_count ?? 0);
      
          map.set(date, (map.get(date) ?? 0) + labor);
        });
      
        return Array.from(map.entries())
          .map(([date, labor]) => ({ date, labor }))
          .sort((a, b) => a.date.localeCompare(b.date));
      }, [reports]);
      
      const maxDailyLabor = Math.max(...dailyRows.map((row) => row.labor), 1);

  const cardStyle = {
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
  } as const;

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 14,
  };

  const th = {
    border: "1px solid #ccc",
    padding: 8,
    backgroundColor: "#f6d878",
    textAlign: "center" as const,
  };

  const td = {
    border: "1px solid #ccc",
    padding: 8,
    textAlign: "center" as const,
  };

  const renderTable = (rows: Row[], label: string) => (
    <div style={{ overflowX: "auto" }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={th}>{label}</th>
            <th style={th}>昼</th>
            <th style={th}>夜</th>
            <th style={th}>合計</th>
            <th style={th}>昼%</th>
            <th style={th}>夜%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td style={{ ...td, textAlign: "left", fontWeight: 600 }}>
                {row.name}
              </td>
              <td style={{ ...td, background: "#fff7d6" }}>{row.day}</td>
              <td style={{ ...td, background: "#e8f1ff" }}>{row.night}</td>
              <td style={{ ...td, fontWeight: 700 }}>{row.total}</td>
              <td style={td}>{row.dayRate}%</td>
              <td style={td}>{row.nightRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <BackButton />

      <h1>月次分析</h1>

      <div
  style={{
    display: "flex",
    gap: 8,
    marginBottom: 12,
  }}
>
  <button
    onClick={() => setViewMode("monthly")}
    style={{
      padding: "8px 12px",
      borderRadius: 8,
      border: "1px solid #ccc",
      background:
        viewMode === "monthly" ? "#111" : "#fff",
      color:
        viewMode === "monthly" ? "#fff" : "#111",
    }}
  >
    月次
  </button>

  <button
    onClick={() => setViewMode("yearly")}
    style={{
      padding: "8px 12px",
      borderRadius: 8,
      border: "1px solid #ccc",
      background:
        viewMode === "yearly" ? "#111" : "#fff",
      color:
        viewMode === "yearly" ? "#fff" : "#111",
    }}
  >
    年間
  </button>
</div>

      {/* 入力 */}
      <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
      {viewMode === "monthly" ? (
  <input
    type="month"
    value={month}
    onChange={(e) => setMonth(e.target.value)}
  />
) : (
  <input
    type="number"
    value={year}
    onChange={(e) => setYear(e.target.value)}
    min="2020"
    max="2100"
  />
)}
        <input type="number" value={targetLabor} onChange={(e) => setTargetLabor(e.target.value)} placeholder="目標人工" />
        <input type="number" value={requiredVehicles} onChange={(e) => setRequiredVehicles(e.target.value)} placeholder="必要台数" />
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))" }}>
        <div style={cardStyle}>進捗率 {progressRate}%</div>
        <div style={cardStyle}>合計人工 {totalLabor}</div>
        <div style={cardStyle}>残り {remainingLabor}</div>
        <div style={cardStyle}>車両 {totalVehicles}</div>
        <div style={cardStyle}>必要台数 {requiredVehicleCount}</div>
        <div style={cardStyle}>車両達成 {vehicleAchievementRate}%</div>
        <div style={cardStyle}>残業 {totalOvertimeMinutes}分</div>
      </div>

{/* 日別推移グラフ */}
<div style={{ ...cardStyle, marginTop: 24 }}>
  <h2 style={{ marginTop: 0 }}>日別人工推移</h2>

  {dailyRows.length === 0 ? (
    <p>データがありません</p>
  ) : (
    <div style={{ display: "grid", gap: 10 }}>
      {dailyRows.map((row) => (
        <div
          key={row.date}
          style={{
            display: "grid",
            gridTemplateColumns: "90px 1fr 50px",
            gap: 8,
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 13 }}>{row.date.slice(5)}</div>

          <div
            style={{
              height: 18,
              backgroundColor: "#eee",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${(row.labor / maxDailyLabor) * 100}%`,
                height: "100%",
                backgroundColor: "#111",
                borderRadius: 999,
              }}
            />
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, textAlign: "right" }}>
            {row.labor}
          </div>
        </div>
      ))}
    </div>
  )}
</div>

      {/* テーブル */}
      <div style={{ marginTop: 24, display: "grid", gap: 20 }}>
        <div style={cardStyle}>
          <h2>会社別</h2>
          {renderTable(companyRows, "会社")}
        </div>

        <div style={cardStyle}>
          <h2>現場別</h2>
          {renderTable(siteRows, "現場")}
        </div>
      </div>
    </div>
  );
}