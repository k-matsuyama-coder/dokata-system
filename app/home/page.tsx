"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const [employeeName, setEmployeeName] = useState("");
  const [workingDays, setWorkingDays] = useState(0);
  const [totalOvertime, setTotalOvertime] = useState(0);
  const [totalVehicleCount, setTotalVehicleCount] = useState(0);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [licenseName, setLicenseName] = useState("");
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("");
  const [licenseStatus, setLicenseStatus] = useState("");
  const [licenseRemainingDays, setLicenseRemainingDays] = useState<number | null>(null);
  const [debugEmployeeName, setDebugEmployeeName] = useState("");
  const [debugReportCount, setDebugReportCount] = useState(0);

  useEffect(() => {
    const fetchHomeData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: employee } = await supabase
        .from("employees")
        .select("id, name")
        .eq("auth_user_id", user.id)
        .single();

      if (!employee) return;

      setEmployeeName(employee.name);
      setDebugEmployeeName(employee.name);

      const { data: licenses } = await supabase
        .from("licenses")
        .select("license_name, expiry_date")
        .eq("employee_id", employee.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (licenses && licenses.length > 0) {
        const license = licenses[0];

        setLicenseName(license.license_name ?? "");
        setLicenseExpiryDate(license.expiry_date ?? "");

        if (license.expiry_date) {
          const today = new Date();
          const expiry = new Date(license.expiry_date);
          const diffTime = expiry.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          setLicenseRemainingDays(diffDays);

          if (diffDays < 0) {
            setLicenseStatus("expired");
          } else if (diffDays <= 30) {
            setLicenseStatus("warning");
          } else {
            setLicenseStatus("ok");
          }
        }
      }

      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);

      const { data: memberRows, error: memberError } = await supabase
        .from("report_members")
        .select(`
          overtime,
          is_driver,
          report_id
        `)
        .eq("employee_name", employee.name);

      if (memberError) {
        console.error("report_members取得失敗:", memberError.message);
        return;
      }

      if (!memberRows || memberRows.length === 0) {
        setWorkingDays(0);
        setTotalOvertime(0);
        setTotalVehicleCount(0);
        setRecentReports([]);
        setDebugReportCount(0);
        return;
      }

      setDebugReportCount(memberRows.length);

      const reportIds = memberRows.map((row: any) => row.report_id).filter(Boolean);

      const { data: reportRows, error: reportError } = await supabase
        .from("daily_reports")
        .select("id, report_date, site_name")
        .in("id", reportIds)
        .gte("report_date", firstDay)
        .lte("report_date", lastDay)
        .order("report_date", { ascending: false });

      if (reportError) {
        console.error("daily_reports取得失敗:", reportError.message);
        return;
      }

      const reportMap = new Map<string, any>();
      (reportRows ?? []).forEach((report: any) => {
        reportMap.set(report.id, report);
      });

      const currentMonthMembers = memberRows.filter((row: any) =>
        reportMap.has(row.report_id)
      );

      const uniqueDays = Array.from(
        new Set(
          currentMonthMembers
            .map((row: any) => reportMap.get(row.report_id)?.report_date)
            .filter(Boolean)
        )
      );
      setWorkingDays(uniqueDays.length);

      const overtimeSum = currentMonthMembers.reduce(
        (sum: number, row: any) => sum + Number(row.overtime ?? 0),
        0
      );
      setTotalOvertime(overtimeSum);

      const vehicleSum = currentMonthMembers.filter((row: any) => row.is_driver).length;
      setTotalVehicleCount(vehicleSum);

      const recent = (reportRows ?? [])
        .slice(0, 5)
        .map((report: any) => ({
          report_date: report.report_date,
          site_name: report.site_name,
        }));

      setRecentReports(recent);
    };

    fetchHomeData();
  }, []);

  return (
    <div
      style={{
        padding: 16,
        maxWidth: 600,
        margin: "0 auto",
      }}
    >
      <h1>ホーム</h1>

      <div style={{ marginTop: 16, marginBottom: 20 }}>
        <a
          href="/reports/new"
          style={{
            display: "inline-block",
            textDecoration: "none",
            backgroundColor: "#111",
            color: "#fff",
            padding: "12px 16px",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          ＋ 日報を登録
        </a>
      </div>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: 16,
          marginTop: 16,
        }}
      >
        <p>名前: {employeeName}</p>
        <p>今月の稼働日数: {workingDays}日</p>
        <p>今月の残業数: {totalOvertime}分</p>
        <p>今月の車両数: {totalVehicleCount}</p>
        <p style={{ color: "red" }}>確認用 名前: {debugEmployeeName}</p>
        <p style={{ color: "red" }}>確認用 report件数: {debugReportCount}</p>

        <h2 style={{ marginTop: 20 }}>免許</h2>

        {licenseName ? (
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 12,
              marginTop: 8,
              backgroundColor:
                licenseStatus === "expired"
                  ? "#ffe5e5"
                  : licenseStatus === "warning"
                  ? "#fff3cd"
                  : "#e8f5e9",
            }}
          >
            <p style={{ margin: 0, fontWeight: "bold" }}>{licenseName}</p>
            <p style={{ margin: "8px 0 0 0" }}>期限: {licenseExpiryDate || "-"}</p>

            {licenseStatus === "expired" && (
              <p style={{ margin: "8px 0 0 0", color: "red", fontWeight: "bold" }}>
                ⚠️ 免許期限が切れています
              </p>
            )}

            {licenseStatus === "warning" && (
              <p style={{ margin: "8px 0 0 0", color: "#b26a00", fontWeight: "bold" }}>
                ⚠️ 免許期限が近づいています（あと{licenseRemainingDays}日）
              </p>
            )}

            {licenseStatus === "ok" && (
              <p style={{ margin: "8px 0 0 0", color: "green", fontWeight: "bold" }}>
                ✅ 免許は有効です
              </p>
            )}
          </div>
        ) : (
          <p>免許は登録されていません</p>
        )}

        <h2 style={{ marginTop: 20 }}>最近の日報</h2>
        {recentReports.length === 0 ? (
          <p>日報がありません</p>
        ) : (
          recentReports.map((report, index) => (
            <div
              key={index}
              style={{
                border: "1px solid #ccc",
                borderRadius: 6,
                padding: 10,
                marginTop: 8,
              }}
            >
              <p>日付: {report.report_date}</p>
              <p>現場: {report.site_name}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}