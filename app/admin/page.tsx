"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ReportSummaryCard from "@/app/components/ReportSummaryCard";

type Report = {
  id: string;
  report_date: string;
  worker_name: string;
  site_name: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  worker_count: number;
  vehicle_count: number;
  driver_name: string | null;
  note: string | null;
  expressway_main: number;
  expressway_secondary: number;
  expressway_subcontract: number;
  parking_main: number;
  parking_secondary: number;
  parking_subcontract: number;
  fuel_gasoline: number;
  fuel_diesel: number;
  work_description: string | null;
  members: string | null;
};

type LicenseAlert = {
  employeeName: string;
  licenseName: string;
  expiryDate: string;
  diffDays: number;
};

export default function AdminPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [licenseAlerts, setLicenseAlerts] = useState<LicenseAlert[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        alert("ログインしてください");
        window.location.href = "/login";
        return;
      }

      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select("role")
        .eq("auth_user_id", user.id)
        .single();

      if (employeeError || employee?.role !== "admin") {
        alert("管理者のみ閲覧できます");
        window.location.href = "/reports";
        return;
      }

      const { data, error } = await supabase
        .from("daily_reports")
        .select(
          "id, report_date, worker_name, site_name, shift_type, start_time, end_time, worker_count, vehicle_count, driver_name, note, expressway_main, expressway_secondary, expressway_subcontract, parking_main, parking_secondary, parking_subcontract, fuel_gasoline, fuel_diesel, work_description, members"
        )
        .order("created_at", { ascending: false });

      if (error) {
        alert("取得失敗: " + error.message);
        return;
      }

      setReports(data ?? []);

      const { data: licenses } = await supabase
        .from("licenses")
        .select("employee_id, license_name, expiry_date");

      const { data: employees } = await supabase
        .from("employees")
        .select("id, name");

      if (licenses && employees) {
        const employeeMap = new Map(
          employees.map((employee) => [employee.id, employee.name])
        );

        const today = new Date();

        const alerts = licenses
          .map((license) => {
            if (!license.expiry_date) return null;

            const expiry = new Date(license.expiry_date);
            const diffTime = expiry.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 30) {
              return {
                employeeName: employeeMap.get(license.employee_id) ?? "不明",
                licenseName: license.license_name,
                expiryDate: license.expiry_date,
                diffDays,
              };
            }

            return null;
          })
          .filter(Boolean) as LicenseAlert[];

        setLicenseAlerts(alerts);
      }
    };

    fetchReports();
  }, []);

  const cardStyle = {
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
  } as const;

  const filteredReports = reports.filter((report) => {
    const keyword = searchKeyword.toLowerCase();
  
    return (
      report.worker_name?.toLowerCase().includes(keyword) ||
      report.site_name?.toLowerCase().includes(keyword) ||
      report.report_date?.includes(keyword)
    );
  });

  return (
    <div
      style={{
        maxWidth: 820,
        margin: "0 auto",
        padding: 16,
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: "0 0 12px 0" }}>管理者画面</h1>

        <a
  href="/admin/analytics/personal"
  style={{
    display: "inline-block",
    textDecoration: "none",
    backgroundColor: "#fff",
    color: "#111",
    padding: "12px 16px",
    borderRadius: 8,
    border: "1px solid #ccc",
    fontWeight: 600,
    fontSize: 14,
  }}
>
  個人別月次集計
</a>

<a
  href="/reports/summary"
  style={{
    textDecoration: "none",
    backgroundColor: "#fff",
    color: "#111",
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    border: "1px solid #ccc",
  }}
>
  個人別集計
</a>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <a
            href="/admin/users"
            style={{
              display: "inline-block",
              textDecoration: "none",
              backgroundColor: "#fff",
              color: "#111",
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid #ccc",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            社員一覧
          </a>

          <a
            href="/admin/users/new"
            style={{
              display: "inline-block",
              textDecoration: "none",
              backgroundColor: "#111",
              color: "#fff",
              padding: "12px 16px",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            ＋ 社員追加
          </a>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 12px 0" }}>免許期限アラート</h2>

        {licenseAlerts.length === 0 ? (
          <div style={cardStyle}>
            <p style={{ margin: 0 }}>期限が近い免許はありません</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {licenseAlerts.map((alert, index) => (
              <div
                key={index}
                style={{
                  ...cardStyle,
                  backgroundColor: alert.diffDays < 0 ? "#ffe5e5" : "#fff3cd",
                }}
              >
                <p style={{ margin: 0, fontWeight: "bold", fontSize: 16 }}>
                  {alert.employeeName}
                </p>
                <p style={{ margin: "8px 0 0 0" }}>免許: {alert.licenseName}</p>
                <p style={{ margin: "6px 0 0 0" }}>期限: {alert.expiryDate}</p>

                {alert.diffDays < 0 ? (
                  <p
                    style={{
                      margin: "8px 0 0 0",
                      color: "red",
                      fontWeight: "bold",
                    }}
                  >
                    ⚠️ 期限切れ
                  </p>
                ) : (
                  <p
                    style={{
                      margin: "8px 0 0 0",
                      color: "#b26a00",
                      fontWeight: "bold",
                    }}
                  >
                    ⚠️ あと{alert.diffDays}日
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 style={{ margin: "0 0 12px 0" }}>日報一覧</h2>

        <div style={{ marginBottom: 16 }}>
  <input
    type="text"
    placeholder="名前・現場・日付で検索"
    value={searchKeyword}
    onChange={(e) => setSearchKeyword(e.target.value)}
    style={{
      width: "100%",
      padding: 12,
      fontSize: 16,
      border: "1px solid #ccc",
      borderRadius: 8,
      boxSizing: "border-box",
    }}
  />
</div>

{filteredReports.length === 0 ? (
  <div style={cardStyle}>
    <p style={{ margin: 0 }}>データがありません</p>
  </div>
) : (
  <div style={{ display: "grid", gap: 12 }}>
    {filteredReports.map((report) => (
      <ReportSummaryCard key={report.id} report={report} />
    ))}
  </div>
)}
      </div>
    </div>
  );
}