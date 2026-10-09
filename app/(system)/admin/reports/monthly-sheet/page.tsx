"use client";

import { useEffect, useMemo, useState } from "react";
import BackButton from "@/app/components/BackButton";
import { hasRole } from "@/app/types/auth";
import { supabase } from "@/lib/supabase";

type Report = {
  id: string;
  report_date: string;
  contractor_name: string | null;
  site_name: string | null;
  shift_type: string | null;
  worker_count: number | null;
  report_members: {
    employee_id: string | null;
    labor: number | null;
    overtime: number | null;
    is_driver: boolean | null;
  }[] | null;
  vehicle_count: number | null;
  parking_main: number | null;
  parking_secondary: number | null;
  parking_subcontract: number | null;
  fuel_gasoline: number | null;
  fuel_diesel: number | null;
  note: string | null;
};

type CompanyCost = {
  contractor_name: string;
  site_name: string;
  shift_type: string;
  work_date: string;
  parking: number;
  gasoline: number;
  diesel: number;
};

type Assignment = {
  site_name: string | null;
  contractor_name: string | null;
  manager_name: string | null;
  shift_type: string | null;
};

export type DailyRow = {
  date: string;
  workerCount: number;
  overtimeHours: number;
  vehicleCount: number;
  parking: number;
  gasoline: number;
  diesel: number;
  notes: string[];
};

export type Sheet = {
  ownCompanyName?: string;
  key: string;
  siteName: string;
  contractorName: string;
  managerName: string;
  shiftType: string;
  rows: DailyRow[];
};

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

function getCurrentMonth() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
  })
    .format(new Date())
    .slice(0, 7);
}

function normalize(value: string | null | undefined) {
  return (value ?? "").trim();
}

function getMonthRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);

  const lastDay = new Date(year, monthNumber, 0).getDate();

  return {
    year,
    monthNumber,
    firstDate: `${month}-01`,
    lastDate: `${month}-${String(lastDay).padStart(2, "0")}`,
    lastDay,
  };
}

function getCurrentOrganizationId(token: string) {
  return fetch("/api/current-organization", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then(async (response) => {
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error ?? "会社情報の取得に失敗しました");
    }

    return result.organizationId as string | null;
  });
}

