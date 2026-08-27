"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackButton from "@/app/components/BackButton";
import {
  createEmployeeRosterDraft,
  deleteEmployeeRosterDraft,
  loadSavedEmployeeRosters,
} from "./employee-roster-document-api";
import type { EmployeeRoster } from "./employee-roster-types";

export default function EmployeeRosterPage() {
  const router = useRouter();

  const [rosters, setRosters] = useState<EmployeeRoster[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<
    string | null
  >(null);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const result = await loadSavedEmployeeRosters();
      setRosters(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "保存済み名簿を取得できませんでした"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    setCreating(true);
    setErrorMessage("");

    try {
      const roster = await createEmployeeRosterDraft();

      router.push(
        `/admin/employee-roster/rosters/${roster.id}`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "新しい名簿を作成できませんでした"
      );

      setCreating(false);
    }
  };

  const handleDelete = async (roster: EmployeeRoster) => {
    const confirmed = window.confirm(
      `「${roster.title}」の下書きを削除しますか？`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(roster.id);
    setErrorMessage("");

    try {
      await deleteEmployeeRosterDraft(roster.id);

      setRosters((previous) =>
        previous.filter((item) => item.id !== roster.id)
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "下書きを削除できませんでした"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: 20,
      }}
    >
      <BackButton />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          marginTop: 20,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ margin: 0, marginBottom: 8 }}>
            作業員名簿
          </h1>

          <p style={{ margin: 0, color: "#6b7280" }}>
            掲載する作業員を選択し、名簿を保存・
            印刷します。
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <Link
            href="/admin/employee-roster/workers"
            style={{
              padding: "11px 14px",
              border: "1px solid #d1d5db",
              borderRadius: 9,
              color: "#111827",
              backgroundColor: "#fff",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            作業員情報を管理
          </Link>

          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            style={{
              padding: "11px 16px",
              border: "none",
              borderRadius: 9,
              color: "#fff",
              backgroundColor: creating
                ? "#6b7280"
                : "#111827",
              fontWeight: 700,
              cursor: creating
                ? "not-allowed"
                : "pointer",
            }}
          >
            {creating
              ? "作成中..."
              : "＋ 新しい名簿を作成"}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          style={{
            padding: 14,
            marginBottom: 18,
            color: "#991b1b",
            backgroundColor: "#fee2e2",
            borderRadius: 10,
          }}
        >
          {errorMessage}
        </div>
      )}

      {loading && <p>読み込み中...</p>}

      {!loading && rosters.length === 0 && (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "#6b7280",
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
          }}
        >
          保存された作業員名簿はありません。
        </div>
      )}

      {!loading && rosters.length > 0 && (
        <div
          style={{
            overflowX: "auto",
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: 800,
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f3f4f6" }}>
                <th style={headerStyle}>名簿名</th>
                <th style={headerStyle}>事業所名</th>
                <th style={headerStyle}>状態</th>
                <th style={headerStyle}>最終更新</th>
                <th style={headerStyle}>操作</th>
              </tr>
            </thead>

            <tbody>
              {rosters.map((roster) => (
                <tr key={roster.id}>
                  <td style={cellStyle}>
                    <strong>{roster.title}</strong>
                  </td>

                  <td style={cellStyle}>
                    {roster.business_office_name ||
                      "未設定"}
                  </td>

                  <td style={cellStyle}>
                    <StatusLabel status={roster.status} />
                  </td>

                  <td style={cellStyle}>
                    {formatDateTime(roster.updated_at)}
                  </td>

                  <td style={cellStyle}>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                      }}
                    >
                      <Link
                        href={`/admin/employee-roster/rosters/${roster.id}`}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          color: "#fff",
                          backgroundColor: "#111827",
                          textDecoration: "none",
                          fontWeight: 700,
                        }}
                      >
                        {roster.status === "draft"
                          ? "編集"
                          : "確認・印刷"}
                      </Link>

                      {roster.status === "draft" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(roster)
                          }
                          disabled={
                            deletingId === roster.id
                          }
                          style={{
                            padding: "8px 12px",
                            border:
                              "1px solid #fecaca",
                            borderRadius: 8,
                            color: "#b91c1c",
                            backgroundColor: "#fff",
                            fontWeight: 700,
                            cursor:
                              deletingId === roster.id
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {deletingId === roster.id
                            ? "削除中..."
                            : "削除"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function StatusLabel({
  status,
}: {
  status: EmployeeRoster["status"];
}) {
  const finalized = status === "finalized";

  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 10px",
        borderRadius: 999,
        color: finalized ? "#166534" : "#92400e",
        backgroundColor: finalized
          ? "#dcfce7"
          : "#fef3c7",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {finalized ? "確定済み" : "下書き"}
    </span>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const headerStyle: React.CSSProperties = {
  padding: 12,
  borderBottom: "1px solid #d1d5db",
  textAlign: "left",
  whiteSpace: "nowrap",
};

const cellStyle: React.CSSProperties = {
  padding: 12,
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
};