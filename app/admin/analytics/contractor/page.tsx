"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type ReportMemberRow = {
  employee_name: string;
  labor: number;
  overtime: number;
  is_driver: boolean;
  report_id: string;
  daily_reports: {
    report_date: string;
    shift_type: string;
  } | null;
};

function PersonalAnalyticsContent() {
  const searchParams = useSearchParams();
  const employeeName = searchParams.get("name") ?? "";

  const [month, setMonth] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  });

  const [rows, setRows] = useState<ReportMemberRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        alert("ログインしてください");
        window.location.href = "/login";
        return;
      }

      const { data: me } = await supabase
        .from("employees")
        .select("role")
        .eq("auth_user_id", user.id)
        .single();

      if (!me || me.role !== "admin") {
        alert("管理者のみ閲覧できます");
        window.location.href = "/reports";
        return;
      }

      if (!employeeName) {
        setRows([]);
        setLoading(false);
        return;
      }

      const startDate = `${month}-01`;
      const endDate = new Date(`${month}-01`);
      endDate.setMonth(endDate.getMonth() + 1);
      const endDateStr = endDate.toISOString().slice(0, 10);

      const { data, error } = await supabase
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
        .eq("employee_name", employeeName)
        .gte("daily_reports.report_date", startDate)
        .lt("daily_reports.report_date", endDateStr);

      if (error) {
        alert("集計取得失敗: " + error.message);
        setLoading(false);
        return;
      }

      setRows((data as ReportMemberRow[]) ?? []);
      setLoading(false);
    };

    fetchData();
  }, [month, employeeName]);

  const summary = useMemo(() => {
    let dayLabor = 0;
    let nightLabor = 0;
    let dayOvertime = 0;
    let nightOvertime = 0;
    let driveCount = 0;

    const workDays = new Set<string>();

    for (const row of rows) {
      const shiftType = row.daily_reports?.shift_type ?? "day";
      const labor = Number(row.labor || 0);
      const overtime = Number(row.overtime || 0);

      if (shiftType === "night") {
        nightLabor += labor;
        nightOvertime += overtime;
      } else {
        dayLabor += labor;
        dayOvertime += overtime;
      }

      if (row.is_driver) {
        driveCount += 1;
      }

      if (row.report_id) {
        workDays.add(row.report_id);
      }
    }

    return {
      dayLabor,
      nightLabor,
      dayOvertime,
      nightOvertime,
      driveCount,
      workDays: workDays.size,
    };
  }, [rows]);

  const daysInMonth = useMemo(() => {
    const [year, monthNumber] = month.split("-").map(Number);
    return new Date(year, monthNumber, 0).getDate();
  }, [month]);

  const attendanceRate = useMemo(() => {
    if (!daysInMonth) return 0;
    return Math.round((summary.workDays / daysInMonth) * 1000) / 10;
  }, [summary.workDays, daysInMonth]);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <BackButton />
      <h1 style={{ marginBottom: 16 }}>個人別集計</h1>

      <div style={{ marginBottom: 20 }}>
        <p style={{ marginBottom: 8 }}>対象月</p>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            fontSize: 16,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        />
      </div>

      {loading ? (
        <p>読み込み中...</p>
      ) : !employeeName ? (
        <p>社員が選択されていません</p>
      ) : rows.length === 0 ? (
        <p>データがありません</p>
      ) : (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 16,
            backgroundColor: "#fff",
            display: "grid",
            gap: 12,
          }}
        >
          <p style={{ fontSize: 20, fontWeight: "bold", margin: 0 }}>
            {employeeName}
          </p>

          <p>昼人工: {summary.dayLabor}</p>
          <p>夜人工: {summary.nightLabor}</p>
          <p>昼残業: {summary.dayOvertime}</p>
          <p>夜残業: {summary.nightOvertime}</p>
          <p>運転回数: {summary.driveCount}</p>
          <p>稼働日数: {summary.workDays}</p>
          <p>月の日数: {daysInMonth}</p>
          <p style={{ fontWeight: "bold", fontSize: 18 }}>
            稼働率: {attendanceRate}%
          </p>
        </div>
      )}
    </div>
  );
}

export default function PersonalAnalyticsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>読み込み中...</div>}>
      <PersonalAnalyticsContent />
    </Suspense>
  );
}