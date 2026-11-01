export type Employee = { id?: string; name: string; company_name: string | null };
export type Entry = { employee_id: string | null; employee_name: string; labor: number; date: string; site: string | null; contractor: string | null; shift: string | null };
export type Assignment = { site_name: string | null; contractor_name: string | null; shift_type: string | null; group_key: string | null; start_date: string | null; end_date: string | null };
export const groups = ["group1", "group2", "group3", "other", "unknown"] as const;
export type Group = typeof groups[number];
export const labels: Record<Group, string> = { group1: "第一工事", group2: "第二工事", group3: "第三工事", other: "その他工事", unknown: "未分類" };
export const colors: Record<Group, string> = { group1: "#2563eb", group2: "#059669", group3: "#d97706", other: "#7c3aed", unknown: "#94a3b8" };
export const number = (n: number) => n.toLocaleString("ja-JP", { maximumFractionDigits: 1 });
export function shiftMonth(ym: string, offset: number) {
  const [year, month] = ym.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 + offset, 1)).toISOString().slice(0, 7);
}
export function lastDay(ym: string) { const [y,m]=ym.split("-").map(Number); return new Date(Date.UTC(y,m,0)).getUTCDate(); }
export function difference(now: number, before: number) {
  return { amount: now - before, percent: before === 0 ? null : (now - before) / before * 100 };
}
// Resolve older name-only reports to the same person when there is one known ID.
export function createPersonKey(employees: Employee[], entries: { employee_id: string | null; employee_name: string }[]) {
  const idsByName = new Map<string, Set<string>>();
  const add = (name: string, id: string | null | undefined) => {
    if (!id) return;
    const ids = idsByName.get(name) ?? new Set<string>();
    ids.add(id);
    idsByName.set(name, ids);
  };
  employees.forEach(e => add(e.name, e.id));
  entries.forEach(e => add(e.employee_name, e.employee_id));
  return (entry: { employee_id: string | null; employee_name: string }) => {
    if (entry.employee_id) return `id:${entry.employee_id}`;
    const ids = idsByName.get(entry.employee_name);
    return ids?.size === 1 ? `id:${[...ids][0]}` : `name:${entry.employee_name}`;
  };
}
const assignmentKey = (site: string | null, contractor: string | null, shift: string | null) => JSON.stringify([site,contractor,shift ?? "day"]);
export function prepare(entries: Entry[], employees: Employee[], assignments: Assignment[]) {
  const byId = new Map(employees.filter(e=>e.id).map(e=>[e.id!,e.company_name || "未設定"]));
  const byName = new Map<string,Set<string>>();
  const headcounts = new Map<string,number>();
  employees.forEach(e=>{ const company=e.company_name || "未設定";headcounts.set(company,(headcounts.get(company)??0)+1); const list=byName.get(e.name)??new Set();list.add(company);byName.set(e.name,list); });
  const sites = new Map<string,Assignment[]>();
  assignments.forEach(a=>{const key=assignmentKey(a.site_name,a.contractor_name,a.shift_type); const list=sites.get(key)??[];list.push(a);sites.set(key,list);});
  const personKey = createPersonKey(employees, entries);
  const rows=entries.map(e=>{
    const names=byName.get(e.employee_name);
    const company=(e.employee_id?byId.get(e.employee_id):undefined) ?? (names?.size===1?[...names][0]:"未設定");
    const candidates=(sites.get(assignmentKey(e.site,e.contractor,e.shift))??[]).filter(a=>(!a.start_date || a.start_date<=e.date)&&(!a.end_date || a.end_date>=e.date));
    const keys=new Set(candidates.map(a=>a.group_key));
    let group: Group="unknown";
    if(keys.size===1){ const key=[...keys][0]; if(key==="group1"||key==="group2"||key==="group3")group=key;else if(key)group="other"; }
    return {...e,company,group,personKey:personKey(e)};
  });
  return {rows,headcounts,companies:[...new Set([...headcounts.keys(),...rows.map(r=>r.company)])].sort((a,b)=>a.localeCompare(b,"ja"))};
}
export function summarize(rows: ReturnType<typeof prepare>["rows"], ym: string, day = 31) {
  const totals: Record<Group,number>={group1:0,group2:0,group3:0,other:0,unknown:0};
  let labor=0;
  const people = new Set<string>();
  rows.forEach(r=>{if(r.date.slice(0,7)===ym && Number(r.date.slice(8,10))<=Math.min(day,lastDay(ym))){labor+=r.labor;totals[r.group]+=r.labor;if(r.labor>0)people.add(r.personKey);}});
  return {labor,groups:totals,people:people.size,target:people.size*23};
}
