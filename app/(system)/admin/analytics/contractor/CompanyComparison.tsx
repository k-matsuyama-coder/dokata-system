"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/fetchAllRows";
import { prepare, summarize, shiftMonth, difference, groups, labels, colors, number, type Employee, type Entry, type Assignment } from "./companyComparisonMath";

type Report = { report_date: string; site_name: string | null; contractor_name: string | null; shift_type: string | null };
type Raw = { employee_id: string | null; employee_name: string; labor: number | null; daily_reports: Report | Report[] | null };
const cell = { padding: 10, borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" as const, textAlign: "right" as const };
const button = { padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", cursor: "pointer" };
const signed = (n: number) => `${n>0?"+":""}${number(n)}`;

export default function CompanyComparison({ organizationId, employees, month, onMonthChange, refreshToken }: {
  organizationId: string; employees: Employee[]; month: string; onMonthChange: (value: string) => void; refreshToken: number;
}) {
  const year=Number(month.slice(0,4));
  const [company,setCompany]=useState("");
  const [retry,setRetry]=useState(0);
  const [data,setData]=useState<{key:string;entries:Entry[];assignments:Assignment[]}|null>(null);
  const [error,setError]=useState<{key:string;message:string}|null>(null);
  const key=`${organizationId}:${year}:${refreshToken}:${retry}`;
  useEffect(()=>{
    let active=true;
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),60000);
    setData(null);setError(null);
    void (async()=>{
      try{
        const [members,sites]=await Promise.all([
          fetchAllRows((from,to)=>supabase.from("report_members")
            .select("employee_id, employee_name, labor, daily_reports!inner(report_date, site_name, contractor_name, shift_type)")
            .eq("organization_id",organizationId)
            .gte("daily_reports.report_date",`${year-1}-01-01`).lt("daily_reports.report_date",`${year+1}-01-01`)
            .order("id",{ascending:true}).range(from,to).abortSignal(controller.signal)),
          fetchAllRows((from,to)=>supabase.from("assignments")
            .select("site_name, contractor_name, shift_type, group_key, start_date, end_date")
            .eq("organization_id",organizationId).order("id",{ascending:true}).range(from,to).abortSignal(controller.signal)),
        ]);
        if(members.error)throw new Error(members.error.message);
        if(sites.error)throw new Error(sites.error.message);
        if(controller.signal.aborted)throw new Error("取得がタイムアウトしました。");
        const entries=((members.data??[]) as unknown as Raw[]).map(r=>{
          const report=Array.isArray(r.daily_reports)?r.daily_reports[0]:r.daily_reports;
          if(!report || !/^\d{4}-\d{2}-\d{2}$/.test(report.report_date))throw new Error("日報の日付を取得できませんでした。");
          const labor=Number(r.labor??0);
          if(!Number.isFinite(labor)||labor<0)throw new Error("日報の人工を確認してください。");
          return {employee_id:r.employee_id,employee_name:r.employee_name,labor,date:report.report_date,site:report.site_name,contractor:report.contractor_name,shift:report.shift_type};
        });
        if(active)setData({key,entries,assignments:sites.data??[]});
      }catch(cause){if(active)setError({key,message:controller.signal.aborted?"取得に時間がかかっています。再取得してください。":cause instanceof Error?cause.message:"取得に失敗しました。"});}
      finally{clearTimeout(timer);}
    })();
    return ()=>{active=false;clearTimeout(timer);controller.abort();};
  },[organizationId,year,key]);
  const current=data?.key===key?data:null;
  const prepared=useMemo(()=>prepare(current?.entries??[],employees,current?.assignments??[]),[current,employees]);
  const selectedCompany=prepared.companies.includes(company)?company:"";
  const filtered=useMemo(()=>selectedCompany?prepared.rows.filter(r=>r.company===selectedCompany):prepared.rows,[prepared,selectedCompany]);
  const today=new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Tokyo"}).format(new Date());
  const thisMonth=today.slice(0,7);
  const cutoff=month===thisMonth?Number(today.slice(8,10)):31;
  const chosen=summarize(filtered,month,cutoff);
  const target=chosen.target;
  const previous=summarize(filtered,shiftMonth(month,-1),cutoff);
  const lastYear=summarize(filtered,shiftMonth(month,-12),cutoff);
  const annual=Array.from({length:12},(_,i)=>{const ym=`${year}-${String(i+1).padStart(2,"0")}`;return {ym,...summarize(filtered,ym),previous:summarize(filtered,shiftMonth(ym,-12)),future:ym>thisMonth};});
  const ceiling=Math.max(100,Math.ceil(Math.max(...annual.filter(r=>!r.future).map(r=>r.target?r.labor/r.target*100:0),100)/50)*50);
  const rate=(labor:number, monthlyTarget:number)=>monthlyTarget?`${number(labor/monthlyTarget*100)}%`:"—";
  const diffText=(now:number,before:number)=>{const d=difference(now,before);return `${signed(d.amount)}人工（${d.percent===null?"比較元0人工":`${signed(d.percent)}%`}）`;};
  return <section style={{border:"1px solid #ddd",borderRadius:12,padding:16,background:"#fff",marginTop:20,minWidth:0}}>
    <h2 style={{marginTop:0}}>年間目標達成率・工事別稼働割合</h2>
    <div style={{display:"flex",flexWrap:"wrap",gap:10,alignItems:"center"}}>
      <label>所属会社 <select value={selectedCompany} onChange={e=>setCompany(e.target.value)} style={{...button,maxWidth:"100%"}}><option value="">全所属会社</option>{prepared.companies.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
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
