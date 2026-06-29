"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { hasRole } from "@/app/types/auth";

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

type AdminSummary = {
  todayReportCount: number;
  todayPlannedSiteCount: number;
  todayWorkerCount: number;
  monthlyPlannedLabor: number;
  monthlyActualLabor: number;
  monthlyTargetLabor: number;
  pendingItemRequests: number;
  returnItemRequests: number;
};

export default function HomePage() {
  const [employeeName, setEmployeeName] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [adminSummary, setAdminSummary] = useState<AdminSummary>({
    todayReportCount: 0,
    todayPlannedSiteCount: 0,
    todayWorkerCount: 0,
    monthlyPlannedLabor: 0,
    monthlyActualLabor: 0,
    monthlyTargetLabor: 0,
    pendingItemRequests: 0,
    returnItemRequests: 0,
  });
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

const getCurrentOrganization = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    return null;
  }

  const res = await fetch("/api/current-organization", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await res.json();

  if (!res.ok) {
    console.error(result.error || "organization取得失敗");
    return null;
  }

  return result.organizationId as string | null;
};


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
.select(`
  id,
  name,
  role,
  organization_id,
  organizations (
    status
  )
`)
.eq("auth_user_id", user.id)
.single();

if (employeeError || !employee) {
console.error("社員情報取得失敗:", employeeError?.message);
return;
}

setEmployeeName(employee.name?.trim() || user.email || "ユーザー");
setRole(employee.role);

const currentOrganizationId = await getCurrentOrganization();

if (!currentOrganizationId) {
  alert("会社情報が取得できません");
  return;
}

const organizationStatus = Array.isArray(employee.organizations)
? employee.organizations[0]?.status
: employee.organizations?.status;

if (organizationStatus === "suspended" || organizationStatus === "cancelled") {
alert("現在この会社はご利用いただけません。管理者へお問い合わせください。");
await supabase.auth.signOut();
window.location.href = "/login";
return;
}

      const todayString = new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Asia/Tokyo",
      }).format(new Date());
      
      const monthStart = todayString.slice(0, 7) + "-01";
      
      if (hasRole(employee.role, "admin")) {
        const monthEnd = new Date(
          Number(todayString.slice(0, 4)),
          Number(todayString.slice(5, 7)),
          0
        )
          .toISOString()
          .slice(0, 10);
      
          const { data: todayReports } = await supabase
          .from("daily_reports")
          .select("id")
          .eq("organization_id", currentOrganizationId)
          .eq("report_date", todayString);
      
          const { data: todayAssignments } = await supabase
          .from("assignments")
          .select("id")
          .eq("organization_id", currentOrganizationId)
          .lte("start_date", todayString)
          .or(`end_date.gte.${todayString},end_date.is.null`);
      
          const { data: todayMembers } = await supabase
          .from("assignment_site_members")
          .select("id")
          .eq("organization_id", currentOrganizationId)
          .eq("work_date", todayString);
      
          const { data: monthlyDailyInfos } = await supabase
          .from("assignment_site_daily_infos")
          .select("planned_count, work_date")
          .eq("organization_id", currentOrganizationId)
          .gte("work_date", monthStart)
          .lte("work_date", monthEnd);
      
          const { data: monthlyReports } = await supabase
          .from("daily_reports")
          .select("worker_count")
          .eq("organization_id", currentOrganizationId)
          .gte("report_date", monthStart)
          .lte("report_date", monthEnd);
      
        const { data: pendingItems } = await supabase
          .from("item_requests")
          .select("id")
          .eq("status", "pending");
      
        const { data: returnItems } = await supabase
          .from("item_requests")
          .select("id")
          .eq("status", "return_requested");
      
        const monthlyPlannedLabor = (monthlyDailyInfos ?? []).reduce(
          (sum, row) => sum + Number(row.planned_count ?? 0),
          0
        );
      
        const monthlyActualLabor = (monthlyReports ?? []).reduce(
          (sum, report) => sum + Number(report.worker_count ?? 0),
          0
        );
      
        setAdminSummary({
          todayReportCount: todayReports?.length ?? 0,
          todayPlannedSiteCount: todayAssignments?.length ?? 0,
          todayWorkerCount: todayMembers?.length ?? 0,
          monthlyPlannedLabor,
          monthlyActualLabor,
          monthlyTargetLabor: monthlyPlannedLabor,
          pendingItemRequests: pendingItems?.length ?? 0,
          returnItemRequests: returnItems?.length ?? 0,
        });
      }

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
        .eq("organization_id", currentOrganizationId)
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

const driverReportIds = new Set(
  currentMonthMembers
    .filter((row) => row.is_driver)
    .map((row) => row.report_id)
);

setTotalVehicleCount(driverReportIds.size);

      const recent = (reportRows ?? []).slice(0, 5) as ReportRow[];
      setRecentReports(recent);
    };

    fetchHomeData();
  }, []);

  useEffect(() => {
    const checkRole = async () => {
      const { data: orgId } = await supabase.rpc("current_organization_id");
      const { data: isAdmin } = await supabase.rpc("is_admin");
      const { data: isSuperAdmin } = await supabase.rpc("is_super_admin");
  
      console.log("current_organization_id:", orgId);
      console.log("is_admin:", isAdmin);
      console.log("is_super_admin:", isSuperAdmin);
    };
  
    checkRole();
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
        {employeeName || "ユーザー"} さん、お疲れさまです
          </p>

          {hasRole(role ?? "", "admin") && (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: 12,
      marginTop: 16,
      marginBottom: 20,
    }}
  >
    <AdminCard
  label="今日の日報"
  value={`${adminSummary.todayReportCount}/${adminSummary.todayPlannedSiteCount}`}
  href="/admin/report-status"
/>
<AdminCard
  label="今日の稼働人数"
  value={`${adminSummary.todayWorkerCount}人`}
  href="/assignments/month"
/>
<AdminCard
  label="今月予定人工"
  value={`${adminSummary.monthlyPlannedLabor}`}
  href="/admin/analytics/monthly"
/>
<AdminCard
  label="進捗人工/終着人工"
  value={`${adminSummary.monthlyActualLabor}/${adminSummary.monthlyTargetLabor}`}
  href="/admin/analytics/monthly"
/>
<AdminCard
  label="物品使用申請"
  value={`${adminSummary.pendingItemRequests}件`}
  href="/admin/items/requests"
/>
<AdminCard
  label="返却確認待ち"
  value={`${adminSummary.returnItemRequests}件`}
  href="/admin/items/requests"
/>
  </div>
)}
        
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
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 12,
    marginBottom: 20,
  }}
>
  <a
    href="/admin/items/request"
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
    物品使用申請
  </a>

  <a
    href="/admin/items/my-items"
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
    貸出状況確認
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

function AdminCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <a
      href={href}
      style={{
        backgroundColor: "#fff",
        border: "1px solid #ddd",
        borderRadius: 16,
        padding: 16,
        textDecoration: "none",
        color: "#111",
        boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ fontSize: 13, color: "#666", fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ marginTop: 8, fontSize: 24, fontWeight: 900 }}>
        {value}
      </div>
    </a>
  );
}