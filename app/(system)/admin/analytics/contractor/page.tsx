"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CompanyComparison from "./CompanyComparison";
import BackButton from "@/app/components/BackButton";
import { useAppRefresh } from "@/app/hooks/useAppRefresh";
import { hasRole } from "@/app/types/auth";

type ReportMemberRow = {
  employee_id: string | null;
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

type CompanyRow = {
  name: string;
  day: number;
  night: number;
  total: number;
  overtime: number;
  vehicles: number;
  people: number;
  dayRate: number;
  nightRate: number;
};

const getNextMonth = (ym: string) => {
  const [year, month] = ym.split("-").map(Number);
  return new Date(Date.UTC(year, month, 1))
    .toISOString()
    .slice(0, 10);
};

export default function CompanyAnalyticsPage() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [chartOrganizationId, setChartOrganizationId] = useState<string | null>(null);
  const [rows, setRows] = useState<CompanyRow[]>([]);
  const [totalPeople, setTotalPeople] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  
  const refreshVersion = useAppRefresh();
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);
    setLoading(true);
    setErrorMessage("");
    const fetchData = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (!active || controller.signal.aborted) return;
        if (sessionError) throw sessionError;
        const session = sessionData.session;
        if (!session) { window.location.href = "/login"; return; }
        const response = await fetch("/api/current-organization", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          signal: controller.signal,
        });
        const context = await response.json();
        if (!response.ok || !context.organizationId) throw new Error("会社情報が取得できません。");
        const organizationId = context.organizationId as string;
        if (!active || controller.signal.aborted) return;

        if (!hasRole(context.role, "admin")) {
          window.location.href = "/home";
          return;
        }

        const memberResult = await supabase
          .rpc("company_monthly_summary_v1", {
            p_organization_id: organizationId,
            p_month: `${month}-01`,
          })
          .abortSignal(controller.signal);

        if (memberResult.error) {
          throw new Error(
            `集計取得失敗: ${memberResult.error.message}`
          );
        }

        if (!active || controller.signal.aborted) return;

        setChartOrganizationId(organizationId);
        const summary = memberResult.data as {
          month: string;
          rows: Omit<CompanyRow, "dayRate" | "nightRate">[];
          totalPeople: number;
        } | null;

        if (
          !summary ||
          summary.month !== month ||
          !Array.isArray(summary.rows) ||
          !Number.isFinite(summary.totalPeople)
        ) {
          throw new Error("月次集計の取得結果を確認できませんでした。");
        }

        for (const row of summary.rows) {
          if (
            typeof row.name !== "string" ||
            ![
              row.day,
              row.night,
              row.total,
              row.overtime,
              row.vehicles,
              row.people,
            ].every(Number.isFinite)
          ) {
            throw new Error("月次集計に不正な値が含まれています。");
          }
        }

        setRows(
          summary.rows.map((row) => ({
            ...row,
            dayRate: row.total
              ? Math.round((row.day / row.total) * 100)
              : 0,
            nightRate: row.total
              ? Math.round((row.night / row.total) * 100)
              : 0,
          }))
        );

        setTotalPeople(summary.totalPeople);

      } catch (error) {
        if (active) setErrorMessage(controller.signal.aborted
          ? "取得に時間がかかっています。再取得してください。"
          : error instanceof Error ? error.message : "データを取得できませんでした。");
      } finally {
        clearTimeout(timer);
        if (active) {
          if (controller.signal.aborted) setErrorMessage("取得に時間がかかっています。再取得してください。");
          setLoading(false);
        }
        controller.abort();
      }
    };
    void fetchData();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [month, retryCount, refreshVersion]);  

  const totalLabor = rows.reduce((sum, row) => sum + row.total, 0);
  const totalOvertime = rows.reduce((sum, row) => sum + row.overtime, 0);
  const totalVehicles = rows.reduce((sum, row) => sum + row.vehicles, 0);
  const totalCompanies = rows.length;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <BackButton />

      <h1 style={{ marginBottom: 16 }}>所属会社別集計</h1>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <p style={{ margin: "0 0 8px 0", fontWeight: 700 }}>対象月</p>
        <input
          type="month"
          value={month}
          onChange={(e) => { if (e.target.value) setMonth(e.target.value); }}
          style={inputStyle}
        />
        <button type="button" disabled={loading} onClick={() => setRetryCount(value => value + 1)}
          style={{ marginLeft: 12, padding: "10px 16px", borderRadius: 8, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}>
          {loading ? "取得中…" : "再取得"}
        </button>
        {errorMessage && <p role="alert" style={{ color: "#b91c1c" }}>{errorMessage}</p>}
      </div>

      {!loading && !errorMessage && <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <KpiCard label="合計人工" value={`${totalLabor}`} />
        <KpiCard label="残業合計" value={`${totalOvertime}h`} />
        <KpiCard label="運転回数" value={`${totalVehicles}回`} />
        <KpiCard label="所属会社数" value={`${totalCompanies}社`} />
        <KpiCard label="稼働人数" value={`${totalPeople}人`} />
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>所属会社ごとの内訳</h2>
        <p style={{ fontSize: 12, color: "#666", marginTop: 0 }}>
  進捗率＝合計人工 ÷（その月の実稼働人数 × 23）× 100。人工0のみの人は含めません。
</p>

        {loading ? (
          <p>読み込み中...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
                minWidth: 850,
              }}
            >
              <thead>
                <tr>
                  <th style={th}>所属会社</th>
                  <th style={th}>稼働人数</th>
                  <th style={th}>昼</th>
                  <th style={th}>夜</th>
                  <th style={th}>合計人工</th>
                  <th style={th}>進捗率</th>
                  <th style={th}>昼%</th>
                  <th style={th}>夜%</th>
                  <th style={th}>残業</th>
                  <th style={th}>運転回数</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td style={td} colSpan={10}>
                      データがありません
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.name}>
                      <td style={{ ...td, textAlign: "left", fontWeight: 800 }}>
                        {row.name}
                      </td>
                      <td style={td}>{row.people}</td>
                      <td style={{ ...td, backgroundColor: "#fff7d6" }}>
                        {row.day}
                      </td>
                      <td style={{ ...td, backgroundColor: "#e8f1ff" }}>
                        {row.night}
                      </td>
                      <td style={{ ...td, fontWeight: 900 }}>{row.total}</td>
<td
  style={{ ...td, fontWeight: 800 }}
  title={`実稼働人数 ${row.people}人 × 23人工`}
>
  {row.people > 0
    ? `${(
        (row.total / (row.people * 23)) *
        100
      ).toFixed(1)}%`
    : "—"}
</td>
<td style={td}>{row.dayRate}%</td>
                      <td style={td}>{row.nightRate}%</td>
                      <td style={td}>{row.overtime}h</td>
                      <td style={td}>{row.vehicles}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>}
      {loading && <p role="status">対象月のデータを取得しています…</p>}
      {chartOrganizationId && (
        <CompanyComparison
          key={chartOrganizationId}
          organizationId={chartOrganizationId}
          month={month}
          onMonthChange={setMonth}
          refreshToken={retryCount + refreshVersion}
        />
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
    <div style={cardStyle}>
      <div style={{ color: "#666", fontSize: 13 }}>{label}</div>
      <div style={{ fontWeight: 900, fontSize: 22, marginTop: 6 }}>
        {value}
      </div>
    </div>
  );
}

const cardStyle = {
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: 16,
  backgroundColor: "#fff",
} as const;

const inputStyle = {
  width: "100%",
  maxWidth: 240,
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 16,
  boxSizing: "border-box" as const,
};

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