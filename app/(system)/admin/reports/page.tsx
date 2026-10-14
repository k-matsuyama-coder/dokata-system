"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";
import { hasRole } from "@/app/types/auth";
import { useAppRefresh } from "@/app/hooks/useAppRefresh";
import { withTimeout } from "@/lib/withTimeout";

type Report = {
  id: string;
  report_date: string;
  worker_name: string;
  site_name: string;
};

export default function ReportsAdminPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const deletingRef = useRef(false);
  const refreshVersion = useAppRefresh();
const [retryCount, setRetryCount] = useState(0);
const [loading, setLoading] = useState(true);
const [loadError, setLoadError] = useState("");

const listControllerRef = useRef<AbortController | null>(null);
const loadedOrganizationRef = useRef("");
  const getCurrentOrganization = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
  
    if (!token) return null;
  
    const res = await fetch("/api/current-organization", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  
    const result = await res.json();
  
    if (!res.ok) return null;
  
    return result.organizationId as string | null;
  };

  useEffect(() => {
    // 削除処理が終わると、isDeleting の変更で再取得する
    if (isDeleting) {
      setLoading(false);
      return;
    }
  
    let active = true;
    const controller = new AbortController();
    listControllerRef.current = controller;
  
    setLoading(true);
    setLoadError("");
  
    const fetchReports = async () => {
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
          .select("role")
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
  
      if (
        !employeeResult.data ||
        !hasRole(employeeResult.data.role, "admin")
      ) {
        throw new Error("日報管理を利用する権限を確認できませんでした。");
      }
  
      const currentOrganizationId =
        organization.organizationId as string | null;
  
      if (!currentOrganizationId) {
        throw new Error("会社情報を確認できませんでした。");
      }
  
      // 別会社の一覧に切り替わった状態で、古いモーダルから削除しない
      if (
        loadedOrganizationRef.current &&
        loadedOrganizationRef.current !== currentOrganizationId
      ) {
        throw new Error(
          "会社情報が変わりました。確認モーダルを閉じて画面を開き直してください。"
        );
      }
  
      if (controller.signal.aborted) {
        throw new Error("取得を中断しました。");
      }
  
      const { data, error } = await supabase
        .from("daily_reports")
        .select("id, report_date, worker_name, site_name")
        .eq("organization_id", currentOrganizationId)
        .order("report_date", { ascending: false })
        .abortSignal(controller.signal);
  
      if (error) throw error;
  
      return {
        organizationId: currentOrganizationId,
        reports: data ?? [],
      };
    };
  
    const run = async () => {
      try {
        const result = await withTimeout(
          fetchReports(),
          20000,
          "日報一覧の取得に時間がかかっています。再試行してください。"
        );
  
        if (
          !active ||
          controller.signal.aborted ||
          deletingRef.current
        ) {
          return;
        }
  
        loadedOrganizationRef.current = result.organizationId;
        setOrganizationId(result.organizationId);
        setReports(result.reports);
      } catch (error) {
        if (!active || controller.signal.aborted) return;
  
        console.error("日報管理の一覧取得失敗:", error);
        setLoadError(
          error instanceof Error
            ? error.message
            : "日報一覧を取得できませんでした。再試行してください。"
        );
      } finally {
        controller.abort();
  
        if (listControllerRef.current === controller) {
          listControllerRef.current = null;
        }
  
        if (active) {
          setLoading(false);
        }
      }
    };
  
    void run();
  
    return () => {
      active = false;
      controller.abort();
  
      if (listControllerRef.current === controller) {
        listControllerRef.current = null;
      }
    };
  }, [refreshVersion, retryCount, isDeleting]);

  const handleDelete = async () => {
    if (!deleteTarget || deletingRef.current) return;

    deletingRef.current = true;
listControllerRef.current?.abort();
setIsDeleting(true);
    setDeleteError("");

    try {
      const currentOrganizationId = await getCurrentOrganization();

      if (
        !currentOrganizationId ||
        currentOrganizationId !== organizationId
      ) {
        throw new Error("会社情報が変わりました。画面を開き直してください。");
      }

      const { data, error } = await supabase
        .from("daily_reports")
        .delete()
        .eq("id", deleteTarget.id)
        .eq("organization_id", organizationId)
        .select("id")
        .single();

      if (error) throw error;
      if (!data) throw new Error("削除結果を確認できませんでした。");

      setReports((previous) =>
        previous.filter((report) => report.id !== data.id)
      );

      deleteDialogRef.current?.close();
      setDeleteTarget(null);
    } catch (error) {
      console.error("日報削除失敗:", error);
      setDeleteError(
        "削除を完了できませんでした。権限・通信状態を確認してください。"
      );
    } finally {
      deletingRef.current = false;
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
      <BackButton />

      <h1>日報管理</h1>

      <dialog
        ref={deleteDialogRef}
        aria-labelledby="delete-report-title"
        onCancel={(event) => {
          if (deletingRef.current) event.preventDefault();
        }}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError("");
        }}
        style={{
          width: "calc(100% - 32px)",
          maxWidth: 440,
          boxSizing: "border-box",
          border: "none",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h2 id="delete-report-title" style={{ marginTop: 0 }}>
          本当に削除しますか？
        </h2>

        <p>この日報と、紐づくメンバーの記録を削除します。</p>

        <div
          style={{
            backgroundColor: "#f3f4f6",
            padding: 12,
            borderRadius: 8,
          }}
        >
          <div>日付：{deleteTarget?.report_date}</div>
          <div>名前：{deleteTarget?.worker_name}</div>
          <div>現場：{deleteTarget?.site_name}</div>
        </div>

        <p style={{ color: "#dc2626" }}>
          削除すると元に戻せません。
        </p>

        {deleteError && (
          <p role="alert" style={{ color: "#dc2626" }}>
            {deleteError}
          </p>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: 20,
          }}
        >
          <button
            type="button"
            autoFocus
            disabled={isDeleting}
            onClick={() => deleteDialogRef.current?.close()}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid #ccc",
              backgroundColor: "#fff",
            }}
          >
            キャンセル
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "#dc2626",
              color: "#fff",
            }}
          >
            {isDeleting ? "削除中..." : "削除する"}
          </button>
        </div>
      </dialog>

      {/* 🔥 CSV一括登録 */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: "bold" }}>CSV一括登録</p>

        <button
  onClick={() => {
    const header = [
        "日付",
        "名前",
        "現場",
        "勤務",
        "開始",
        "終了",
        "人工",
        "車両",
        "運転者",
        "備考",
        "高速(元請)",
        "高速(下請)",
        "高速(協力)",
        "駐車(元請)",
        "駐車(下請)",
        "駐車(協力)",
        "ガソリン",
        "軽油",
        "作業内容",
        "メンバー",
      ];

      const sample = [
        [
          "2026-04-01",
          "山田太郎",
          "東京現場",
          "day",
          "08:00",
          "17:00",
          "3",
          "2",
          "佐藤",
          "通常",
          "1000",
          "500",
          "0",
          "300",
          "200",
          "0",
          "4000",
          "0",
          "舗装作業",
          "田中,鈴木",
        ],
      ];

    const csv =
      [header, ...sample]
        .map((row) => row.join(","))
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "daily_reports_template.csv";
    a.click();

    URL.revokeObjectURL(url);
  }}
  style={{
    marginBottom: 12,
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #ccc",
    backgroundColor: "#fff",
    cursor: "pointer",
  }}
