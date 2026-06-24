"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type Employee = {
  name: string;
  company_name: string | null;
};

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
  return new Date(year, month, 1).toISOString().slice(0, 10);
};

export default function CompanyAnalyticsPage() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [members, setMembers] = useState<ReportMemberRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const start = `${month}-01`;
      const end = getNextMonth(month);

      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("name, company_name");

      if (employeeError) {
        alert("社員取得失敗: " + employeeError.message);
        setLoading(false);
        return;
      }

      const { data: memberData, error: memberError } = await supabase
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

      if (memberError) {
        alert("会社別集計取得失敗: " + memberError.message);
        setLoading(false);
        return;
      }

      setEmployees(employeeData ?? []);
      setMembers((memberData ?? []) as any);
      setLoading(false);
    };

    fetchData();
  }, [month]);

  const rows = useMemo(() => {
    const employeeCompanyMap = new Map<string, string>();

    employees.forEach((employee) => {
      employeeCompanyMap.set(
        employee.name,
        employee.company_name || "未設定"
      );
    });

    const map = new Map<string, CompanyRow>();

    members.forEach((member) => {
      const company =
        employeeCompanyMap.get(member.employee_name) || "未設定";

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

      current.people.add(member.employee_name);

      map.set(company, current);
    });

    return Array.from(map.values())
      .map((row) => ({
        ...row,
        dayRate: row.total ? Math.round((row.day / row.total) * 100) : 0,
        nightRate: row.total ? Math.round((row.night / row.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [employees, members]);

  const totalLabor = rows.reduce((sum, row) => sum + row.total, 0);
  const totalOvertime = rows.reduce((sum, row) => sum + row.overtime, 0);
  const totalVehicles = rows.reduce((sum, row) => sum + row.vehicles, 0);
  const totalCompanies = rows.length;
  const totalPeople = new Set(
    members.map((member) => member.employee_name)
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
          onChange={(e) => setMonth(e.target.value)}
          style={inputStyle}
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
        <KpiCard label="合計人工" value={`${totalLabor}`} />
        <KpiCard label="残業合計" value={`${totalOvertime}h`} />
        <KpiCard label="運転回数" value={`${totalVehicles}回`} />
        <KpiCard label="所属会社数" value={`${totalCompanies}社`} />
        <KpiCard label="稼働人数" value={`${totalPeople}人`} />
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>所属会社ごとの内訳</h2>

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
                  <th style={th}>昼%</th>
                  <th style={th}>夜%</th>
                  <th style={th}>残業</th>
                  <th style={th}>運転回数</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td style={td} colSpan={9}>
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