export default function MonthlyInvoiceSheetPage() {
  const [month, setMonth] = useState(getCurrentMonth);
  const [reports, setReports] = useState<Report[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedOffice, setSelectedOffice] = useState("all");
  const [exportingExcel, setExportingExcel] = useState(false);
  const [aggregationScope, setAggregationScope] =
  useState<"all" | "own">("all");
const [ownCompanyName, setOwnCompanyName] = useState("");
const [ownEmployeeIds, setOwnEmployeeIds] = useState<string[]>([]);
const [currentOrganizationId, setCurrentOrganizationId] =
useState<string | null>(null);
const [companyCosts, setCompanyCosts] = useState<CompanyCost[]>([]);
const [costDrafts, setCostDrafts] = useState<
Record<string, {
  parking: string;
  gasoline: string;
  diesel: string;
}>
>({});
const [savingCostKey, setSavingCostKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const user = session?.user;
        const token = session?.access_token;

        if (!user || !token) {
          window.location.href = "/login";
          return;
        }

        const organizationId = await getCurrentOrganizationId(token);

        if (!organizationId) {
          throw new Error("会社情報が取得できません");
        }

        const { data: employee, error: employeeError } = await supabase
          .from("employees")
          .select("role, company_name")
          .eq("organization_id", organizationId)
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (
          employeeError ||
          !employee ||
          !hasRole(employee.role, "admin")
        ) {
          window.location.href = "/home";
          return;
        }

        const companyName = normalize(employee.company_name);
        const companyEmployeeIds: string[] = [];

        if (companyName) {
          const pageSize = 1000;

          for (let from = 0; ; from += pageSize) {
            const { data: companyEmployees, error: companyError } =
              await supabase
                .from("employees")
                .select("id")
                .eq("organization_id", organizationId)
                .eq("company_name", employee.company_name)
                .order("id", { ascending: true })
                .range(from, from + pageSize - 1);

            if (companyError) {
              throw companyError;
            }

            const employeesPage = companyEmployees ?? [];

            companyEmployeeIds.push(
              ...employeesPage.map((item) => item.id)
            );

            if (employeesPage.length < pageSize) {
              break;
            }
          }
        }

        const { firstDate, lastDate } = getMonthRange(month);

        const loadedCompanyCosts: CompanyCost[] = [];

        if (companyName) {
          const pageSize = 1000;

          for (let from = 0; ; from += pageSize) {
            const { data: costData, error: costError } = await supabase
              .from("monthly_invoice_company_costs")
              .select(
                "contractor_name, site_name, shift_type, work_date, parking, gasoline, diesel"
              )
              .eq("organization_id", organizationId)
              .eq("company_name", companyName)
              .gte("work_date", firstDate)
              .lte("work_date", lastDate)
              .order("id", { ascending: true })
              .range(from, from + pageSize - 1);

            if (costError) {
              throw costError;
            }

            const costPage = (costData ?? []) as CompanyCost[];
            loadedCompanyCosts.push(...costPage);

            if (costPage.length < pageSize) {
              break;
            }
          }
        }

        const [reportResult, assignmentResult] = await Promise.all([
          supabase
            .from("daily_reports")
            .select(`
              id,
              report_date,
              contractor_name,
              site_name,
              shift_type,
              worker_count,
              vehicle_count,
              parking_main,
              parking_secondary,
              parking_subcontract,
              fuel_gasoline,
              fuel_diesel,
              note,
              report_members (
                employee_id,
                labor,
                overtime,
                is_driver
              )
            `)
            .eq("organization_id", organizationId)
            .gte("report_date", firstDate)
            .lte("report_date", lastDate)
            .order("report_date", { ascending: true }),

          supabase
            .from("assignments")
            .select(`
              site_name,
              contractor_name,
              manager_name,
              shift_type
            `)
            .eq("organization_id", organizationId),
        ]);

        if (reportResult.error) {
          throw reportResult.error;
        }

        if (assignmentResult.error) {
          throw assignmentResult.error;
        }

        if (!active) return;

        setCurrentOrganizationId(organizationId);
        setOwnCompanyName(companyName);
        setOwnEmployeeIds(companyEmployeeIds);
        setCompanyCosts(loadedCompanyCosts);
        setReports((reportResult.data ?? []) as Report[]);
        setAssignments((assignmentResult.data ?? []) as Assignment[]);
      } catch (error) {
        if (!active) return;

        console.error("請求用月次日報取得失敗:", error);
        setLoadError(
          error instanceof Error
            ? error.message
            : "データの取得に失敗しました"
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      active = false;
    };
  }, [month]);

  const sheets = useMemo<Sheet[]>(() => {
    const { lastDay } = getMonthRange(month);
    const sheetMap = new Map<string, Sheet>();

    const ownEmployeeIdSet = new Set(ownEmployeeIds);

    reports.forEach((report) => {
      const targetMembers = (report.report_members ?? []).filter(
        (member) =>
          aggregationScope === "all" ||
          (member.employee_id !== null &&
            ownEmployeeIdSet.has(member.employee_id))
      );

      // 自社社員が参加していない日報は集計対象外
      if (aggregationScope === "own" && targetMembers.length === 0) {
        return;
      }

      const siteName = normalize(report.site_name) || "現場名未設定";
      const contractorName =
        normalize(report.contractor_name) || "元請未設定";
      const shiftType = report.shift_type ?? "day";

      const key = `${contractorName}__${siteName}__${shiftType}`;

      if (!sheetMap.has(key)) {
        const assignment = assignments.find(
          (item) =>
            normalize(item.site_name) === normalize(report.site_name) &&
            normalize(item.contractor_name) ===
              normalize(report.contractor_name) &&
            (item.shift_type ?? "day") === shiftType
        );

        const rows = Array.from({ length: lastDay }, (_, index) => ({
          date: `${month}-${String(index + 1).padStart(2, "0")}`,
          workerCount: 0,
          overtimeHours: 0,
          vehicleCount: 0,
          parking: 0,
          gasoline: 0,
          diesel: 0,
          notes: [],
        }));

        sheetMap.set(key, {
          ownCompanyName:
            aggregationScope === "own" ? ownCompanyName : undefined,
          key,
          siteName,
          contractorName,
          managerName: normalize(assignment?.manager_name) || "-",
          shiftType,
          rows,
        });
      }

      const sheet = sheetMap.get(key);
      if (!sheet) return;

      const day = Number(report.report_date.slice(-2));
      const row = sheet.rows[day - 1];

      if (!row) return;

      row.workerCount +=
      aggregationScope === "own"
        ? targetMembers.reduce(
            (total, member) => total + Number(member.labor ?? 0),
            0
          )
        : Number(report.worker_count ?? 0);

    row.overtimeHours += targetMembers.reduce(
      (total, member) => total + Number(member.overtime ?? 0),
      0
    );
    row.vehicleCount +=
    aggregationScope === "own"
      ? targetMembers.filter((member) => member.is_driver === true).length
      : Number(report.vehicle_count ?? 0);

  // 日報の駐車場・燃料は「全体」の場合だけ集計
  if (aggregationScope === "all") {
              row.parking +=
                Number(report.parking_main ?? 0) +
                Number(report.parking_secondary ?? 0) +
                Number(report.parking_subcontract ?? 0);
              row.gasoline += Number(report.fuel_gasoline ?? 0);
              row.diesel += Number(report.fuel_diesel ?? 0);
            }

      const note = normalize(report.note);

      if (note && !row.notes.includes(note)) {
        row.notes.push(note);
      }
    });

        // 日報の集計後に、自社用の入力値を日付ごとに反映
        if (aggregationScope === "own") {
          companyCosts.forEach((cost) => {
            const sheet = Array.from(sheetMap.values()).find(
              (item) =>
                item.contractorName === cost.contractor_name &&
                item.siteName === cost.site_name &&
                item.shiftType === cost.shift_type
            );
    
            if (!sheet) return;
    
            const row = sheet.rows.find(
              (item) => item.date === cost.work_date
            );
    
            if (!row) return;
    
            row.parking = Number(cost.parking);
            row.gasoline = Number(cost.gasoline);
            row.diesel = Number(cost.diesel);
          });
        }

    return Array.from(sheetMap.values()).sort((a, b) => {
        const officeCompare = a.contractorName.localeCompare(
          b.contractorName,
          "ja"
        );
      
        if (officeCompare !== 0) {
          return officeCompare;
        }
      
        const siteCompare = a.siteName.localeCompare(b.siteName, "ja");
      
        if (siteCompare !== 0) {
          return siteCompare;
        }
      
        return a.shiftType.localeCompare(b.shiftType);
      });
    }, [
      reports,
      assignments,
      month,
      aggregationScope,
      ownEmployeeIds,
      ownCompanyName,
      companyCosts,
    ]);

  const offices = useMemo(() => {
    return Array.from(
      new Set(sheets.map((sheet) => sheet.contractorName))
    ).sort((a, b) => a.localeCompare(b, "ja"));
  }, [sheets]);
  
  const filteredSheets = useMemo(() => {
    if (selectedOffice === "all") {
      return sheets;
    }
  
    return sheets.filter(
      (sheet) => sheet.contractorName === selectedOffice
    );
  }, [sheets, selectedOffice]);

  const getCostKey = (sheet: Sheet, date: string) =>
  JSON.stringify([
    ownCompanyName,
    sheet.contractorName,
    sheet.siteName,
    sheet.shiftType,
    date,
  ]);

