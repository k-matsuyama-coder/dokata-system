"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type Employee = {
  name: string;
};

type ReportMember = {
  employee_name: string;
  labor: number;
  overtime: number;
  is_driver: boolean;
  report_id: string;
  shift_type: string;
};

const getNextMonth = (ym: string) => {
  if (!ym) return "";

  const [y, m] = ym.split("-").map(Number);
  const next = new Date(y, m);
  return next.toISOString().slice(0, 10);
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedName, setSelectedName] = useState("");
  const [rows, setRows] = useState<ReportMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [yearMonth, setYearMonth] = useState("");

  // 社員一覧取得
  useEffect(() => {
    const fetchEmployees = async () => {
      const { data } = await supabase
        .from("employees")
        .select("name")
        .order("name", { ascending: true });

      if (data) setEmployees(data);
    };

    fetchEmployees();
  }, []);

  // 集計取得
  useEffect(() => {
    const fetchSummary = async () => {
      if (!selectedName) {
        setRows([]);
        return;
      }

      setLoading(true);

      let query = supabase
        .from("report_members")
        .select(`
          employee_name,
          labor,
          overtime,
          is_driver,
          report_id,
          daily_reports!inner(
            report_date,
            shift_type
          )
        `)
        .eq("employee_name", selectedName);

      if (yearMonth) {
        query = query
          .gte("daily_reports.report_date", yearMonth + "-01")
          .lt("daily_reports.report_date", getNextMonth(yearMonth));
      }

      const { data, error } = await query;

      if (error) {
        alert("集計取得失敗: " + error.message);
        setLoading(false);
        return;
      }

      setRows(
        (data ?? []).map((row: any) => ({
          ...row,
          shift_type: row.daily_reports?.shift_type || "day",
        }))
      );

      setLoading(false);
    };

    fetchSummary();
  }, [selectedName, yearMonth]);

  // 集計ロジック
  const summary = useMemo(() => {
    let dayLabor = 0;
    let nightLabor = 0;
    let dayOvertime = 0;
    let nightOvertime = 0;

    rows.forEach((row) => {
      if (row.shift_type === "night") {
        nightLabor += Number(row.labor || 0);
        nightOvertime += Number(row.overtime || 0);
      } else {
        dayLabor += Number(row.labor || 0);
        dayOvertime += Number(row.overtime || 0);
      }
    });

    const driveCount = rows.filter((row) => row.is_driver).length;
    const workDays = new Set(rows.map((row) => row.report_id)).size;

    return {
      dayLabor,
      nightLabor,
      dayOvertime,
      nightOvertime,
      driveCount,
      workDays,
    };
  }, [rows]);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
        <BackButton />
      <h1 style={{ marginBottom: 20 }}>社員別集計一覧</h1>
      

      {/* 社員選択 */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ marginBottom: 8 }}>社員選択</p>
        <select
          value={selectedName}
          onChange={(e) => setSelectedName(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            fontSize: 16,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        >
          <option value="">選択してください</option>
          {employees.map((emp) => (
            <option key={emp.name} value={emp.name}>
              {emp.name}
            </option>
          ))}
        </select>
      </div>

      {/* 月選択 */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ marginBottom: 8 }}>年月</p>
        <input
          type="month"
          value={yearMonth}
          onChange={(e) => setYearMonth(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            fontSize: 16,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        />
      </div>

      {/* 表示 */}
      {!selectedName ? (
        <p>社員を選択してください</p>
      ) : loading ? (
        <p>読み込み中...</p>
      ) : (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 10,
            padding: 16,
            backgroundColor: "#fff",
            display: "grid",
            gap: 12,
          }}
        >
          <p style={{ fontWeight: "bold", fontSize: 18 }}>
            {selectedName}
          </p>

          <p>昼人工: {summary.dayLabor}</p>
          <p>夜人工: {summary.nightLabor}</p>

          <p>昼残業: {summary.dayOvertime}</p>
          <p>夜残業: {summary.nightOvertime}</p>

          <p>運転回数: {summary.driveCount}</p>
          <p>稼働日数: {summary.workDays}</p>
        </div>
      )}
    </div>
  );
}