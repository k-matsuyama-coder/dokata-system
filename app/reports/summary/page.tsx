"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ReportMember = {
  employee_name: string;
  labor: number;
  overtime: number;
  is_driver: boolean;
  report_id: string;
};

type SummaryRow = {
  employeeName: string;
  laborTotal: number;
  overtimeTotal: number;
  driveCount: number;
  workDays: number;
};

export default function ReportsSummaryPage() {
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        alert("ログインしてください");
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("report_members")
        .select("employee_name, labor, overtime, is_driver, report_id")
        .order("employee_name", { ascending: true });

      if (error) {
        alert("集計取得失敗: " + error.message);
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as ReportMember[];

      const map = new Map<string, SummaryRow>();
      const workDayMap = new Map<string, Set<string>>();

      for (const row of rows) {
        const name = row.employee_name ?? "不明";

        if (!map.has(name)) {
          map.set(name, {
            employeeName: name,
            laborTotal: 0,
            overtimeTotal: 0,
            driveCount: 0,
            workDays: 0,
          });
        }

        if (!workDayMap.has(name)) {
          workDayMap.set(name, new Set());
        }

        const current = map.get(name)!;
        current.laborTotal += Number(row.labor || 0);
        current.overtimeTotal += Number(row.overtime || 0);

        if (row.is_driver) {
          current.driveCount += 1;
        }

        if (row.report_id) {
          workDayMap.get(name)!.add(row.report_id);
        }
      }

      const result = Array.from(map.values()).map((item) => ({
        ...item,
        workDays: workDayMap.get(item.employeeName)?.size ?? 0,
      }));

      setSummary(result);
      setLoading(false);
    };

    fetchSummary();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <h1 style={{ margin: 0 }}>個人別集計</h1>

        <a
          href="/reports"
          style={{
            textDecoration: "none",
            backgroundColor: "#111",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          日報一覧へ戻る
        </a>
      </div>

      {loading ? (
        <p>読み込み中...</p>
      ) : summary.length === 0 ? (
        <p>データがありません</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {summary.map((row) => (
            <div
              key={row.employeeName}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 16,
                backgroundColor: "#fff",
              }}
            >
              <p style={{ margin: "0 0 12px 0", fontWeight: "bold", fontSize: 18 }}>
                {row.employeeName}
              </p>

              <div style={{ display: "grid", gap: 8 }}>
                <p style={{ margin: 0 }}>合計人工: {row.laborTotal}</p>
                <p style={{ margin: 0 }}>合計残業: {row.overtimeTotal}</p>
                <p style={{ margin: 0 }}>運転回数: {row.driveCount}</p>
                <p style={{ margin: 0 }}>稼働日数: {row.workDays}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}