>
  テンプレートダウンロード
</button>

        <input
          type="file"
          accept=".csv"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const currentOrganizationId = await getCurrentOrganization();

if (!currentOrganizationId) {
  alert("会社情報が取得できません");
  return;
}

            const text = await file.text();
            const rows = text.split("\n").map((r) => r.split(","));

            const dataRows = rows.slice(1);

            const insertData = dataRows
              .filter((r) => r.length >= 6)
              .map((r) => ({
                organization_id: currentOrganizationId,
                report_date: r[0],
                worker_name: r[1],
                site_name: r[2],
                shift_type: r[3],
                start_time: r[4],
                end_time: r[5],
                worker_count: Number(r[6] || 0),
                vehicle_count: Number(r[7] || 0),
                driver_name: r[8] || null,
                note: r[9] || null,
                expressway_main: Number(r[10] || 0),
                expressway_secondary: Number(r[11] || 0),
                expressway_subcontract: Number(r[12] || 0),
                parking_main: Number(r[13] || 0),
                parking_secondary: Number(r[14] || 0),
                parking_subcontract: Number(r[15] || 0),
                fuel_gasoline: Number(r[16] || 0),
                fuel_diesel: Number(r[17] || 0),
                work_description: r[18] || null,
                members: r[19] || null,
              }));

            const { error } = await supabase
              .from("daily_reports")
              .insert(insertData);

            if (error) {
              alert("登録失敗: " + error.message);
              return;
            }

            alert("CSV登録完了");
setRetryCount((count) => count + 1);
          }}
        />
      </div>

      {/* 日報一覧 */}
      <div>
        <h2>日報一覧</h2>

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
      disabled={loading || isDeleting}
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
  !loading && !loadError ? <p>データなし</p> : null
) : (
          <div style={{ display: "grid", gap: 10 }}>
            {reports.map((r) => (
              <div
                key={r.id}
                style={{
                  border: "1px solid #ddd",
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                <p style={{ margin: 0 }}>{r.report_date}</p>
                <p style={{ margin: 0 }}>{r.worker_name}</p>
                <p style={{ margin: 0 }}>{r.site_name}</p>

                <a
  href={`/reports/${r.id}/edit`}
  style={{
    display: "inline-block",
    marginTop: 8,
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

<button
  type="button"
  disabled={!organizationId || isDeleting}
  onClick={() => {
    setDeleteTarget(r);
    setDeleteError("");
    deleteDialogRef.current?.showModal();
  }}
  style={{
    marginLeft: 8,
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #dc2626",
    backgroundColor: "#fff",
    color: "#dc2626",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  }}
>
  削除
</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}