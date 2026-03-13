"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

export default function AdminPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [licenseAlerts, setLicenseAlerts] = useState<any[]>([]);

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
    .filter(Boolean);

  setLicenseAlerts(alerts);
}
    };

    fetchReports();
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>管理者画面</h1>

      <h2 style={{ marginTop: 20 }}>免許期限アラート</h2>
      {licenseAlerts.length === 0 ? (
  <p>期限が近い免許はありません</p>
) : (
  <div style={{ display: "grid", gap: 12, marginTop: 12, marginBottom: 24 }}>
    {licenseAlerts.map((alert, index) => (
      <div
        key={index}
        style={{
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 14,
          backgroundColor: alert.diffDays < 0 ? "#ffe5e5" : "#fff3cd",
        }}
      >
        <p style={{ margin: 0, fontWeight: "bold" }}>{alert.employeeName}</p>
        <p style={{ margin: "6px 0 0 0" }}>免許: {alert.licenseName}</p>
        <p style={{ margin: "6px 0 0 0" }}>期限: {alert.expiryDate}</p>

        {alert.diffDays < 0 ? (
          <p style={{ margin: "6px 0 0 0", color: "red", fontWeight: "bold" }}>
            ⚠️ 期限切れ
          </p>
        ) : (
          <p style={{ margin: "6px 0 0 0", color: "#b26a00", fontWeight: "bold" }}>
            ⚠️ あと{alert.diffDays}日
          </p>
        )}
      </div>
    ))}
  </div>
)}

      {reports.length === 0 ? (
        <p>データがありません</p>
      ) : (
        <div>
          {reports.map((report) => (
            <div
              key={report.id}
              style={{
                border: "1px solid #ccc",
                padding: 16,
                marginBottom: 12,
              }}
            >
              <p>日付: {report.report_date}</p>
              <p>名前: {report.worker_name}</p>
              <p>現場名: {report.site_name}</p>
              <p>区分: {report.shift_type === "day" ? "昼" : "夜"}</p>
              <p>開始時間: {report.start_time}</p>
              <p>終了時間: {report.end_time}</p>
              <p>稼働人数: {report.worker_count}</p>
              <p>車両台数: {report.vehicle_count}</p>
              <p>車両運転手: {report.driver_name}</p>
              <p>高速料金（本体）: {report.expressway_main}</p>
              <p>高速料金（二次受け）: {report.expressway_secondary}</p>
              <p>高速料金（下請け）: {report.expressway_subcontract}</p>
              <p>駐車場料金（本体）: {report.parking_main}</p>
              <p>駐車場料金（二次受け）: {report.parking_secondary}</p>
              <p>駐車場料金（下請け）: {report.parking_subcontract}</p>
              <p>燃料代（ガソリン）: {report.fuel_gasoline}</p>
              <p>燃料代（軽油）: {report.fuel_diesel}</p>
              <p>メンバー: {report.members}</p>
              <p>作業内容: {report.work_description}</p>
              <p>備考: {report.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}