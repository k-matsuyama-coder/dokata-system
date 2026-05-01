"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ReportRow = {
  id: string;
  report_date: string;
  site_name: string | null;
  shift_type: string | null;
};

type MemberRow = {
  overtime: number | null;
  is_driver: boolean | null;
  report_id: string;
};

export default function HomePage() {
  const [employeeName, setEmployeeName] = useState("");
  const [dayCount, setDayCount] = useState(0);
const [nightCount, setNightCount] = useState(0);

const [dayOvertime, setDayOvertime] = useState(0);
const [nightOvertime, setNightOvertime] = useState(0);
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

      const { data: loginEmployee } = await supabase
  .from("employees")
  .select("must_change_password")
  .eq("auth_user_id", user.id)
  .single();

if (loginEmployee?.must_change_password) {
  window.location.href = "/change-password";
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
        setDayCount(0);
setNightCount(0);
setDayOvertime(0);
setNightOvertime(0);
setTotalVehicleCount(0);
setRecentReports([]);
return;
      }

      const reportIds = memberRows
        .map((row: MemberRow) => row.report_id)
        .filter(Boolean);

      const { data: reportRows, error: reportError } = await supabase
        .from("daily_reports")
        .select("id, report_date, site_name, shift_type")
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

      const daySet = new Set<string>();
const nightSet = new Set<string>();

let dayOver = 0;
let nightOver = 0;

currentMonthMembers.forEach((row) => {
  const report = reportMap.get(row.report_id);
  if (!report) return;

  const shift = (report as any).shift_type;

  if (shift === "night") {
    nightSet.add(report.report_date);
    nightOver += Number(row.overtime ?? 0);
  } else {
    daySet.add(report.report_date);
    dayOver += Number(row.overtime ?? 0);
  }
});

setDayCount(daySet.size);
setNightCount(nightSet.size);

setDayOvertime(dayOver);
setNightOvertime(nightOver);

      const vehicleSum = currentMonthMembers.filter((row) => row.is_driver).length;
      setTotalVehicleCount(vehicleSum);

      const recent = (reportRows ?? []).slice(0, 5) as ReportRow[];
      setRecentReports(recent);
    };

    fetchHomeData();
  }, []);

  const totalDays = dayCount + nightCount;
const totalOvertimeSum = dayOvertime + nightOvertime;

  return (
    <div
      style={{
        padding: 16,
        maxWidth: 760,
        margin: "0 auto",
        backgroundColor: "#f7f7f7",
        minHeight: "100vh",
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <p style={{ margin: "6px 0 0 0", color: "#555" }}>
          {employeeName} さん、お疲れさまです
        </p>
      </div>
  
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <a
          href="/reports/new"
          style={{
            textDecoration: "none",
            backgroundColor: "#111",
            color: "#fff",
            padding: 16,
            borderRadius: 14,
            fontWeight: 700,
            textAlign: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          }}
        >
          ＋ 日報を登録
        </a>
  
        <a
          href="/reports/new?copy=1"
          style={{
            textDecoration: "none",
            backgroundColor: "#fff",
            color: "#111",
            padding: 16,
            borderRadius: 14,
            fontWeight: 700,
            textAlign: "center",
            border: "1px solid #ddd",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          前回コピー
        </a>
      </div>
  
      <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginBottom: 20,
  }}
>
  <div
    style={{
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 16,
      border: "1px solid #e5e5e5",
      boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
    }}
  >
    <p style={{ margin: 0, fontSize: 14, color: "#666" }}>稼働</p>
    <p style={{ margin: "8px 0 0 0", fontWeight: 800, fontSize: 18 }}>
  合計 {totalDays}日
</p>

<p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
  昼 {dayCount} / 夜 {nightCount}
</p>
  </div>

  <div
    style={{
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 16,
      border: "1px solid #e5e5e5",
      boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
    }}
  >
    <p style={{ margin: 0, fontSize: 14, color: "#666" }}>残業</p>
    <p style={{ margin: "8px 0 0 0", fontWeight: 800, fontSize: 18 }}>
  合計 {totalOvertimeSum}h
</p>

<p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
  昼 {dayOvertime}h / 夜 {nightOvertime}h
</p>
  </div>

  <div
    style={{
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 16,
      border: "1px solid #e5e5e5",
      boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
    }}
  >
    <p style={{ margin: 0, fontSize: 14, color: "#666" }}>運転回数</p>
    <p style={{ margin: "8px 0 0 0", fontWeight: 800, fontSize: 24 }}>
      {totalVehicleCount}
      <span style={{ fontSize: 14, marginLeft: 4 }}>回</span>
    </p>
  </div>
</div>
  
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 18,
          padding: 18,
          border: "1px solid #e5e5e5",
          boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20 }}>免許情報</h2>
  
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              padding: "6px 10px",
              borderRadius: 999,
              backgroundColor:
                licenseStatus === "expired"
                  ? "#ffe5e5"
                  : licenseStatus === "warning"
                  ? "#fff3cd"
                  : "#e8f5e9",
              color:
                licenseStatus === "expired"
                  ? "red"
                  : licenseStatus === "warning"
                  ? "#b26a00"
                  : "green",
            }}
          >
            {licenseStatus === "expired"
              ? "期限切れ"
              : licenseStatus === "warning"
              ? "期限注意"
              : licenseStatus === "ok"
              ? "有効"
              : "未登録"}
          </span>
        </div>
  
        {licenseName ? (
          <>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              {licenseName}
            </p>
            <p style={{ margin: "8px 0 0 0", color: "#555" }}>
              期限: {licenseExpiryDate || "-"}
            </p>
  
            {licenseStatus === "expired" && (
              <p style={{ margin: "10px 0 0 0", color: "red", fontWeight: 700 }}>
                ⚠️ 免許期限が切れています
              </p>
            )}
  
            {licenseStatus === "warning" && (
              <p
                style={{
                  margin: "10px 0 0 0",
                  color: "#b26a00",
                  fontWeight: 700,
                }}
              >
                ⚠️ 免許期限が近づいています（あと{licenseRemainingDays}日）
              </p>
            )}
  
            {licenseStatus === "ok" && (
              <p style={{ margin: "10px 0 0 0", color: "green", fontWeight: 700 }}>
                ✅ 免許は有効です
              </p>
            )}
          </>
        ) : (
          <p style={{ margin: 0, color: "#666" }}>免許は登録されていません</p>
        )}
      </div>
    </div>
  );
}