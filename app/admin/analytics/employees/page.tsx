"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type ReportMemberRow = {
  employee_name: string;
  labor: number | null;
  overtime: number | null;
  is_driver: boolean | null;
  report_id: string;
  daily_reports: {
    report_date: string;
    shift_type: string | null;
  } | null;
};

type SummaryRow = {
  name: string;
  dayCount: number;
  nightCount: number;
  totalDays: number;
  labor: number;
  overtime: number;
  driveCount: number;
};

const getNextMonth = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 1).toISOString().slice(0, 10);
};

export default function EmployeesAnalyticsPage() {
  const [yearMonth, setYearMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [rows, setRows] = useState<ReportMemberRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRows = async () => {
      setLoading(true);

      const start = `${yearMonth}-01`;
      const end = getNextMonth(yearMonth);

      const { data, error } = await supabase
        .from("report_members")
        .select(`
          employee_name,
          labor,
          overtime,
          is_driver,
          report_id,
          daily_reports!inner (
            report_date,
            shift_type
          )
        `)
        .gte("daily_reports.report_date", start)
        .lt("daily_reports.report_date", end);

      if (error) {
        alert("社員別集計取得失敗: " + error.message);
        setLoading(false);
        return;
      }

      setRows((data ?? []) as any);
      setLoading(false);
    };

    fetchRows();
  }, [yearMonth]);

  const summaryRows = useMemo(() => {
    const map = new Map<string, SummaryRow>();

    rows.forEach((row) => {
      const name = row.employee_name || "未設定";
      const shift = row.daily_reports?.shift_type ?? "day";

      const current =
        map.get(name) ??
        {
          name,
          dayCount: 0,
          nightCount: 0,
          totalDays: 0,
          labor: 0,
          overtime: 0,
          driveCount: 0,
        };

      if (shift === "night") {
        current.nightCount += 1;
      } else {
        current.dayCount += 1;
      }

      current.totalDays += 1;
      current.labor += Number(row.labor ?? 0);
      current.overtime += Number(row.overtime ?? 0);

      if (row.is_driver) {
        current.driveCount += 1;
      }

      map.set(name, current);
    });

    return Array.from(map.values()).sort(
      (a, b) => b.totalDays - a.totalDays
    );
  }, [rows]);

  const totalWorkers = summaryRows.length;
  const totalDays = summaryRows.reduce((sum, row) => sum + row.totalDays, 0);
  const totalLabor = summaryRows.reduce((sum, row) => sum + row.labor, 0);
  const totalOvertime = summaryRows.reduce((sum, row) => sum + row.overtime, 0);
  const totalDriveCount = summaryRows.reduce(
    (sum, row) => sum + row.driveCount,
    0
  );

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <BackButton />

      <h1>社員別集計一覧</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          type="month"
          value={yearMonth}
          onChange={(e) => setYearMonth(e.target.value)}
          style={{
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
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <KpiCard label="対象人数" value={`${totalWorkers}人`} />
        <KpiCard label="稼働合計" value={`${totalDays}日`} />
        <KpiCard label="人工合計" value={`${totalLabor}`} />
        <KpiCard label="残業合計" value={`${totalOvertime}h`} />
        <KpiCard label="運転回数" value={`${totalDriveCount}回`} />
      </div>

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              backgroundColor: "#fff",
              minWidth: 900,
            }}
          >
            <thead>
              <tr>
                <th style={th}>社員名</th>
                <th style={th}>稼働日数</th>
                <th style={th}>昼</th>
                <th style={th}>夜</th>
                <th style={th}>人工</th>
                <th style={th}>残業</th>
                <th style={th}>運転回数</th>
                <th style={th}>詳細</th>
              </tr>
            </thead>

            <tbody>
              {summaryRows.map((row) => (
                <tr key={row.name}>
                  <td style={{ ...td, fontWeight: 800 }}>{row.name}</td>
                  <td style={td}>{row.totalDays}</td>
                  <td style={td}>{row.dayCount}</td>
                  <td style={td}>{row.nightCount}</td>
                  <td style={td}>{row.labor}</td>
                  <td style={td}>{row.overtime}h</td>
                  <td style={td}>{row.driveCount}</td>
                  <td style={td}>
                    <a
                      href={`/admin/analytics/personal?name=${encodeURIComponent(
                        row.name
                      )}&month=${yearMonth}`}
                      style={{
                        color: "#2563eb",
                        fontWeight: 800,
                      }}
                    >
                      個人分析
                    </a>
                  </td>
                </tr>
              ))}

              {summaryRows.length === 0 && (
                <tr>
                  <td style={td} colSpan={8}>
                    データがありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div style={{ color: "#666", fontSize: 13 }}>{label}</div>
      <div style={{ fontWeight: 900, fontSize: 22, marginTop: 6 }}>
        {value}
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