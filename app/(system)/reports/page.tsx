"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ReportSummaryCard from "@/app/components/ReportSummaryCard";
import { useAppRefresh } from "@/app/hooks/useAppRefresh";
import { withTimeout } from "@/lib/withTimeout";


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

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
const [loading, setLoading] = useState(true);
const [loadError, setLoadError] = useState("");
const [retryCount, setRetryCount] = useState(0);
const refreshVersion = useAppRefresh();

useEffect(() => {
  let active = true;
  const controller = new AbortController();

  setLoading(true);
  setLoadError("");

  const fetchReports = async (): Promise<Report[]> => {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (controller.signal.aborted) {
      throw new Error("取得を中断しました。");
    }

    const session = sessionData.session;

    if (!session) {
      throw new Error(
        "ログイン情報を確認できません。ログインし直してください。"
      );
    }

    const [organizationResponse, employeeResult] = await Promise.all([
      fetch("/api/current-organization", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        signal: controller.signal,
      }),

      supabase
        .from("employees")
        .select("name")
        .eq("auth_user_id", session.user.id)
        .abortSignal(controller.signal)
        .single(),
    ]);

    if (!organizationResponse.ok) {
      throw new Error("会社情報を取得できませんでした。");
    }

    const organization = await organizationResponse.json();

    if (employeeResult.error) {
      throw employeeResult.error;
    }

    const employee = employeeResult.data;
    const organizationId = organization.organizationId;

    if (!employee?.name || !organizationId) {
      throw new Error("社員・会社情報を確認できませんでした。");
    }

    if (controller.signal.aborted) {
      throw new Error("取得を中断しました。");
    }

    const { data, error } = await supabase
      .from("daily_reports")
      .select(
        "id, report_date, worker_name, site_name, shift_type, start_time, end_time, worker_count, vehicle_count, driver_name, note, expressway_main, expressway_secondary, expressway_subcontract, parking_main, parking_secondary, parking_subcontract, fuel_gasoline, fuel_diesel, work_description, members"
      )
      .eq("organization_id", organizationId)
      .eq("worker_name", employee.name)
      .order("created_at", { ascending: false })
      .abortSignal(controller.signal);

    if (error) throw error;

    return data ?? [];
  };

  const run = async () => {
    try {
      const data = await withTimeout(
        fetchReports(),
        20000,
        "日報一覧の取得に時間がかかっています。再試行してください。"
      );

      if (active) {
        setReports(data);
      }
    } catch (error) {
      if (!active) return;

      console.error("日報一覧取得失敗:", error);
      setLoadError(
        error instanceof Error
          ? error.message
          : "日報一覧を取得できませんでした。再試行してください。"
      );
    } finally {
      controller.abort();

      if (active) {
        setLoading(false);
      }
    }
  };

  void run();

  return () => {
    active = false;
    controller.abort();
  };
}, [refreshVersion, retryCount]);

  return (
    <div style={{ padding: 40 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ margin: 0 }}>日報一覧</h1>

        <Link
  href="/reports/new"
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
          ＋ 日報を新規登録
          </Link>
      </div>

      {loadError && (
  <div
    role="alert"
    style={{
      padding: 12,
      marginBottom: 16,
      backgroundColor: "#fff3cd",
      borderRadius: 8,
    }}
  >
    <p style={{ margin: "0 0 8px" }}>{loadError}</p>

    <button
      type="button"
      disabled={loading}
      onClick={() => {
        setLoading(true);
        setLoadError("");
        setRetryCount((count) => count + 1);
      }}
    >
      再試行
    </button>
  </div>
)}

{loading && (
  <p role="status">
    {reports.length > 0 ? "一覧を更新しています…" : "取得中…"}
  </p>
)}

{reports.length === 0 ? (
  !loading && !loadError ? <p>データがありません</p> : null
) : (
        <div>
          {reports.map((report) => (
            <div key={report.id} style={{ marginBottom: 12 }}>
              <ReportSummaryCard report={report} />

              <div style={{ marginTop: 8 }}>
                <a
                  href={`/reports/${report.id}/edit`}
                  style={{
                    display: "inline-block",
                    textDecoration: "none",
                    backgroundColor: "#111",
                    color: "#fff",
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  編集
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}