"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Employee = { name: string; company_name: string | null };
type Entry = { employee_name: string; labor: number; date: string };
type ReportDate = { report_date: string };
type RawEntry = {
  employee_name: string;
  labor: number | null;
  daily_reports: ReportDate | ReportDate[] | null;
};
const colors = ["#2563eb", "#db2777", "#059669", "#d97706", "#7c3aed", "#0891b2", "#dc2626", "#475569"];
const number = (value: number) => value.toLocaleString("ja-JP", { maximumFractionDigits: 2 });

export default function AnnualCompanyChart({ organizationId, employees }: {
  organizationId: string;
  employees: Employee[];
}) {
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());
  const currentYear = Number(today.slice(0, 4));
  const currentMonth = Number(today.slice(5, 7));
  const [year, setYear] = useState(currentYear);
  const [opened, setOpened] = useState(false);
  const [retry, setRetry] = useState(0);
  const [data, setData] = useState<{ year: number; entries: Entry[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hidden, setHidden] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  useEffect(() => {
    if (!opened) return;
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    setLoading(true);
    setError("");
    setData(null);
    setSelectedMonth(null);
    const load = async () => {
      try {
        const entries: Entry[] = [];
        let offset = 0;
        // Return all rows even when the server's response limit is below 500.
        while (true) {
          const { data: page, error: queryError } = await supabase
            .from("report_members")
            .select("id, employee_name, labor, daily_reports!inner(report_date)")
            .eq("organization_id", organizationId)
            .gte("daily_reports.report_date", `${year}-01-01`)
            .lt("daily_reports.report_date", `${year + 1}-01-01`)
            .order("id", { ascending: true })
            .range(offset, offset + 499)
            .abortSignal(controller.signal);
          if (queryError) throw new Error(queryError.message);
          if (controller.signal.aborted) throw new Error("取得がタイムアウトしました。");
          if (!active) return;
          const rows = (page ?? []) as unknown as RawEntry[];
          if (!rows.length) break;
          for (const row of rows) {
            const report = Array.isArray(row.daily_reports) ? row.daily_reports[0] : row.daily_reports;
            if (!report) throw new Error("日報の日付を取得できませんでした。");
            entries.push({ employee_name: row.employee_name, labor: Number(row.labor ?? 0), date: report.report_date });
          }
          offset += rows.length;
        }
        if (active) setData({ year, entries });
      } catch (cause) {
        if (active) setError(controller.signal.aborted
          ? "取得に時間がかかっています。再取得してください。"
          : cause instanceof Error ? cause.message : "年間データを取得できませんでした。");
      } finally {
        clearTimeout(timeout);
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [opened, year, organizationId, retry]);

  const series = useMemo(() => {
    const companies = new Map<string, { name: string; headcount: number; labor: number[] }>();
    const employeeCompanies = new Map<string, string>();
    for (const employee of employees) {
      const company = employee.company_name || "未設定";
      employeeCompanies.set(employee.name, company);
      if (!companies.has(company)) companies.set(company, { name: company, headcount: 0, labor: Array(12).fill(0) });
      companies.get(company)!.headcount++;
    }
    for (const entry of data?.year === year ? data.entries : []) {
      const company = employeeCompanies.get(entry.employee_name) || "未設定";
      if (!companies.has(company)) companies.set(company, { name: company, headcount: 0, labor: Array(12).fill(0) });
      const index = Number(entry.date.slice(5, 7)) - 1;
      if (index >= 0 && index < 12) companies.get(company)!.labor[index] += entry.labor;
    }
    return Array.from(companies.values()).sort((a, b) => a.name.localeCompare(b.name, "ja"))
      .map((company, index) => ({ ...company, color: colors[index % colors.length],
        rates: company.labor.map((labor, month) =>
          year > currentYear || (year === currentYear && month >= currentMonth) || !company.headcount
            ? null : labor / (company.headcount * 23) * 100),
      }));
  }, [employees, data, year, currentYear, currentMonth]);

  const visible = series.filter(company => !hidden.includes(company.name));
  const maxRate = Math.max(100, ...visible.flatMap(company => company.rates.map(rate => rate ?? 0)));
  const ceiling = Math.ceil(maxRate / 50) * 50;
  const x = (month: number) => 65 + month * 66;
  const y = (rate: number) => 285 - rate / ceiling * 235;
  const ready = !loading && !error && data?.year === year;
  const hasData = ready && data.entries.length > 0;
  const detailMonth = selectedMonth ?? (year === currentYear ? currentMonth - 1 : 0);
  const cell = { padding: "10px 12px", textAlign: "right" as const, borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" as const };
  const button = { padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 8, background: "white", color: "#334155", cursor: "pointer" };

  return (
    <section style={{ marginTop: 20, padding: 20, background: "#fff", border: "1px solid #ddd", borderRadius: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>年間の進捗</h2>
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 0 }}>月の人工 ÷（現在の所属人数 × 23）× 100。昼・夜を含みます。</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" style={button} aria-label="前年" onClick={() => setYear(value => value - 1)}>‹</button>
          <strong>{year}年</strong>
          <button type="button" style={button} aria-label="翌年" disabled={year >= currentYear} onClick={() => setYear(value => value + 1)}>›</button>
          <button type="button" style={button} disabled={loading} onClick={() => { if (opened) setRetry(value => value + 1); else setOpened(true); }}>
            {loading ? "取得中…" : opened ? "再取得" : "グラフを表示"}
          </button>
        </div>
      </div>
      {!opened && <p style={{ color: "#64748b", fontSize: 13 }}>「グラフを表示」で年間データを読み込みます。</p>}
      {loading && <p role="status">{year}年のデータを取得しています…</p>}
      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
      {ready && !hasData && <p>この年の日報データはありません。</p>}
      {hasData && <>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
          {series.map(company => <label key={company.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "#f8fafc", borderRadius: 6, fontSize: 13 }}>
            <input type="checkbox" checked={!hidden.includes(company.name)} onChange={() => setHidden(previous => previous.includes(company.name) ? previous.filter(name => name !== company.name) : [...previous, company.name])} />
            <span style={{ width: 10, height: 10, borderRadius: 5, background: company.color }} />{company.name}
          </label>)}
        </div>
        {!visible.length ? <p>表示する会社を選択してください。</p> : <>
          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <svg viewBox="0 0 850 330" role="group" aria-label={`${year}年の所属会社別月間進捗率。月を選ぶと下に詳細を表示します。`} style={{ display: "block", width: "100%", minWidth: 650 }}>
              {[0, 1, 2, 3, 4].map(tick => {
                const value = ceiling * tick / 4;
                return <g key={tick}><line x1={65} x2={791} y1={y(value)} y2={y(value)} stroke="#e2e8f0" /><text x={54} y={y(value) + 4} textAnchor="end" fontSize={11} fill="#64748b">{number(value)}%</text></g>;
              })}
              <line x1={65} x2={791} y1={y(100)} y2={y(100)} stroke="#64748b" strokeDasharray="5 5" />
              <text x={790} y={y(100) - 8} textAnchor="end" fontSize={11} fill="#475569">目標 100%</text>
              {Array.from({ length: 12 }, (_, index) => <text key={index} x={x(index)} y={310} textAnchor="middle" fontSize={12} fill="#475569">{index + 1}月</text>)}
              {visible.map(company => <g key={company.name}>
                <polyline fill="none" stroke={company.color} strokeWidth={2.5} points={company.rates.flatMap((rate, index) => rate === null ? [] : [`${x(index)},${y(rate)}`]).join(" ")} />
                {company.rates.map((rate, index) => rate === null ? null : <circle key={index} cx={x(index)} cy={y(rate)} r={4} fill={company.color} />)}
              </g>)}
              {Array.from({ length: 12 }, (_, index) => (year === currentYear && index >= currentMonth) ? null : <rect
                key={index} x={x(index) - 25} y={38} width={50} height={250} fill="transparent"
                stroke={detailMonth === index ? "#94a3b8" : "none"} strokeDasharray="3 3"
                tabIndex={0} role="button" aria-label={`${index + 1}月の詳細`} aria-pressed={detailMonth === index}
                onMouseEnter={() => setSelectedMonth(index)} onFocus={() => setSelectedMonth(index)} onClick={() => setSelectedMonth(index)}
                onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedMonth(index); } }} style={{ cursor: "pointer" }} />)}
            </svg>
          </div>
          <p style={{ color: "#64748b", fontSize: 12 }}>グラフの月を押すと詳細を表示します。当月は途中経過、未来の月は空欄です。過去月も現在の所属人数・所属会社で計算します。</p>
          <h3 style={{ fontSize: 15 }}>{year}年{detailMonth + 1}月の内訳</h3>
          <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>{["所属会社", "所属人数", "人工", "目標人工", "進捗率"].map(label => <th key={label} style={cell}>{label}</th>)}</tr></thead>
            <tbody>{visible.map(company => <tr key={company.name}>
              <td style={{ ...cell, textAlign: "left", color: company.color, fontWeight: 700 }}>{company.name}</td>
              <td style={cell}>{company.headcount}人</td><td style={cell}>{number(company.labor[detailMonth])}</td>
              <td style={cell}>{company.headcount ? number(company.headcount * 23) : "—"}</td>
              <td style={{ ...cell, fontWeight: 800 }}>{company.rates[detailMonth] === null ? "—" : `${company.rates[detailMonth]!.toFixed(1)}%`}</td>
            </tr>)}</tbody>
          </table></div>
          {visible.some(company => !company.headcount) && <p style={{ color: "#64748b", fontSize: 12 }}>所属人数が確認できない会社は、進捗率を算出していません。</p>}
        </>}
      </>}
    </section>
  );
}
