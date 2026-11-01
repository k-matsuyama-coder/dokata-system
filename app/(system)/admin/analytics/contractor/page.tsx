"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import CompanyComparison from "./CompanyComparison";
import { createPersonKey } from "./companyComparisonMath";
import BackButton from "@/app/components/BackButton";
import { useAppRefresh } from "@/app/hooks/useAppRefresh";
import { fetchCompanyPages } from "./fetchCompanyPages";
import { hasRole } from "@/app/types/auth";

type Employee = {
  id: string;
  name: string;
  company_name: string | null;
};

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
  people: Set<string>;
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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [members, setMembers] = useState<ReportMemberRow[]>([]);
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
        const { data: employee, error: roleError } = await supabase
          .from("employees").select("role")
          .eq("organization_id", organizationId)
          .eq("auth_user_id", session.user.id).abortSignal(controller.signal).single();
        if (roleError) throw roleError;
        if (!active || controller.signal.aborted) return;
        if (!employee || !hasRole(employee.role, "admin")) {
          window.location.href = "/home"; return;
        }
        const [employeeResult, memberResult] = await Promise.all([
          fetchCompanyPages((from, to) => supabase.from("employees")
            .select("id, name, company_name").eq("organization_id", organizationId)
            .order("id", { ascending: true }).range(from, to).abortSignal(controller.signal)),
          fetchCompanyPages((from, to) => supabase.from("report_members")
            .select("employee_id, employee_name, labor, overtime, is_driver, report_id, daily_reports!inner(report_date, shift_type)")
            .eq("organization_id", organizationId)
            .gte("daily_reports.report_date", `${month}-01`)
            .lt("daily_reports.report_date", getNextMonth(month))
            .order("id", { ascending: true }).range(from, to).abortSignal(controller.signal)),
        ]);
        if (employeeResult.error) throw new Error(`社員取得失敗: ${employeeResult.error.message}`);
        if (memberResult.error) throw new Error(`集計取得失敗: ${memberResult.error.message}`);
        if (!active || controller.signal.aborted) return;
        setChartOrganizationId(organizationId);
        setEmployees(employeeResult.data ?? []);
        setMembers((memberResult.data ?? []).map(member => ({
          ...member,
          daily_reports: Array.isArray(member.daily_reports)
            ? member.daily_reports[0] ?? null : member.daily_reports ?? null,
        })));

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

  const personKey = useMemo(() => createPersonKey(employees, members), [employees, members]);

  const rows = useMemo(() => {
    const employeeCompanyMap = new Map<string, string>();

    employees.forEach((employee) => {
      employeeCompanyMap.set(
        employee.name,
        employee.company_name || "未設定"
      );
    });

    const employeeCompanyById = new Map(employees.map(e => [e.id, e.company_name || "未設定"]));
    const map = new Map<string, CompanyRow>();

    members.forEach((member) => {
      const company =
        (member.employee_id ? employeeCompanyById.get(member.employee_id) : undefined) ?? employeeCompanyMap.get(member.employee_name) ?? "未設定";

      const current =
        map.get(company) ??
        {
          name: company,
          day: 0,
          night: 0,
          total: 0,
          overtime: 0,
          vehicles: 0,
          people: new Set<string>(),
          dayRate: 0,
          nightRate: 0,
        };

      const labor = Number(member.labor ?? 0);
      const overtime = Number(member.overtime ?? 0);
      const shift = member.daily_reports?.shift_type ?? "day";

      if (shift === "night") {
        current.night += labor;
      } else {
        current.day += labor;
      }

      current.total += labor;
      current.overtime += overtime;

      if (member.is_driver) {
        current.vehicles += 1;
      }

      if (labor > 0) current.people.add(personKey(member));

      map.set(company, current);
    });

    return Array.from(map.values())
      .map((row) => ({
        ...row,
        dayRate: row.total ? Math.round((row.day / row.total) * 100) : 0,
        nightRate: row.total ? Math.round((row.night / row.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [employees, members, personKey]);

  const totalLabor = rows.reduce((sum, row) => sum + row.total, 0);
  const totalOvertime = rows.reduce((sum, row) => sum + row.overtime, 0);
  const totalVehicles = rows.reduce((sum, row) => sum + row.vehicles, 0);
  const totalCompanies = rows.length;
  const totalPeople = new Set(
    members.filter(member => Number(member.labor ?? 0) > 0).map(personKey)
  ).size;

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
                      <td style={td}>{row.people.size}</td>
                      <td style={{ ...td, backgroundColor: "#fff7d6" }}>
                        {row.day}
                      </td>
                      <td style={{ ...td, backgroundColor: "#e8f1ff" }}>
                        {row.night}
                      </td>
                      <td style={{ ...td, fontWeight: 900 }}>{row.total}</td>
<td
  style={{ ...td, fontWeight: 800 }}
  title={`実稼働人数 ${row.people.size}人 × 23人工`}
>
  {row.people.size > 0
    ? `${(
        (row.total / (row.people.size * 23)) *
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
          employees={employees}
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