const saveCompanyCost = async (sheet: Sheet, row: DailyRow) => {
  if (
    aggregationScope !== "own" ||
    !currentOrganizationId ||
    !ownCompanyName ||
    savingCostKey
  ) {
    return;
  }

  const key = getCostKey(sheet, row.date);
  const draft = costDrafts[key];

  if (!draft) return;

  const values = [draft.parking, draft.gasoline, draft.diesel];

  const isValid = values.every((value) => {
    const text = value.trim();

    return (
      text === "" ||
      (/^\d+(\.\d{1,2})?$/.test(text) &&
        Number(text) <= 9999999999.99)
    );
  });

  if (!isValid) {
    alert("0以上の数値を、小数点以下2桁までで入力してください。");
    return;
  }

  const cost: CompanyCost = {
    contractor_name: sheet.contractorName,
    site_name: sheet.siteName,
    shift_type: sheet.shiftType,
    work_date: row.date,
    parking: Number(draft.parking.trim() || 0),
    gasoline: Number(draft.gasoline.trim() || 0),
    diesel: Number(draft.diesel.trim() || 0),
  };

  setSavingCostKey(key);

  try {
    const { data, error } = await supabase
      .from("monthly_invoice_company_costs")
      .upsert(
        {
          ...cost,
          organization_id: currentOrganizationId,
          company_name: ownCompanyName,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict:
            "organization_id,company_name,contractor_name,site_name,shift_type,work_date",
        }
      )
      .select(
        "contractor_name, site_name, shift_type, work_date, parking, gasoline, diesel"
      )
      .single();

    if (error) throw error;
    if (!data) throw new Error("保存結果を確認できませんでした。");

    const savedCost = data as CompanyCost;

    setCompanyCosts((current) => [
      ...current.filter(
        (item) =>
          !(
            item.contractor_name === cost.contractor_name &&
            item.site_name === cost.site_name &&
            item.shift_type === cost.shift_type &&
            item.work_date === cost.work_date
          )
      ),
      savedCost,
    ]);

    setCostDrafts((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  } catch (error) {
    alert(
      "保存に失敗しました: " +
        (error instanceof Error
          ? error.message
          : (error as { message?: string })?.message ??
            "もう一度お試しください。")
    );
  } finally {
    setSavingCostKey(null);
  }
};

  const { year, monthNumber } = getMonthRange(month);
  const handleExportExcel = async () => {
    if (loading || loadError || savingCostKey !== null) {
      alert("読み込み・保存が完了していることを確認してください。");
      return;
    }

    if (Object.keys(costDrafts).length > 0) {
      alert("未保存の入力があります。「この行を保存」を押してから出力してください。");
      return;
    }
    if (filteredSheets.length === 0) {
      alert("出力対象の現場がありません");
      return;
    }
  
    try {
      setExportingExcel(true);
  
      const { exportMonthlySheetsToExcel } = await import(
        "./monthly-sheet-excel"
      );
  
      await exportMonthlySheetsToExcel({
        month,
        sheets: filteredSheets,
      });
    } catch (error) {
      console.error("Excel出力失敗:", error);
  
      alert(
        error instanceof Error
          ? error.message
          : "Excel出力に失敗しました"
      );
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <div className="monthly-sheet-page">
      <div className="screen-toolbar">
        <BackButton />

        <div>
          <h1>請求用月次日報</h1>
          <p>
            {aggregationScope === "own"
                            ? `${ownCompanyName}所属の社員の人工・残業・運転手人数を集計します。車両欄には運転手人数を表示します。`
              : "全体の日報を現場別・月別に集計します。"}
          </p>
        </div>

        <div className="toolbar-actions">
        <select
            aria-label="集計対象"
            value={aggregationScope}
            disabled={loading || savingCostKey !== null}
            onChange={(event) => {
              setAggregationScope(
                event.target.value === "own" ? "own" : "all"
              );
              setSelectedOffice("all");
            }}
          >
            <option value="all">全体</option>
            <option value="own" disabled={!ownCompanyName}>
              {ownCompanyName
                ? `自社のみ（${ownCompanyName}）`
                : "自社のみ（所属会社未設定）"}
            </option>
          </select>
        <select
  value={selectedOffice}
  onChange={(event) => setSelectedOffice(event.target.value)}
>
  <option value="all">全営業所</option>

  {offices.map((office) => (
    <option key={office} value={office}>
      {office}
    </option>
  ))}
</select>
          <input
            type="month"
            value={month}
            disabled={loading || savingCostKey !== null}
            onChange={(event) => setMonth(event.target.value)}
          />

<button
  type="button"
  onClick={handleExportExcel}
  disabled={exportingExcel || loading}
>
  {exportingExcel ? "作成中..." : "Excel出力"}
</button>

<button
            type="button"
            disabled={loading || !!loadError || savingCostKey !== null}
            onClick={() => {
              if (Object.keys(costDrafts).length > 0) {
                alert(
                  "未保存の入力があります。「この行を保存」を押してから印刷してください。"
                );
                return;
              }

              window.print();
            }}
          >
            印刷
          </button>
        </div>
      </div>

      {loading && <p className="message">読み込み中...</p>}

      {!loading && loadError && (
        <p className="error-message">{loadError}</p>
      )}

{!loading && !loadError && filteredSheets.length === 0 && (
  <p className="message">
    この月・営業所に該当する日報はありません。
  </p>
)}

{!loading && !loadError && filteredSheets.length > 0 && (
        <div className="sheet-scroll">
          <div className="sheet-list">
          {filteredSheets.map((sheet, sheetIndex) => {
              const totals = sheet.rows.reduce(
                (result, row) => ({
                  workerCount: result.workerCount + row.workerCount,
                  overtimeHours:
                    result.overtimeHours + row.overtimeHours,
                  vehicleCount: result.vehicleCount + row.vehicleCount,
                  parking: result.parking + row.parking,
                  gasoline: result.gasoline + row.gasoline,
                  diesel: result.diesel + row.diesel,
                }),
                {
                  workerCount: 0,
                  overtimeHours: 0,
                  vehicleCount: 0,
                  parking: 0,
                  gasoline: 0,
                  diesel: 0,
                }
              );

              return (
                <section className="report-sheet" key={sheet.key}>
                  <div className="sheet-title-row">
                    <strong>
                      {year}年{monthNumber}月
                    </strong>
                    <strong>
                      {sheet.ownCompanyName
                        ? `作業員日報（${sheet.ownCompanyName}のみ）`
                        : "作業員日報"}
                    </strong>
                    <strong>{sheetIndex + 1}</strong>
                  </div>

                  <div className="info-row">
                    <span>現場名</span>
                    <strong>{sheet.siteName}</strong>
                  </div>

                  <div className="info-row">
                    <span>昼/夜</span>
                    <strong>
                      {sheet.shiftType === "night" ? "夜" : "昼"}
                    </strong>
                  </div>

                  <div className="info-row office-manager-row">
  <span>出張所、担当</span>
  <strong>{sheet.contractorName}</strong>
  <strong>{sheet.managerName}</strong>
</div>

                  <table>
                    <thead>
                      <tr>
                        <th>日付</th>
                        <th>曜日</th>
                        <th>人工</th>
                        <th>残業</th>
                        <th>車両</th>
                        <th>駐車場</th>
                        <th>
                          ガソリン
                          <br />
                          （リットル）
                        </th>
                        <th>
                          軽油
                          <br />
                          （リットル）
                        </th>
                        <th>備考</th>
                      </tr>
                    </thead>

                    <tbody>
                      {sheet.rows.map((row) => {
                        const date = new Date(`${row.date}T00:00:00`);
                        const costKey = getCostKey(sheet, row.date);
                        const initialCost = {
                          parking: row.parking ? String(row.parking) : "",
                          gasoline: row.gasoline ? String(row.gasoline) : "",
                          diesel: row.diesel ? String(row.diesel) : "",
                        };
                        const costDraft = costDrafts[costKey] ?? initialCost;
                        const hasData =
                          row.workerCount !== 0 ||
                          row.overtimeHours !== 0 ||
                          row.vehicleCount !== 0 ||
                          row.parking !== 0 ||
                          row.gasoline !== 0 ||
                          row.diesel !== 0 ||
                          row.notes.length > 0;

                        return (
                          <tr key={row.date}>
                            <td>
                              {monthNumber}/{Number(row.date.slice(-2))}
                            </td>
                            <td>{weekdays[date.getDay()]}</td>
                            <td>{hasData ? row.workerCount || "" : ""}</td>
                            <td>
                              {row.overtimeHours
                                ? Number(row.overtimeHours.toFixed(2))
                                : ""}
                            </td>
                            <td>{row.vehicleCount || ""}</td>
                            {(["parking", "gasoline", "diesel"] as const).map(
                              (field) => {
                                const label =
                                  field === "parking"
                                    ? "駐車場（円）"
                                    : field === "gasoline"
                                      ? "ガソリン（リットル）"
                                      : "軽油（リットル）";

                                const savedValue = row[field]
                                  ? field === "parking"
                                    ? `¥${row[field].toLocaleString()}`
                                    : Number(row[field].toFixed(2))
                                  : "";

                                return (
                                  <td key={field}>
                                    {aggregationScope === "own" ? (
                                      <>
                                        <input
                                          className="cost-input"
                                          type="text"
                                          inputMode="decimal"
                                          aria-label={`${sheet.siteName} ${row.date} ${label}`}
                                          value={costDraft[field]}
                                          disabled={savingCostKey !== null}
                                          onChange={(event) => {
                                            const value = event.target.value;

                                            setCostDrafts((current) => ({
                                              ...current,
                                              [costKey]: {
                                                ...(current[costKey] ?? initialCost),
                                                [field]: value,
                                              },
                                            }));
                                          }}
                                          style={{
                                            width: "100%",
                                            minWidth: 55,
                                            boxSizing: "border-box",
                                            textAlign: "right",
                                            padding: "4px",
                                          }}
                                        />
                                        <span className="cost-print-value">
                                          {savedValue}
                                        </span>
                                      </>
                                    ) : (
                                      savedValue
                                    )}
                                  </td>
                                );
                              }
                            )}

                            <td>
                              {row.notes.join(" / ")}

                              {aggregationScope === "own" &&
                                costDrafts[costKey] && (
                                  <div className="cost-save-controls">
                                    <button
                                      type="button"
                                      disabled={savingCostKey !== null}
                                      onClick={() => void saveCompanyCost(sheet, row)}
                                    >
                                      {savingCostKey === costKey
                                        ? "保存中..."
                                        : "この行を保存"}
                                    </button>
                                  </div>
                                )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>

                    <tfoot>
                      <tr>
                        <th colSpan={2}>合計</th>
                        <th>{totals.workerCount}</th>
                        <th>
                          {Number(totals.overtimeHours.toFixed(2))}
                        </th>
                        <th>{totals.vehicleCount}</th>
                        <th>¥{totals.parking.toLocaleString()}</th>
                        <th>{Number(totals.gasoline.toFixed(2))}</th>
                        <th>{Number(totals.diesel.toFixed(2))}</th>
                        <th />
                      </tr>
                    </tfoot>
                  </table>
                </section>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
              .cost-print-value {
                display: none;
              }
        .monthly-sheet-page {
          min-height: 100vh;
          padding: 16px;
          background: #f5f6f8;
          color: #111;
        }

        .screen-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }

        .screen-toolbar h1 {
          margin: 0;
        }

        .screen-toolbar p {
          margin: 4px 0 0;
          color: #666;
        }

        .toolbar-actions {
          display: flex;
          gap: 8px;
          margin-left: auto;
        }

        .toolbar-actions select,
.toolbar-actions input,
.toolbar-actions button {
  padding: 10px 14px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #fff;
  font: inherit;
}

        .toolbar-actions button {
          background: #111;
          color: #fff;
          cursor: pointer;
        }

        .message,
        .error-message {
          padding: 16px;
          border-radius: 10px;
          background: #fff;
        }

        .error-message {
          color: #b91c1c;
        }

        .sheet-scroll {
          overflow-x: auto;
          padding-bottom: 16px;
        }

        .sheet-list {
          display: flex;
          align-items: flex-start;
          gap: 24px;
          width: max-content;
        }

        .report-sheet {
          width: 620px;
          flex: 0 0 620px;
          background: #fff;
        }

        .sheet-title-row {
          display: grid;
          grid-template-columns: 1fr 1fr 70px;
          min-height: 42px;
          border: 2px solid #111;
        }

        .sheet-title-row > * {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-right: 1px solid #111;
          font-size: 18px;
        }

        .sheet-title-row > *:last-child {
          border-right: none;
        }

        .info-row {
          display: grid;
          grid-template-columns: 130px 1fr;
          border-left: 2px solid #111;
          border-right: 2px solid #111;
          border-bottom: 1px solid #111;
        }

        .info-row > * {
          padding: 7px 10px;
          text-align: center;
        }

        .info-row span {
          border-right: 1px solid #111;
        }

        .office-manager-row {
            grid-template-columns: 130px 1fr 1fr;
          }
          
          .office-manager-row strong:first-of-type {
            border-right: 1px solid #111;
          }

        table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
          border: 2px solid #111;
          border-top: none;
          font-size: 12px;
        }

        th,
        td {
          height: 24px;
          padding: 2px 4px;
          border: 1px solid #111;
          text-align: center;
          overflow: hidden;
        }

        th:nth-child(1) {
          width: 48px;
        }

        th:nth-child(2) {
          width: 36px;
        }

        th:nth-child(3),
        th:nth-child(4),
        th:nth-child(5) {
          width: 45px;
        }

        th:nth-child(6) {
          width: 64px;
        }

        th:nth-child(7),
        th:nth-child(8) {
          width: 64px;
        }

        th:nth-child(9) {
          width: 150px;
        }

        td:last-child {
          text-align: left;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        tfoot th {
          font-weight: 900;
          background: #fafafa;
        }

        @media (max-width: 768px) {
          .monthly-sheet-page {
            padding: 8px;
          }

          .toolbar-actions {
            width: 100%;
            margin-left: 0;
          }
        }

        @media print {
          .cost-input,
          .cost-save-controls {
            display: none !important;
          }

          .cost-print-value {
            display: inline !important;
          }
            @page {
              size: A4 portrait;
              margin: 5mm;
            }
          
            :global(.app-navbar) {
              display: none !important;
            }
          
            :global(main) {
              padding: 0 !important;
              margin: 0 !important;
            }
          
            .monthly-sheet-page {
              padding: 0;
              margin: 0;
              background: #fff;
            }
          
            .screen-toolbar,
            .message,
            .error-message {
              display: none;
            }
          
            .sheet-scroll {
              overflow: visible;
              padding: 0;
            }
          
            .sheet-list {
              display: block;
              width: auto;
            }
          
            .report-sheet {
              width: 200mm;
              margin: 0 auto;
              break-inside: avoid-page;
              page-break-inside: avoid;
              break-after: page;
              page-break-after: always;
            }
          
            .report-sheet:last-child {
              break-after: auto;
              page-break-after: auto;
            }
          
            .sheet-title-row {
              min-height: 9mm;
            }
          
            .sheet-title-row > * {
              padding: 2mm;
              font-size: 12pt;
            }
          
            .info-row > * {
              padding: 1.5mm 2mm;
              font-size: 9pt;
            }
          
            table {
              font-size: 7.5pt;
            }
          
            th,
            td {
              height: 5.5mm;
              padding: 0 1mm;
              line-height: 1.1;
            }
          
            thead tr,
            tbody tr,
            tfoot tr {
              break-inside: avoid;
              page-break-inside: avoid;
            }
        }
            `}</style>
    </div>
  );
}