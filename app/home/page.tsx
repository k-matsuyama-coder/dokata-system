"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ReportRow = {
  id: string;
  report_date: string;
  site_name: string | null;
};

type MemberRow = {
  overtime: number | null;
  is_driver: boolean | null;
  report_id: string;
};

export default function HomePage() {
  const [employeeName, setEmployeeName] = useState("");
  const [workingDays, setWorkingDays] = useState(0);
  const [totalOvertime, setTotalOvertime] = useState(0);
  const [totalVehicleCount, setTotalVehicleCount] = useState(0);
  const [recentReports, setRecentReports] = useState<ReportRow[]>([]);

  const [licenseName, setLicenseName] = useState("");
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("");
  const [licenseStatus, setLicenseStatus] = useState<"expired" | "warning" | "ok" | "">("");
  const [licenseRemainingDays, setLicenseRemainingDays] = useState<number | null>(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select("id, name")
        .eq("auth_user_id", user.id)
        .single();

      if (employeeError || !employee) {
        console.error("社員情報取得失敗:", employeeError?.message);
        return;
      }

      setEmployeeName(employee.name);

      const { data: licenses, error: licenseError } = await supabase
        .from("licenses")
        .select("license_name, expiry_date")
        .eq("employee_id", employee.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (licenseError) {
        console.error("免許情報取得失敗:", licenseError.message);
      }

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

      const { data: memberRows, error: memberError } = await supabase
        .from("report_members")
        .select("overtime, is_driver, report_id")
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
        return;
      }

      const reportIds = memberRows
        .map((row: MemberRow) => row.report_id)
        .filter(Boolean);

      const { data: reportRows, error: reportError } = await supabase
        .from("daily_reports")
        .select("id, report_date, site_name")
        .in("id", reportIds)
        .order("report_date", { ascending: false });

      if (reportError) {
        console.error("daily_reports取得失敗:", reportError.message);
        return;
      }

      const reportMap = new Map<string, ReportRow>();
      (reportRows ?? []).forEach((report: ReportRow) => {
        reportMap.set(report.id, report);
      });

      const currentMonthMembers = (memberRows as MemberRow[]).filter((row) => {
        const report = reportMap.get(row.report_id);
        if (!report?.report_date) return false;

        const reportDate = new Date(report.report_date);

        return (
          reportDate.getFullYear() === today.getFullYear() &&
          reportDate.getMonth() === today.getMonth()
        );
      });

      const uniqueDays = Array.from(
        new Set(
          currentMonthMembers
            .map((row) => reportMap.get(row.report_id)?.report_date)
            .filter(Boolean)
        )
      );

      setWorkingDays(uniqueDays.length);

      const overtimeSum = currentMonthMembers.reduce(
        (sum, row) => sum + Number(row.overtime ?? 0),
        0
      );
      setTotalOvertime(overtimeSum);

      const vehicleSum = currentMonthMembers.filter((row) => row.is_driver).length;
      setTotalVehicleCount(vehicleSum);

      const recent = (reportRows ?? []).slice(0, 5) as ReportRow[];
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

{recentReports.length === 0 ? (
  <p>日報がありません</p>
) : (
  recentReports.map((report) => (
    <div
      key={report.id}
      style={{
        border: "1px solid #ccc",
        borderRadius: 6,
        padding: 10,
        marginTop: 8,
        backgroundColor: "#fff",
      }}
    >
      <p>日付: {report.report_date}</p>
      <p>現場: {report.site_name || "-"}</p>

      <div style={{ marginTop: 10 }}>
        <a
          href={`/reports/${report.id}`}
          style={{
            display: "inline-block",
            textDecoration: "none",
            backgroundColor: "#111",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          詳細を見る
        </a>
      </div>
    </div>
  ))
)}
      </div>
    </div>
  );
}