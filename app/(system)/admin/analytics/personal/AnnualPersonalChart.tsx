"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/fetchAllRows";

type MonthTotal = { day: number; night: number };
type Report = { report_date: string; shift_type: string | null };
type Entry = { labor: number | null; daily_reports: Report | Report[] | null };
const number = (n: number) => n.toLocaleString("ja-JP", { maximumFractionDigits: 2 });

export function aggregateYear(entries: Entry[], year: number): MonthTotal[] {
  const totals = Array.from({ length: 12 }, () => ({ day: 0, night: 0 }));
  for (const entry of entries) {
    const report = Array.isArray(entry.daily_reports) ? entry.daily_reports[0] : entry.daily_reports;
    if (!report || !/^\d{4}-\d{2}-\d{2}$/.test(report.report_date)) throw new Error("日報の日付を取得できませんでした。");
    const month = Number(report.report_date.slice(5, 7)) - 1;
    if (Number(report.report_date.slice(0, 4)) !== year || month < 0 || month > 11) continue;
    const labor = Number(entry.labor ?? 0);
    if (!Number.isFinite(labor)) throw new Error("人工の値を確認してください。");
    totals[month][report.shift_type === "night" ? "night" : "day"] += labor;
  }
  return totals;
}

export default function AnnualPersonalChart({ employeeName, month, onSelectMonth }: {
  employeeName: string;
  month: string;
  onSelectMonth: (month: string) => void;
}) {
  const year = Number(month.slice(0, 4));
  const key = `${employeeName}:${year}`;
  const [result, setResult] = useState<{ key: string; totals: MonthTotal[] } | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!employeeName || !Number.isInteger(year)) return;
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);
    setResult(null);
    setError(null);
    void (async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        const token = data.session?.access_token;
        if (!token) throw new Error("ログイン情報を確認してください。");
        const response = await fetch("/api/current-organization", {
          headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
        });
        const organization = await response.json();
        if (!response.ok || !organization.organizationId) throw new Error("会社情報を取得できませんでした。");
        const { data: rows, error: queryError } = await fetchAllRows((from, to) => supabase
          .from("report_members")
          .select("labor, daily_reports!inner(report_date, shift_type)")
          .eq("organization_id", organization.organizationId)
          .eq("employee_name", employeeName)
          .gte("daily_reports.report_date", `${year}-01-01`)
          .lt("daily_reports.report_date", `${year + 1}-01-01`)
          .order("id", { ascending: true })
          .range(from, to).abortSignal(controller.signal));
        if (queryError) throw queryError;
        if (controller.signal.aborted) throw new Error("取得がタイムアウトしました。");
        const totals = aggregateYear((rows ?? []) as unknown as Entry[], year);
        if (active) setResult({ key, totals });
      } catch (cause) {
        if (active) setError({ key, message: controller.signal.aborted ? "取得がタイムアウトしました。再取得してください。" : cause instanceof Error ? cause.message : "年間データを取得できませんでした。" });
      } finally { clearTimeout(timer); }
    })();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [employeeName, year, key, retry]);

  if (!employeeName) return null;
  const totals = result?.key === key ? result.totals : null;
  const failure = error?.key === key ? error.message : null;
  const top = totals ? Math.max(5, Math.ceil(Math.max(...totals.map(t => t.day + t.night)) / 5) * 5) : 5;
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());
  const changeYear = (offset: number) => onSelectMonth(`${year + offset}-${month.slice(5, 7)}`);
  return (
    <section style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 12, padding: 16, marginBottom: 20, minWidth: 0 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0 }}>年間人工推移</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button type="button" onClick={() => changeYear(-1)} aria-label="前年" style={{ padding: 8 }}>◀</button>
          <strong>{year}年</strong>
          <button type="button" onClick={() => changeYear(1)} aria-label="翌年" style={{ padding: 8 }}>▶</button>
          <button type="button" onClick={() => setRetry(r => r + 1)} style={{ padding: 8 }}>再取得</button>
        </div>
      </div>
      <p style={{ fontSize: 13, color: "#555" }}>月を押すと、その月の集計・明細に切り替わります。</p>
      <div style={{ display: "flex", gap: 16, fontSize: 13, marginBottom: 12 }}>
        <span style={{ color: "#2563eb" }}>■ 昼</span><span style={{ color: "#7c3aed" }}>■ 夜</span>
        {totals && <strong>年間合計 {number(totals.reduce((s, t) => s + t.day + t.night, 0))}人工</strong>}
      </div>
      {failure ? <p role="alert" style={{ color: "#b91c1c" }}>{failure}</p> : !totals ? <p role="status">年間データを読み込み中...</p> : (
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 600, display: "flex", gap: 6 }}>
            <div aria-hidden="true" style={{ width: 36, flexShrink: 0, height: 200, marginTop: 22, display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: 11, color: "#666" }}>
              <span>{top}人工</span><span>{number(top / 2)}</span><span>0</span>
            </div>
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 5 }}>
              {totals.map((total, index) => {
                const value = `${year}-${String(index + 1).padStart(2, "0")}`;
                const future = value > today.slice(0, 7);
                const sum = total.day + total.night;
                const label = `${index + 1}月：昼 ${number(total.day)}人工、夜 ${number(total.night)}人工、合計 ${number(sum)}人工`;
                return <button key={value} type="button" aria-pressed={value === month} aria-label={label} title={label} onClick={() => onSelectMonth(value)} style={{ minWidth: 0, padding: 0, border: 0, cursor: "pointer", background: value === month ? "#eff6ff" : "transparent", borderRadius: 6 }}>
                  <div style={{ height: 22, fontSize: 12, fontWeight: 700 }}>{future && sum === 0 ? "—" : number(sum)}</div>
                  <div style={{ height: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end", margin: "0 5px", borderBottom: "1px solid #cbd5e1", backgroundImage: "linear-gradient(to top, transparent calc(50% - 1px), #e5e7eb 50%, transparent calc(50% + 1px))" }}>
                    <div style={{ height: `${total.night / top * 100}%`, background: "#7c3aed" }} />
                    <div style={{ height: `${total.day / top * 100}%`, background: "#2563eb" }} />
                  </div>
                  <div style={{ padding: "10px 0", fontSize: 12, fontWeight: value === month ? 800 : 400 }}>{index + 1}月</div>
                </button>;
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
