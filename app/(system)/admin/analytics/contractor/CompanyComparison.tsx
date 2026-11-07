"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  shiftMonth,
  difference,
  groups,
  labels,
  colors,
  number,
  type Group,
} from "./companyComparisonMath";

type Summary = {
  month: string;
  company: string | null;
  partial: boolean;
  labor: number;
  people: number;
  groups: Record<Group, number>;
};

type AnnualData = {
  year: number;
  cutoff: number;
  invalidLabor: boolean;
  companies: string[];
  summaries: Summary[];
};

const cell = {
  padding: 10,
  borderBottom: "1px solid #e2e8f0",
  whiteSpace: "nowrap" as const,
  textAlign: "right" as const,
};

const button = {
  padding: "8px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#fff",
  cursor: "pointer",
};

const signed = (n: number) => `${n > 0 ? "+" : ""}${number(n)}`;

export default function CompanyComparison({
  organizationId,
  month,
  onMonthChange,
  refreshToken,
}: {
  organizationId: string;
  month: string;
  onMonthChange: (value: string) => void;
  refreshToken: number;
}) {
  const year = Number(month.slice(0, 4));
  const [company, setCompany] = useState("");
  const [retry, setRetry] = useState(0);

  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
  }).format(new Date());

  const thisMonth = today.slice(0, 7);
  const comparisonDay = Number(today.slice(8, 10));

  const [data, setData] = useState<{
    key: string;
    result: AnnualData;
  } | null>(null);

  const [error, setError] = useState<{
    key: string;
    message: string;
  } | null>(null);

  const key =
    `${organizationId}:${year}:${comparisonDay}:${refreshToken}:${retry}`;

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);

    setData(null);
    setError(null);

    void (async () => {
      try {
        const { data: result, error: queryError } = await supabase
          .rpc("company_annual_summary_v1", {
            p_organization_id: organizationId,
            p_year: year,
            p_cutoff: comparisonDay,
          })
          .abortSignal(controller.signal);

        if (queryError) throw new Error(queryError.message);

        if (controller.signal.aborted) {
          throw new Error("取得がタイムアウトしました。");
        }

        const value = result as AnnualData | null;

        if (
          !value ||
          value.year !== year ||
          value.cutoff !== comparisonDay ||
          value.invalidLabor !== false ||
          !Array.isArray(value.companies) ||
          !value.companies.every((c) => typeof c === "string") ||
          !Array.isArray(value.summaries)
        ) {
          throw new Error("年間集計の取得結果を確認できませんでした。");
        }

        for (const row of value.summaries) {
          if (
            !row ||
            typeof row.month !== "string" ||
            !/^\d{4}-\d{2}$/.test(row.month) ||
            !(row.company === null || typeof row.company === "string") ||
            typeof row.partial !== "boolean" ||
            !Number.isFinite(row.labor) ||
            row.labor < 0 ||
            !Number.isInteger(row.people) ||
            row.people < 0 ||
            !row.groups ||
            !groups.every(
              (g) =>
                Number.isFinite(row.groups[g]) &&
                row.groups[g] >= 0
            )
          ) {
            throw new Error("年間集計に不正な値が含まれています。");
          }
        }

        if (active) setData({ key, result: value });
      } catch (cause) {
        if (active) {
          setError({
            key,
            message: controller.signal.aborted
              ? "取得に時間がかかっています。再取得してください。"
              : cause instanceof Error
                ? cause.message
                : "取得に失敗しました。",
          });
        }
      } finally {
        clearTimeout(timer);
      }
    })();

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [organizationId, year, key, comparisonDay]);

  const current = data?.key === key ? data : null;

  const companies = useMemo(
    () =>
      (current?.result.companies ?? [])
        .slice()
        .sort((a, b) => a.localeCompare(b, "ja")),
    [current]
  );

  const selectedCompany = companies.includes(company) ? company : "";

  const lookup = useMemo(
    () =>
      new Map(
        (current?.result.summaries ?? []).map((row) => [
          JSON.stringify([row.month, row.company, row.partial]),
          row,
        ])
      ),
    [current]
  );

  const getSummary = (ym: string, partial = false) => {
    const row = lookup.get(
      JSON.stringify([ym, selectedCompany || null, partial])
    );

    return {
      labor: row?.labor ?? 0,
      people: row?.people ?? 0,
      target: (row?.people ?? 0) * 23,
      groups: row?.groups ?? {
        group1: 0,
        group2: 0,
        group3: 0,
        other: 0,
        unknown: 0,
      },
    };
  };

  const cutoff = month === thisMonth ? comparisonDay : 31;
  const chosen = getSummary(month, month === thisMonth);
  const target = chosen.target;

  const previous = getSummary(
    shiftMonth(month, -1),
    month === thisMonth
  );

  const lastYear = getSummary(
    shiftMonth(month, -12),
    month === thisMonth
  );

  const annual = Array.from({ length: 12 }, (_, i) => {
    const ym = `${year}-${String(i + 1).padStart(2, "0")}`;

    return {
      ym,
      ...getSummary(ym),
      previous: getSummary(shiftMonth(ym, -12)),
      future: ym > thisMonth,
    };
  });
  const ceiling=Math.max(100,Math.ceil(Math.max(...annual.filter(r=>!r.future).map(r=>r.target?r.labor/r.target*100:0),100)/50)*50);
  const rate=(labor:number, monthlyTarget:number)=>monthlyTarget?`${number(labor/monthlyTarget*100)}%`:"—";
  const diffText=(now:number,before:number)=>{const d=difference(now,before);return `${signed(d.amount)}人工（${d.percent===null?"比較元0人工":`${signed(d.percent)}%`}）`;};
  return <section style={{border:"1px solid #ddd",borderRadius:12,padding:16,background:"#fff",marginTop:20,minWidth:0}}>
    <h2 style={{marginTop:0}}>年間目標達成率・工事別稼働割合</h2>
    <div style={{display:"flex",flexWrap:"wrap",gap:10,alignItems:"center"}}>
      <label>所属会社 <select value={selectedCompany} onChange={e=>setCompany(e.target.value)} style={{...button,maxWidth:"100%"}}><option value="">全所属会社</option>{companies.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
      <button type="button" style={button} onClick={()=>onMonthChange(`${year-1}-${month.slice(5)}`)}>◀ 前年</button><strong>{year}年</strong><button type="button" style={button} onClick={()=>onMonthChange(`${year+1}-${month.slice(5)}`)}>翌年 ▶</button>
      <button type="button" style={button} onClick={()=>setRetry(v=>v+1)}>再取得</button>
    </div>
    <p style={{fontSize:13,color:"#475569"}}>{month}の月目標：実稼働 {chosen.people}人 × 23 ＝ {number(target)}人工。各月で人工が0より大きい日報のある人だけを数え、同じ人の昼夜・複数現場は1人にまとめます。所属会社・番割区分は現在の情報を使います。</p>
    {error?.key===key?<p role="alert" style={{color:"#b91c1c"}}>{error.message}</p>:!current?<p role="status">年間・比較データを読み込み中…</p>:<>
      {!target&&<p>選択月の実稼働人数が0人のため目標達成率は算出できません。工事別の実績は下の表で確認できます。</p>}
      <div style={{display:"flex",flexWrap:"wrap",gap:14,fontSize:13}}>{groups.map(g=><span key={g}><span style={{color:colors[g]}}>■</span> {labels[g]}</span>)}</div>
      <p style={{fontSize:12,color:"#64748b"}}>棒の高さ＝目標達成率、色＝工事別の人工。月を押すと下の比較表と対象月が切り替わります。今月は途中実績、将来月は「—」です。</p>
      <div style={{overflowX:"auto"}}>
        <svg viewBox="0 0 880 320" role="group" aria-label={`${year}年の工事別目標達成率。月を選択できます。`} style={{display:"block",width:"100%",minWidth:650}}>
          {[0,ceiling/2,ceiling].map(v=><g key={v}><line x1={58} x2={864} y1={270-v/ceiling*220} y2={270-v/ceiling*220} stroke="#e2e8f0"/><text x={50} y={274-v/ceiling*220} fontSize={11} textAnchor="end" fill="#64748b">{number(v)}%</text></g>)}
          {annual.map((r,i)=>{const x=70+i*66;let bottom=270;return <g key={r.ym} role="button" tabIndex={0} aria-label={`${r.ym}、合計${number(r.labor)}人工、達成率${r.future?"未到来":rate(r.labor,r.target)}`} onClick={()=>onMonthChange(r.ym)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onMonthChange(r.ym);}}} style={{cursor:"pointer"}}>
            <rect x={x-5} y={25} width={54} height={280} rx={6} fill={r.ym===month?"#eff6ff":"transparent"}/>
            {!r.future&&r.target>0&&groups.map(g=>{const height=r.groups[g]/r.target*100/ceiling*220;bottom-=height;return <rect key={g} x={x} y={bottom} width={44} height={height} fill={colors[g]}><title>{`${labels[g]}：${number(r.groups[g])}人工（${number(r.labor?r.groups[g]/r.labor*100:0)}%）`}</title></rect>;})}
            <text x={x+22} y={r.future||!r.target?260:Math.max(18,270-r.labor/r.target*100/ceiling*220-8)} textAnchor="middle" fontSize={11} fontWeight={700}>{r.future?"—":rate(r.labor,r.target)}</text>
            <text x={x+22} y={294} textAnchor="middle" fontSize={13}>{i+1}月</text>
          </g>;})}
          <line x1={58} x2={864} y1={270-100/ceiling*220} y2={270-100/ceiling*220} stroke="#dc2626" strokeDasharray="5 4" pointerEvents="none"/>
          <text x={862} y={264-100/ceiling*220} textAnchor="end" fontSize={11} fill="#b91c1c" pointerEvents="none">目標100%</text>
        </svg>
      </div>
      <h3>{month} の比較・工事別内訳</h3>
      <p style={{fontSize:13}}>{month===thisMonth?`今月・前月・前年同月とも各月1〜${cutoff}日で比較（月の日数が少ない場合は月末まで）。目標は月全体です。`:"前月・前年同月とも月全体で比較します。"}</p>
      {month>thisMonth?<p>将来月の比較は表示しません。</p>:<>
      <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {[
            ["目標対象人数", `${chosen.people}人`],
            ["実績／月目標", `${number(chosen.labor)} ／ ${number(target)}人工`],
            ["目標達成率", rate(chosen.labor, chosen.target)],
            ["前月比", diffText(chosen.labor, previous.labor)],
            ["前年同月比", diffText(chosen.labor, lastYear.labor)],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                padding: 14,
                background: "#f8fafc",
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {label}
              </div>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{['工事区分','人工','稼働割合','前月人工','前年同月人工'].map(t=><th key={t} style={cell}>{t}</th>)}</tr></thead><tbody>{groups.map(g=><tr key={g}><th style={{...cell,textAlign:"left"}}><span style={{color:colors[g]}}>■</span> {labels[g]}</th><td style={cell}>{number(chosen.groups[g])}</td><td style={cell}>{chosen.labor?`${number(chosen.groups[g]/chosen.labor*100)}%`:"—"}</td><td style={cell}>{number(previous.groups[g])}</td><td style={cell}>{number(lastYear.groups[g])}</td></tr>)}<tr><th style={cell}>合計</th><td style={cell}>{number(chosen.labor)}</td><td style={cell}>{chosen.labor?"100%":"—"}</td><td style={cell}>{number(previous.labor)}</td><td style={cell}>{number(lastYear.labor)}</td></tr></tbody></table></div>
      </>}
      <details style={{marginTop:18}}><summary style={{cursor:"pointer"}}>年間比較表（人工・目標達成率・前年同月）</summary><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{['月','実稼働人数','実績人工','月目標','達成率','前年人数','前年人工','前年目標','前年達成率','前年差'].map(t=><th key={t} style={cell}>{t}</th>)}</tr></thead><tbody>{annual.map(r=><tr key={r.ym}><th style={cell}>{r.ym}{r.ym===thisMonth?"（途中）":""}</th><td style={cell}>{r.future?"—":`${r.people}人`}</td><td style={cell}>{r.future?"—":number(r.labor)}</td><td style={cell}>{r.future?"—":number(r.target)}</td><td style={cell}>{r.future?"—":rate(r.labor,r.target)}</td><td style={cell}>{r.previous.people}人</td><td style={cell}>{number(r.previous.labor)}</td><td style={cell}>{number(r.previous.target)}</td><td style={cell}>{rate(r.previous.labor,r.previous.target)}</td><td style={cell}>{r.future||r.ym===thisMonth?"—":`${signed(r.labor-r.previous.labor)}人工`}</td></tr>)}</tbody></table></div><p style={{fontSize:12}}>年間表は各月全体の実績です。前年の達成率も前年同月の実稼働人数から計算します。今月の前年同日までの比較は上の比較欄を参照してください。</p></details>
      <p style={{fontSize:12,color:"#64748b"}}>工事区分は現場名・元請・昼夜・工期を番割と照合します。特定できない実績は「未分類」、第四・第五などは「その他工事」です。割合は未分類を含む合計人工を分母にします。未提出の日報は実績に含まれません。</p>
    </>}
  </section>;
}
