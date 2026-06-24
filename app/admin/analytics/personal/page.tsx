"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type ReportMemberRow = {
  employee_name: string | null;
  labor: number | null;
  overtime: number | null;
  is_driver: boolean | null;
  report_id: string;
  daily_reports: {
    id: string;
    report_date: string;
    site_name: string | null;
    contractor_name: string | null;
    shift_type: string | null;
  } | null;
};

type DailyRow = {
  date: string;
  site: string;
  contractor: string;
  shift: string;
  labor: number;
  overtime: number;
  isDriver: boolean;
};

function PersonalAnalyticsContent() {
  const searchParams = useSearchParams();

  const queryName = searchParams.get("name") ?? "";
  const queryMonth = searchParams.get("month") ?? "";

  const [employeeName, setEmployeeName] = useState(queryName);
  const [month, setMonth] = useState(() => {
    if (queryMonth) return queryMonth;

    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [employees, setEmployees] = useState<string[]>([]);
  const [rows, setRows] = useState<ReportMemberRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data } = await supabase
        .from("employees")
        .select("name")
        .order("name", { ascending: true });
  
      setEmployees((data ?? []).map((item) => item.name));
  
      if (!queryName) {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
  
        if (!user) return;
  
        const { data: employee } = await supabase
          .from("employees")
          .select("name")
          .eq("auth_user_id", user.id)
          .single();
  
        if (employee) {
          setEmployeeName(employee.name);
        }
      }
    };
  
    fetchEmployees();
  }, [queryName]);

  useEffect(() => {
    const fetchRows = async () => {
      if (!employeeName) {
        setRows([]);
        return;
      }

      setLoading(true);

      const start = `${month}-01`;
      const end = getNextMonth(month);

      const { data, error } = await supabase
        .from("report_members")
        .select(`
          employee_name,
          labor,
          overtime,
          is_driver,
          report_id,
          daily_reports!inner (
            id,
            report_date,
            site_name,
            contractor_name,
            shift_type
          )
        `)
        .eq("employee_name", employeeName)
        .gte("daily_reports.report_date", start)
        .lt("daily_reports.report_date", end)
        .order("report_id", { ascending: false });

      if (error) {
        alert("個人集計取得失敗: " + error.message);
        setLoading(false);
        return;
      }

      setRows((data ?? []) as any);
      setLoading(false);
    };

    fetchRows();
  }, [employeeName, month]);

  const dailyRows: DailyRow[] = useMemo(() => {
    return rows
      .map((row) => ({
        date: row.daily_reports?.report_date ?? "-",
        site: row.daily_reports?.site_name ?? "-",
        contractor: row.daily_reports?.contractor_name ?? "-",
        shift: row.daily_reports?.shift_type === "night" ? "夜" : "昼",
        labor: Number(row.labor ?? 0),
        overtime: Number(row.overtime ?? 0),
        isDriver: Boolean(row.is_driver),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [rows]);

  const summary = useMemo(() => {
    const dayRows = dailyRows.filter((row) => row.shift === "昼");
    const nightRows = dailyRows.filter((row) => row.shift === "夜");

    const dayLabor = dayRows.reduce((sum, row) => sum + row.labor, 0);
    const nightLabor = nightRows.reduce((sum, row) => sum + row.labor, 0);
    const totalLabor = dayLabor + nightLabor;

    const overtime = dailyRows.reduce((sum, row) => sum + row.overtime, 0);
    const driveCount = dailyRows.filter((row) => row.isDriver).length;
    const workDays = new Set(dailyRows.map((row) => row.date)).size;

    return {
      dayCount: dayRows.length,
      nightCount: nightRows.length,
      workDays,
      dayLabor,
      nightLabor,
      totalLabor,
      overtime,
      driveCount,
    };
  }, [dailyRows]);

  const siteRows = useMemo(() => {
    const map = new Map<string, number>();

    dailyRows.forEach((row) => {
      map.set(row.site, (map.get(row.site) ?? 0) + row.labor);
    });

    return Array.from(map.entries())
      .map(([site, labor]) => ({ site, labor }))
      .sort((a, b) => b.labor - a.labor);
  }, [dailyRows]);

  const contractorRows = useMemo(() => {
    const map = new Map<string, number>();

    dailyRows.forEach((row) => {
      map.set(row.contractor, (map.get(row.contractor) ?? 0) + row.labor);
    });

    return Array.from(map.entries())
      .map(([contractor, labor]) => ({ contractor, labor }))
      .sort((a, b) => b.labor - a.labor);
  }, [dailyRows]);

  const maxDailyLabor = Math.max(
    ...dailyRows.map((row) => row.labor),
    1
  );

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <BackButton />

      <h1>個人分析</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <div style={labelStyle}>社員</div>
          <select
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            style={inputStyle}
          >
            <option value="">選択してください</option>
            {employees.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div style={labelStyle}>対象月</div>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {!employeeName ? (
        <p>社員を選択してください。</p>
      ) : loading ? (
        <p>読み込み中...</p>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <KpiCard label="稼働日数" value={`${summary.workDays}日`} />
            <KpiCard label="昼" value={`${summary.dayCount}回`} />
            <KpiCard label="夜" value={`${summary.nightCount}回`} />
            <KpiCard label="人工合計" value={`${summary.totalLabor}`} />
            <KpiCard label="残業" value={`${summary.overtime}h`} />
            <KpiCard label="運転回数" value={`${summary.driveCount}回`} />
          </div>

          <div style={{ ...cardStyle, marginBottom: 20 }}>
            <h2 style={{ marginTop: 0 }}>日別人工推移</h2>

            {dailyRows.length === 0 ? (
              <p>データがありません。</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {dailyRows.map((row) => (
                  <div
                    key={`${row.date}_${row.site}_${row.shift}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "90px 1fr 60px",
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
                          backgroundColor:
                            row.shift === "夜" ? "#374151" : "#111",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        textAlign: "right",
                      }}
                    >
                      {row.labor}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <RankingCard
              title="現場別人工"
              rows={siteRows.map((row) => ({
                name: row.site,
                value: row.labor,
              }))}
            />

            <RankingCard
              title="元請別人工"
              rows={contractorRows.map((row) => ({
                name: row.contractor,
                value: row.labor,
              }))}
            />
          </div>

          <div style={{ ...cardStyle, overflowX: "auto" }}>
            <h2 style={{ marginTop: 0 }}>明細</h2>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 760,
              }}
            >
              <thead>
                <tr>
                  <th style={th}>日付</th>
                  <th style={th}>昼/夜</th>
                  <th style={th}>元請</th>
                  <th style={th}>現場</th>
                  <th style={th}>人工</th>
                  <th style={th}>残業</th>
                  <th style={th}>運転</th>
                </tr>
              </thead>

              <tbody>
                {dailyRows.map((row) => (
                  <tr key={`${row.date}_${row.site}_${row.contractor}`}>
                    <td style={td}>{row.date}</td>
                    <td style={td}>{row.shift}</td>
                    <td style={td}>{row.contractor}</td>
                    <td style={td}>{row.site}</td>
                    <td style={td}>{row.labor}</td>
                    <td style={td}>{row.overtime}h</td>
                    <td style={td}>{row.isDriver ? "○" : "-"}</td>
                  </tr>
                ))}

                {dailyRows.length === 0 && (
                  <tr>
                    <td style={td} colSpan={7}>
                      データがありません。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const getNextMonth = (ym: string) => {
  const [year, month] = ym.split("-").map(Number);
  return new Date(year, month, 1).toISOString().slice(0, 10);
};

function KpiCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={cardStyle}>
      <div style={{ color: "#666", fontSize: 13 }}>{label}</div>
      <div style={{ fontWeight: 900, fontSize: 22, marginTop: 6 }}>
        {value}
      </div>
    </div>
  );
}

function RankingCard({
  title,
  rows,
}: {
  title: string;
  rows: { name: string; value: number }[];
}) {
  return (
    <div style={cardStyle}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>

      {rows.length === 0 ? (
        <p>データがありません。</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {rows.slice(0, 10).map((row, index) => (
            <div
              key={row.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                borderBottom: "1px solid #eee",
                paddingBottom: 6,
              }}
            >
              <span>
                {index + 1}. {row.name}
              </span>
              <strong>{row.value}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const cardStyle = {
  backgroundColor: "#fff",
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: 16,
} as const;

const labelStyle = {
  fontSize: 13,
  fontWeight: 800,
  marginBottom: 6,
} as const;

const inputStyle = {
  width: "100%",
  padding: 10,
  border: "1px solid #ccc",
  borderRadius: 8,
  fontSize: 15,
  boxSizing: "border-box" as const,
};

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

export default function PersonalAnalyticsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>読み込み中...</div>}>
      <PersonalAnalyticsContent />
    </Suspense>
  );
}