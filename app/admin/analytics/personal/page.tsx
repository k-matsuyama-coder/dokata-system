"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type Report = {
  id: string;
  report_date: string | null;
  shift_type: string | null;
};

type Member = {
  report_id: string;
  employee_name: string | null;
  labor: number | null;
  overtime: number | null;
  is_driver: boolean | null;
};

export default function PersonalAnalyticsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [myName, setMyName] = useState("");

  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        alert("ログインしてください");
        return;
      }

      // 自分の名前取得
      const { data: me } = await supabase
        .from("employees")
        .select("name")
        .eq("auth_user_id", user.id)
        .single();

      if (!me) return;

      setMyName(me.name);

      const start = `${month}-01`;
      const end = new Date(
        Number(month.slice(0, 4)),
        Number(month.slice(5, 7)),
        0
      )
        .toISOString()
        .slice(0, 10);

      const { data: reportData } = await supabase
        .from("daily_reports")
        .select("id, report_date, shift_type")
        .gte("report_date", start)
        .lte("report_date", end);

      const reportIds = (reportData ?? []).map((r) => r.id);

      if (reportIds.length === 0) return;

      const { data: memberData } = await supabase
        .from("report_members")
        .select("report_id, employee_name, labor, overtime, is_driver")
        .in("report_id", reportIds);

      setReports(reportData ?? []);
      setMembers(memberData ?? []);
    };

    fetchData();
  }, [month]);

  const summary = useMemo(() => {
    const reportMap = new Map<string, Report>();
    reports.forEach((r) => reportMap.set(r.id, r));

    let day = 0;
    let night = 0;
    let total = 0;
    let overtime = 0;
    let vehicles = 0;
    let count = 0;

    members.forEach((m) => {
      if (m.employee_name !== myName) return;

      const report = reportMap.get(m.report_id);

      const labor = Number(m.labor ?? 0);

      if (report?.shift_type === "night") {
        night += labor;
      } else {
        day += labor;
      }

      total += labor;
      overtime += Number(m.overtime ?? 0);

      if (m.is_driver) vehicles += 1;

      count += 1;
    });

    return { day, night, total, overtime, vehicles, count };
  }, [reports, members, myName]);

  const cardStyle = {
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
  } as const;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <BackButton />

      <h1 style={{ marginBottom: 16 }}>個人別集計</h1>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <p>対象月</p>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: 12,
        }}
      >
        <div style={cardStyle}>名前：{myName}</div>
        <div style={cardStyle}>日報件数：{summary.count}</div>
        <div style={cardStyle}>昼：{summary.day}</div>
        <div style={cardStyle}>夜：{summary.night}</div>
        <div style={cardStyle}>合計人工：{summary.total}</div>
        <div style={cardStyle}>残業：{summary.overtime}</div>
        <div style={cardStyle}>車両回数：{summary.vehicles}</div>
      </div>
    </div>
  );
}